var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var swig = require('swig');

var tableModel = require('../../static/js/projects/table-model');
var config = require('../../app/config');

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
    var model = tableModel.buildModel(project.table);

    if (reqs.include) {
        reqs.list = splitListFn(4)(_.filter(project.requirements, {mandatory: true}));
    }
    if (prods.include) {
        prods.list = getProductsTable(project.products, model);
    }
    if (table.include && project.table.length) {
        model.groups = initGroups(model);

        table.topics = getTopicsTable(model);
        table.superTopic = getSuperTopicTable(model);
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
    var presentationTpl = swig.compileFile(path.join(__dirname, '../../static/tpl/presentation.html'));

    return presentationTpl(locals);
}

function getProductsTable(products, model) {
    var res = products;
    var prodIdx = products.reduce(function (acc, cur) {
        acc[cur.name] = cur;
        return acc;
    }, {});


    var curProd = null;
    _.forEach(model.columns, function (col) {
        var header = col.header;
        if (header.class === 'text-input') {
            curProd = prodIdx[header.label];
        }
        if (!curProd) { return; }

        var cells = col.cells;
        var isGradeCol = (cells[0].class === 'grade');
        var anyMuted = isGradeCol && !!_.find(col.cells, function (cell) {
            return cell.model.muteProd();
        });

        if (anyMuted) {
            curProd.class = 'warning';
            curProd.warning = 'Did not meet mandatory requirements';
        }
    });

    return [res];
}

function getTopicsTable(model) {
    var headerSubst = {
        'Mandatory': ' ', // space!
        'Requirement': ' '
    };
    var headers = _.map(model.columns, function (col) {
        var label = col.header.label;
        return headerSubst[label] || label;
    });
    //console.log('>>Headers', headers);

    var footers = _.map(model.columns, function (col) {
        var foot = col.footer;
        var label = (foot.type === 'static') ? foot.label :
            (foot.type === 'func') ? foot.model && foot.model.value() : '';
        return label;
    });
    //console.log('>> footers', footers);

    var groups = buildGroups(model.groups);
    //console.log('>> Groups', groups);

    return {
        headers: headers,
        groups: groups,
        footers: footers
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

function initGroups(model) {
    var groupIdx = {};
    _.forEach(model.rows, function (row) {
        var key = tableModel.groups.add(row);
        var group = groupIdx[key] = groupIdx[key] || [];
        group.push(row);
    });
    return groupIdx;
}

function buildGroup(name) {
    var groupObj = tableModel.groups.get(name);
    var group = {
        name: name,
        weight: groupObj.weight(),
        grades: []
    };
    _.forEach(groupObj.grades, function (obj) {
        group.grades.push(obj.grade());
    });
    return group;
}

function buildGroups(groupIdx) {
    var groups = [];
    _.forEach(groupIdx, function (rows, key) {
        groups.push(buildGroup(key));
    });
    return groups;
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

function splitListFn(num) {
    // [] -> [[],[],..]
    return function (arr) {
        return arr.reduce(function (res, cur, i) {
            var idx = Math.floor(i / num);
            var bucket = res[idx] = res[idx] || [];
            bucket.push(cur);
            return res;
        }, []);
    };
}


module.exports = {
    renderTemplate: renderTemplate
};
