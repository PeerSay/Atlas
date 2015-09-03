var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var swig = require('swig');

// Custom filters
//
swig.setFilter('percent', function (input) {
    return Math.round(input * 100);
});

swig.setFilter('skip_group', function (input) {
    // Used to prevent exception in swig on parsing the following expression in tpl,
    // which is apparently a bug in swig
    return input().skip(2);
});

var tableModel = require(appRoot + '/static/js/projects/table-model');
var config = require(appRoot + '/app/config');
var PRESENTATION_FILE = path.join(appRoot, '/static/tpl/presentation.html');


function renderTemplate(project, logoUrl) {
    var settings = project.presentation.data;
    var user = project.collaborators[0]; // requires .populate()
    var userName = (user.name || {}).full || '';
    var titlePage = {
        title: project.title,
        date: moment().format('DD/M/YYYY'),
        user: {
            email: user.email,
            name: userName
        },
        logoUrl: logoUrl // may be empty
    };
    var reqs = {
        include: settings.requirements.include,
        list: []
    };
    var prods = {
        include: settings.products.include,
        list: []
    };
    var table = {
        include: settings.table.include,
        topics: null,
        superTopic: null
    };

    if (reqs.include) {
        reqs.list = getRequirementsTable(project.requirements);
    }
    if (prods.include) {
        prods.list = getProductsTable(project.products, project.table);
    }
    if (table.include && project.table.length) {
        table.topics = getTopicsTable(_.filter(project.table, {selected: true}), project.topicWeights);
        //table.superTopic = getSuperTopicTable(model);
    }

    var locals = _.extend({}, settings, {
        server: config.web.server_url,
        title: titlePage,
        requirements: reqs,
        products: prods,
        table: table
    });
    //console.log('>>>Locals:', locals);

    // TODO - move on top to compile & cache
    var presentationTpl = swig.compileFile(PRESENTATION_FILE);

    return presentationTpl(locals);
}

// Requirements slide
//
function getRequirementsTable(reqs) {
    var res = _(reqs).filter({mandatory: true}).map(function (it) {
        return _.pick(it, 'name', 'description');
    }).value();
    return [res];

}

function getProductsTable(products, table) {
    var res = products;
    var prodIdx = products.reduce(function (acc, cur) {
        acc[cur.name] = cur;
        return acc;
    }, {});

    _.forEach(table, function (req) {
        if (!req.mandatory) { return; }

        _.forEach(req.products, function (prod) {
            if (prod.grade === 0) {
                prodIdx[prod.name].warning = true;
                prodIdx[prod.name].description = 'Did not meet mandatory requirements';
            }
        });
    });

    return [res];
}

function getTopicsTable(reqs, topicWeights) {
    var res = {};
    var model = tableModel.build(function (T) {
        T.header()
            .push('name', {label: '', 'class': 'name center'})
            .push('weight', {label: 'Weight', 'class': 'min center'});
        T.footer()
            .push('name', {label: 'Overall Grade'})
            .push('weight', {label: '100%', 'class': 'center'});

        reqs.forEach(function (req, i) {
            // Predefine ranges
            var groupsRange = T.range('groups', {multi: true});
            var groupRange = groupsRange(req.topic);
            var rowWeightRange = T.range('req-weights', {multi: true})(req.topic)
                .aggregate({
                    total: T._sum(),
                    weight: reqWeightFn()
                });
            rowWeightRange.push('', {value: req.weight});

            // Group row
            var groupWeight = _.findWhere(topicWeights, {topic: req.topic}).weight;
            groupRange
                .push('name', {label: req.topic})
                .push('weight', {value: groupWeight});

            req.products.forEach(function (prod, j) { // TODO - sorted + top 3
                if (!prod.selected) { return; }

                var prodGradeKey = 'prod-grade-' + j;
                var prodsGradesInGroupRange = T.range('prod-group-grades-' + j, {multi: true})(req.topic)
                    .push('', {value: prod.grade});

                T.header()
                    .push(prodGradeKey, {label: prod.name, 'class': 'center grade'});

                // Group grade
                groupRange
                    .push(prodGradeKey, {
                        value: groupGradeFn(rowWeightRange, prodsGradesInGroupRange),
                        max: i % 2
                    });

                // Footer - totals
                var maxTotalsRange = T.range('total-max')
                    .aggregate({
                        max: T._max(function (obj) {
                            return obj.value(); // default (T._val) assumes .value is not func
                        })
                    });
                if (i === 0) { // during first run only!
                    maxTotalsRange.push(prodGradeKey, {
                        value: totalGradeFn(groupsRange, topicWeights, prodGradeKey)
                    });
                }

                T.footer()
                    .push(prodGradeKey, {
                        value: totalGradeGetFn(maxTotalsRange, prodGradeKey),
                        maxTotal: maxTotalFn(maxTotalsRange, prodGradeKey),
                        'class': 'center'
                    });
            });
        });
    });

    res.header = model.header().list;
    res.footer = model.footer().list;
    res.groups = model.groups && model.groups().list;

    return res;
}

//Functions
//
function reqWeightFn() {
    return function (range) {
        return function (val) {
            var total = range.total(); // aggregated
            return total ? val / total : 0;
        };
    };
}

function groupGradeFn(rowWeightRange, prodsGradesInGroupRange) {
    return function () {
        var groupGrade = prodsGradesInGroupRange.list.reduce(function (acc, item, i) {
            var grade = item().value || 0; // null if grade is not init
            var weightModel = rowWeightRange.access(i)();
            var weight = rowWeightRange.weight(weightModel.value); // aggregated
            return acc + grade * weight;
        }, 0);

        return Math.round(groupGrade * 10) / 10;
    };
}

function totalGradeGetFn(maxTotalsRange, prodKey) {
    return function () {
        return maxTotalsRange.access(prodKey)().value();
    };
}

function totalGradeFn(groupsRange, topicWeights, prodKey) {
    return function () {
        var totalGrade = topicWeights.reduce(function (acc, cur) {
            var weight = cur.weight;
            var grade = groupsRange(cur.topic).access(prodKey)().value();
            return acc + grade * weight;
        }, 0);
        return Math.round(totalGrade * 10) / 10;
    };
}

function maxTotalFn(maxTotalsRange, prodKey) {
    return function () {
        var max = maxTotalsRange.max();
        var val = maxTotalsRange.access(prodKey)().value();
        return (max === val);
    };
}




function getSuperTopicTable(model) {
    var headers = _.map(model.columns, function (col) {
        return col.header.label;
    });

    var groups = buildGroups(model.groups);
    var superTopic = findSuperTopic(model, groups);
    var groupObj = tableModel.groups.get(superTopic.name);

    var rows = [];
    _.forEach(groupObj.rows, function (row) {
        var cells = _.map(row.cells, function (cell) {
            return (cell.type === 'static') ? cell.label :
                (cell.type === 'icon') ? !!cell.label : cell.model.toString();
        });
        rows.push(cells);
    });
    //console.log('>> rows', rows);

    var footers = _.map(model.columns, function (col) {
        var foot = col.footer;
        var label = (foot.type === 'static') ? foot.label :
            (foot.type === 'func') ? foot.model && foot.model.value() : '';
        return label;
    });

    return {
        headers: headers,
        groups: [superTopic],
        rows: rows,
        footers: footers
    }
}



function findSuperTopic(model, groups) {
    var winnerCols = _.filter(model.columns, function (col) {
        var foot = col.footer;
        return (foot.type === 'func') && foot.model.max();
    });
    var winnerGradeIdxs = _.map(winnerCols, function (col) {
        var colIdx = model.columns.indexOf(col);
        return (colIdx - 4) / 2; // grade idx = 2i + 4
    });

    _.forEach(groups, function (group) {
        group.score = 0;
        _.forEach(winnerGradeIdxs, function (idx) {
            group.score += group.grades[idx] * group.weight;
        });
    });

    var winner = groups.reduce(function (acc, cur) {
        return (acc.score < cur.score) ? cur : acc;
    }, groups[0]);

    return winner;
}

module.exports = {
    renderTemplate: renderTemplate
};
