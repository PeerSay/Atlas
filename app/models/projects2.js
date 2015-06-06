var _ = require('lodash');
var mongoose = require('mongoose');
var ShortId = require('mongoose-shortid-nodeps');
var Schema = mongoose.Schema;


/**
 * From: https://github.com/coreh/uid2
 * 62 characters in the ascii range that can be used in URLs without special encoding.
 */
var UIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Presets
//
var defaultProject = {
    title: 'Welcome Project'
};
var durationLabelEnum = ['days', 'weeks', 'months'];
var amountMultiplierEnum = ['K', 'M'];
var currencyEnum = ['USD', 'EUR', 'GBP', 'ILS', 'RUB', 'BTC']; // ISO 4217 codes (BTC is unofficial)
var psShortId = {
    type: ShortId,
    len: 8,
    alphabet: UIDCHARS,
    retries: 10
};

// Schema
//
var projectSchema = new Schema({
    _id: psShortId,
    title: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    collaborators: [
        { type: Schema.ObjectId, ref: 'User' }
    ],

    // Essentials
    //

    //Migrate:
    // - was:
    //  startDate: { type: String }, plain string!
    //  duration: { type: String }, plain string!
    time: {
        startDate: { type: Date, default: Date.now },
        duration: { type: Number, min: 0 },
        durationLabel: { type: String, enum: durationLabelEnum, default: 'days' },
        durationLabels: { type: String, default: durationLabelEnum.join(',') }
    },

    // Migrate:
    // - was: budget:String
    budget: {
        amount: {type: Number, min: 0 },
        amountMultiplier: { type: String, enum: amountMultiplierEnum, default: 'K' },
        amountMultipliers: { type: String, default: amountMultiplierEnum.join(',')},
        currencyLabel: { type: String, enum: currencyEnum, default: 'USD'},
        currencyLabels: { type: String, default: currencyEnum.join(',') }
    },

    // Migrate:
    // - was summary/recommendations/notes (flat, String)
    // - was description:String
    notes: {
        reasons: { type: String, default: '' }, // Ensures parent is always created
        goals: { type: String },
        resources: { type: String },
        summary: { type: String },
        recommendations: { type: String }
    },

    // Migrate:
    // - was: criteria.vendors: []
    requirements: [{
        name: { type: String, required: true },
        description: { type: String },
        topic: { type: String },
        popularity: { type: Number, min: 0, max: 100, default: 0 },
        selected: { type: Boolean }, // default?
        custom: { type: Boolean, default: true }
    }],

    // Migrate:
    // - was: vendors - inside criteria! (can get any/first req to migrate)
    products: [{
        name: { type: String, required: true },
        description: { type: String },
        category: { type: String },
        popularity: { type: Number, min: 0, max: 100, default: 0 },
        selected: { type: Boolean },
        custom: { type: Boolean, default: true }
    }],

    // Categories:
    //
    selectedCategory: { type: String },
    categories: [{
        name: { type: String, required: true }, // TODO - verify uniqueness
        domain: { type: String },
        custom: { type: Boolean, default: true }
    }],

    // Migrate: was
    // - grade was score score
    // - weight/input was inside criteria arr
    table: [{
        name: { type: String, required: true },
        weight: { type: Number, min: 0, max: 100, default: 1 },
        products: [{
            name: { type: String, required: true },
            input: { type: String, default: '' },
            grade: { type: Number, min: 0, max: 10, default: 0 }
        }]
    }]
});
projectSchema.set('toJSON', { virtuals: true });


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


// Model
//
var Project = mongoose.model('Project', projectSchema);


module.exports = {
    ProjectModel: Project
};