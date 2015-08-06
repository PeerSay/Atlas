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

var FILES_PATH = path.join(__dirname, '../../files');


// Presets
//
var defaultProject = {
    title: 'Welcome Project'
};
var durationLabelEnum = ['Days', 'Weeks', 'Months'];
var amountMultiplierEnum = ['----', 'Thousands'];
var currencyEnum = ['USD', 'EUR', 'GBP', 'ILS']; // ISO 4217 codes (BTC is unofficial)

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


projectSchema.statics.createByUser = function (project, user, next) {
    project = (project || defaultProject);
    project.collaborators = [user._id];

    Project.create(project, function (err, prj) {
        if (err) { return next(err); }

        // Create stub sub-doc
        var subDoc = {
            title: prj.title,
            _ref: prj._id
        };
        user.projects.push(subDoc); // save() is required for sub-doc!

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


projectSchema.pre('save', function ensureStubsUpdated(next) {
    var project = this;
    var id = project._id;

    // update titles of all collaborator's stubs
    if (!project.isModified('title')) { return next(); }

    Project
        .findById(id, 'collaborators')// XXX: can avoid?
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
    var newTable = buildNewTable(doc.requirements, doc.products);
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

function buildNewTable(requirements, products) {
    var res = [];

    _.forEach(requirements, function (req) {
        if (req.selected) {
            var row = _.pick(req, 'name', 'topic', 'popularity', 'mandatory');
            row.reqId = req._id;
            row.products = [];

            _.forEach(products, function (prod) {
                if (prod.selected) {
                    var col = _.pick(prod, 'name', 'popularity');
                    col.prodId = prod._id;
                    row.products.push(col);
                }
            });

            res.push(row);
        }
    });

    return res;
}

function buildPatch(oldTable, newTable) {
    var patches = jsonPatch.compare({table: oldTable}, {table: newTable});

    // Remove invalid ones: as far as newTable has no weight|input|grade,
    // they appear in patches as remove op.
    patches = _.filter(patches, function (p) {
        return !/(\/weight|\/input|\/grade)$/.test(p.path);
    });

    return patches;
}

function patchTable(doc, patches) {
    try {
        jsonPatch.apply(doc, patches, true /*validate*/);
    }
    catch (e) {
        console.log('[DB] Sync table: patch exception: ', e);
    }
}

// Post hooks
//
projectSchema.post('remove', function ensureLocalDirUnlink(doc) {
    var projectId = doc._id;
    var fileDir = path.join(FILES_PATH, projectId);

    console.log('[DB] Unlinking dir [%s]', fileDir);
    fs.removeSync(fileDir);
});


// Presentation logo
projectSchema.path('presentation.data.logo.image.url').get(function () {
    var projectId = this._id;
    var resource = this.presentation.data.logo.image;
    return resource.fileName && getLogoResourceUrls(projectId, resource.fileName).generic;
});
projectSchema.virtual('presentation.data.logo.image.localUrl').get(function () {
    var projectId = this._id;
    var resource = this.presentation.data.logo.image;
    return resource.fileName && getLogoResourceUrls(projectId, resource.fileName).local;
});
projectSchema.virtual('presentation.data.logo.image.s3Url').get(function () {
    var projectId = this._id;
    var resource = this.presentation.data.logo.image;
    return resource.fileName && getLogoResourceUrls(projectId, resource.fileName).s3;
});


function getLogoResourceUrls(projectId, fileName) {
    var safeFileName = util.encodeURIComponentExt(fileName);
    var bucketName = config.s3.bucket_name;

    return {
        generic: ['/my/projects', projectId, 'presentation/logo'].join('/'),
        local: ['/files', projectId, safeFileName].join('/'),
        s3: ['https://s3.amazonaws.com', bucketName, projectId, safeFileName].join('/')
    };
}


// Model
//
var Project = mongoose.model('Projects2', projectSchema);


module.exports = {
    ProjectModel: Project
};
