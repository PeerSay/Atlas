var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var jsonPatch = require('fast-json-patch');
var psShortId = require('./lib/short-id').psShortId;
var presentationSchema = require('./presentations').presentationSchema;
var fs = require('fs-extra');

var config = require('../../app/config');
var util = require('../../app/util');
var s3 = require('../../app/pdf/aws-s3');

var FILES_PATH = path.join(__dirname, '../../files');


// Presets
//
var durationLabelEnum = ['Days', 'Weeks', 'Months'];
var amountMultiplierEnum = ['----', 'Thousands'];
var currencyEnum = ['USD', 'EUR', 'GBP', 'ILS']; // ISO 4217 codes

// Schema
//
var projectSchema = new Schema({
    _id: psShortId,
    title: {type: String, required: true},
    creationDate: {type: Date, default: Date.now},
    collaborators: [
        {type: Schema.ObjectId, ref: 'User'}
    ],

    // Essentials
    //
    time: {
        startDate: {type: Date},
        duration: {type: Number, min: 0},
        durationLabel: {type: String, enum: durationLabelEnum, default: 'Weeks'},
        durationLabels: {type: String, default: durationLabelEnum.join(',')}
    },

    budget: {
        amount: {type: Number, min: 0},
        amountMultiplier: {type: String, enum: amountMultiplierEnum, default: '----'},
        amountMultipliers: {type: String, default: amountMultiplierEnum.join(',')},
        currencyLabel: {type: String, enum: currencyEnum, default: 'USD'},
        currencyLabels: {type: String, default: currencyEnum.join(',')}
    },

    notes: {
        reasons: {type: String, default: ''}, // Ensures parent is always created
        goals: {type: String},
        resources: {type: String},
        summary: {type: String},
        recommendations: {type: String}
    },

    // Criteria
    //
    requirements: [{
        name: {type: String, required: true},
        description: {type: String},
        topic: {type: String},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        selected: {type: Boolean}, // default?
        custom: {type: Boolean, default: false},
        mandatory: {type: Boolean, default: false}
    }],

    // Products
    //
    products: [{
        name: {type: String, required: true},
        description: {type: String},
        category: {type: String},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        selected: {type: Boolean},
        custom: {type: Boolean, default: false}
    }],

    // Categories:
    //
    selectedCategory: {type: String},
    categories: [{
        name: {type: String, required: true}, // TODO - verify uniqueness
        domain: {type: String},
        custom: {type: Boolean, default: false}
    }],

    // Table
    //
    table: [{
        reqId: {type: String, required: true},
        name: {type: String, required: true},
        topic: {type: String},
        weight: {type: Number, min: 0, max: 100, default: 1},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        mandatory: {type: Boolean, default: false},
        products: [{
            prodId: {type: String, required: true},
            name: {type: String, required: true},
            input: {type: String, default: ''},
            grade: {type: Number, min: 0, max: 10, default: 10},
            popularity: {type: Number, min: 0, max: 100, default: 0}
        }]
    }],

    // Presentation
    //
    presentation: presentationSchema.tree // Cannot nest single subdoc!
});
projectSchema.set('toJSON', {virtuals: true});


projectSchema.statics.createByUser = function (data, user, next) {
    var project = {
        title: data.category,
        selectedCategory: data.category,
        collaborators: [user._id],
        categories: []
    };

    // If category during creation is new, then add it to project's local list
    if (data.customCategory) {
        project.categories.push({
            name: data.category,
            custom: true
        });
    }

    Project.create(project, function (err, prj) {
        if (err) { return next(err); }

        // Create stub sub-doc
        user.projects.push({
            title: prj.selectedCategory,
            _ref: prj._id
        });

        user.save(function (err, user) {
            if (err) { return next(err); }

            var stub = _.find(user.projects, {_ref: prj._id});
            var stubDoc = user.projects.id(stub._id); // we get _id only after creation

            next(null, stubDoc);
        });
    });
};


projectSchema.statics.removeByUser = function (project_id, user, next) {
    Project.findOneAndRemove({_id: project_id}, function (err, doc) {
        if (err) { return next(err); }
        if (!doc) { return next(null, null); } // Not found!

        doc.remove(); // this triggers 'remove' hook

        // Remove stub sub-doc
        var stubPrj = _.find(user.projects, {_ref: project_id});
        user.projects.id(stubPrj._id).remove(); // mongoose can only remove by id().remove()

        user.save(function (err) {
            if (err) { return next(err); }

            next(null, stubPrj);
        });

        // TODO: remove collaborator's stubs
    });
};

// Pres-save hooks
//

projectSchema.pre('save', function ensureTitle(next) {
    var project = this;

    // Make up title after category
    if (!project.isModified('selectedCategory')) { return next(); }

    project.title = project.selectedCategory || '(None)';

    next();
});

projectSchema.pre('save', function ensureStubsUpdated(next) {
    var project = this;
    var id = project._id;

    // update titles of all collaborator's stubs
    if (!project.isModified('title')) { return next(); }

    Project
        .findById(id, 'collaborators')
        .populate('collaborators', 'projects')
        .exec(function (err, prj) {
            if (err) { return next(err); }

            _.each(prj && prj.collaborators, function (user) {
                var stub_prj = _.find(user.projects, {_ref: id});

                stub_prj.title = project.title;
                user.save(function (err) {
                    if (err) { next(err); }
                });
            });

            next();
        });
});


projectSchema.pre('save', function ensureTableConsistency(next) {
    var doc = this;

    // Skip table sync if modified is not product or req
    if (!doc.isModified('products') && !doc.isModified('requirements')) {
        return next();
    }

    if (isEmptyTable(doc)) {
        doc.table = [];
        console.log('[DB] Sync table for[%s] skipped - empty', doc.id);
        return next();
    }

    var oldTable = buildOldTable(doc);
    var newTable = buildNewTable(doc.requirements, doc.products, doc.table);
    var patches = buildPatch(oldTable, newTable);
    console.log('[DB] Sync table for[%s] patch: ', doc.id, JSON.stringify(patches));

    if (patches.length) {
        patchTable(doc, patches);
        console.log('[DB] Sync table for[%s] patch applied', doc.id);
    }

    next();
});

function isEmptyTable(doc) {
    // Table makes sense with at least 1 req and 1 product (API level may impose other requirements)
    var selectedReqs = _.findWhere(doc.requirements, {selected: true});
    var selectedProds = _.findWhere(doc.products, {selected: true});

    return !selectedReqs || !selectedProds;
}

function buildOldTable(doc) {
    // doc.table is Mongoose object with many additional props,
    // we need to get pure data to generate correct patch from it
    var json = doc.toJSON({
        transform: function (doc, ret) {
            delete ret._id;
            delete ret.id;
        }
    });

    return json.table;
}

function buildNewTable(requirements, products, table) {
    var res = [];

    _.forEach(requirements, function (req) {
        if (req.selected) {
            var row = _.pick(req, 'name', 'topic', 'popularity', 'mandatory');
            row.reqId = req._id.toString();
            row.products = [];

            var oldRow = _.findWhere(table, {reqId: row.reqId});
            row.weight = oldRow ? oldRow.weight : 1 /*default*/;

            _.forEach(products, function (prod) {
                if (prod.selected) {
                    var col = _.pick(prod, 'name', 'popularity');
                    col.prodId = prod._id.toString();

                    var oldCol = _.findWhere(oldRow.products, {prodId: col.prodId});
                    col.grade = (oldRow && oldCol) ? oldCol.grade : 10;
                    col.input = (oldRow && oldCol) ? oldCol.input : '';

                    row.products.push(col);
                }
            });

            res.push(row);
        }
    });

    return res;
}

function buildPatch(oldTable, newTable) {
    return jsonPatch.compare({table: oldTable}, {table: newTable});
}

function patchTable(doc, patches) {
    try {
        jsonPatch.apply(doc, patches, true /*validate*/);
    }
    catch (e) {
        console.log('[DB] Sync table: patch exception: ', e);
    }
}

// Presentation logo
//
projectSchema.path('presentation.data.logo.image.url').get(function () {
    var fileName = this.presentation.data.logo.image.fileName;
    var safeFileName = util.encodeURIComponentExt(fileName);
    return fileName && ['/files', this._id, safeFileName].join('/');
});

projectSchema.pre('save', function ensureLogoUploadToS3(next) {
    var project = this;

    // Upload new image to S3 after it is saved
    if (!project.isModified('presentation.data.logo.image')) { return next(); }

    var projectId = project._id;
    var image = this.presentation.data.logo.image;
    var file = {
        name: image.fileName,
        path: path.join(FILES_PATH, projectId, image.fileName),
        contentType: 'image/' + path.extname(image.fileName).replace('.', '')
    };

    s3.upload([file], {subDir: projectId})
        .then(function (res) {
            console.log('[DB] Upload logo to S3 success: %s', JSON.stringify(res));
            next();
        })
        .catch(function (reason) {
            next(reason);
        });
});


// Post-remove hooks
//
projectSchema.post('remove', function ensureLocalDirUnlink(doc) {
    var projectId = doc._id;
    var fileDir = path.join(FILES_PATH, projectId);

    console.log('[DB] Unlinking dir [%s]', fileDir);
    fs.removeSync(fileDir);
});

projectSchema.post('remove', function ensureS3removeBucket(doc) {
    var projectId = doc._id;

    console.log('[DB] Removing S3 bucket [%s]', projectId);
    s3.removeBucket(projectId).then(function (res) {
        console.log('[DB] Remove S3 bucket - success: %s', JSON.stringify(res));
    });
});


// Model
//
var Project = mongoose.model('Projects2', projectSchema);

module.exports = {
    ProjectModel: Project
};
