var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var swig = require('swig');

var tableModel = require('../../static/js/projects/table-model');

function renderTemplate(project) {
    var settings = project.presentation.data;
    var user = project.collaborators[0]; // requires .populate()
    var titlePage = {
        title: project.title,
        date: moment().format('DD/M/YYYY'),
        user: {
            email: user.email,
            name: (user.name || {}).full || ''
        },
        logoUrl: settings.logo.image.url
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
        topics: null
    };

    if (reqs.include) {
        reqs.list = splitListFn(4)(_.filter(project.requirements, {mandatory: true}));
    }
    if (prods.include) {
        prods.list = splitListFn(4)(project.products);
    }
    if (table.include && project.table.length) {
        var model = tableModel.buildModel(project.table);
        model.groups = initGroups(model);
        table.topics = getTopicsTable(model);
    }

    var locals = _.extend({}, settings, {title: titlePage}, {requirements: reqs}, {products: prods}, {table: table});
    //console.log('>>>Locals:', locals);

    var presentationTpl = swig.compileFile(path.join(__dirname, '../../static/tpl/presentation.html'));

    return presentationTpl(locals);
}

function getTopicsTable(model) {
    var headerSubst = {
        'Mandatory': ' ', // space!
        'Requirement': 'Topic'
    };
    var headers = _.map(model.columns, function (col) {
        var label = col.header.label;
        return headerSubst[label] || label;
    });
    //console.log('>>Headers', headers);

    var footers = _.map(model.columns, function (col) {
        var foot = col.footer;
        var label = '';
        if (foot.type === 'static') {
            label = foot.label;
        } else if (foot.type === 'func') {
            label = foot.model ? foot.model.value() : '';
        }
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

function initGroups(model) {
    var groupIdx = {};
    _.forEach(model.rows, function (row) {
        var key = tableModel.groups.add(row);
        var group = groupIdx[key] = groupIdx[key] || [];
        group.push(row);
    });
    return groupIdx;
}

function buildGroups(groupIdx) {
    var groups = [];
    _.forEach(groupIdx, function (rows, key) {
        var groupObj = tableModel.groups.get(key);
        var group = {
            name: key,
            weight: groupObj.weight(),
            grades: []
        };
        _.forEach(groupObj.grades, function (obj) {
            group.grades.push(obj.grade());
        });

        groups.push(group);
    });
    return groups;
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
