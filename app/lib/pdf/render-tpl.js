var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var swig = require('swig');

// Custom filters
//
swig.setFilter('percent', function (input) {
    return Math.round(input * 100);
});

swig.setFilter('skip_group', function (input, num) {
    // Used to prevent exception in swig on parsing the following expression in tpl,
    // which is apparently a bug in swig
    return input().skip(Number(num));
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
        var model = buildModel(_.filter(project.table, {selected: true}), project.topicWeights);
        var superTopic = findSuperTopic(project.topicWeights);

        table.topics = getTopicsTable(model);
        table.superTopic = getSingleTopicTable(model, superTopic);
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

function buildModel(reqs, topicWeights) {
    return tableModel.build(function (T) {
        T.header()
            .push('name', {label: '', 'class': 'name center'})
            .push('weight', {label: 'Weight', 'class': 'min center'});
        T.footer()
            .push('name', {label: 'Overall Grade'})
            .push('weight', {label: '100%', 'class': 'center'});

        reqs.forEach(function (req, i) {
            // Predefine ranges
            var groupsRange = T.range('groups', {multi: true});
            var groupRange = groupsRange(req.topic, {topic: req.topic});
            var groupMaxRange = T.range('group-max-' + req.topic)
                .aggregate({
                    max: T._max(function (obj) {
                        return obj.value(); // default (T._val) assumes .value is not func
                    })
                });
            var rowRange = T.rows(i, {topic: req.topic});
            var rowMaxRange = T.range('row-max-' + i)
                .aggregate({
                    max: T._max()
                });
            var rowWeightRange = T.range('req-weights', {multi: true})(req.topic)
                .aggregate({
                    total: T._sum(),
                    weight: reqWeightFn()
                });
            var maxTotalsRange = T.range('total-max')
                .aggregate({
                    max: T._max(function (obj) {
                        return obj.value(); // default (T._val) assumes .value is not func
                    })
                });


            // Group row
            var groupWeight = _.findWhere(topicWeights, {topic: req.topic}).weight;
            groupRange
                .push('name', {label: req.topic})
                .push('weight', {value: groupWeight});

            // Req row
            var weightValue = {value: req.weight};
            rowWeightRange.push('', weightValue);
            rowRange
                .push('name', {value: req.name})
                .push('weight', {
                    value: reqWeightPercentFn(rowWeightRange, weightValue),
                    type: 'func'
                });


            req.products.forEach(function (prod, j) { // TODO - sorted + top 3
                if (!prod.selected) { return; }

                var prodGradeKey = 'prod-grade-' + j;

                T.header()
                    .push(prodGradeKey, {label: prod.name, 'class': 'center grade'});

                // Prod grades
                var prodGradeValue = {value: prod.grade};
                var gradeStr = (prod.grade == null) ? '?' : prod.grade; // '?' for not-init
                rowMaxRange.push('', prodGradeValue);
                rowRange
                    .push(prodGradeKey, {
                        value: gradeStr,
                        maxInRow: maxInRangeFn(rowMaxRange, prodGradeValue)
                    });

                // Group grades
                var prodsGradesInGroupRange = T.range('prod-group-grades-' + j, {multi: true})(req.topic)
                    .push('', prodGradeValue);
                var groupGradeValue = {
                    value: groupGradeFn(rowWeightRange, prodsGradesInGroupRange)
                };
                groupMaxRange.push('', groupGradeValue);
                groupGradeValue.max = maxInRangeFn(groupMaxRange, groupGradeValue);
                groupRange
                    .push(prodGradeKey, groupGradeValue);

                // Footer - totals
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
}

//Functions
//
function maxInRangeFn(range, cell) {
    return function () {
        var val = (typeof cell.value === 'function') ? cell.value() : cell.value;
        var max = range.max(); // aggregated
        return (max === val);
    };
}

function reqWeightFn() {
    return function (range) {
        return function (val) {
            var total = range.total(); // aggregated
            return total ? val / total : 0;
        };
    };
}

function reqWeightPercentFn(range, cell) {
    return function () {
        var val = cell.value;
        var weight = range.weight(val); // aggregated
        var percent = Math.round(weight * 100) + '%';
        return percent;
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


// Getters
//
function getTopicsTable(model) {
    var res = {};
    res.header = model.header().list;
    res.footer = model.footer().list;
    res.groups = model.groups && model.groups().list;

    return res;
}


function getSingleTopicTable(model, topic) {
    var res = {};
    res.header = model.header().list;

    var topicGroup = _.find(model.groups().list, function (group) {
            return (group().topic === topic);
    });
    res.group = topicGroup;
    res.rows = model.rows().list.filter(function (row) {
        return (row().topic === topic);
    });

    return res;
}

function findSuperTopic(topicWeights) {
    var res = topicWeights.reduce(function (acc, it) {
        return it.weight > acc.weight ? it : acc;
    }, {weight: 0});

    return res.topic;
}


module.exports = {
    renderTemplate: renderTemplate
};
