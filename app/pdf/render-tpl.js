var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var swig = require('swig');

var tableModel = require('../../app/pdf/table-model').TableModel();

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
        topics: []
    };

    if (reqs.include) {
        reqs.list = splitListFn(4)(_.filter(project.requirements, {mandatory: true}));
    }
    if (prods.include) {
        prods.list = splitListFn(4)(project.products);
    }
    if (table.include) {
        //table.topics = getTableTopics(project.table);
    }

    var locals = _.extend({}, settings, {title: titlePage}, {requirements: reqs}, {products: prods});

    //console.log('>>>Locals:', locals);

    var presentationTpl = swig.compileFile(path.join(__dirname, '../../static/tpl/presentation.html'));

    return presentationTpl(locals);
}

function getTableTopics(table) {
    var model = tableModel.build(table);

    return {
        columns: model.columns
    };
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
