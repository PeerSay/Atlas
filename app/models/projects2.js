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
    title: {type: String, required: true},
    creationDate: {type: Date, default: Date.now},
    collaborators: [
        {type: Schema.ObjectId, ref: 'User'}
    ],

    // Essentials
    //

    //Migrate:
    // - was:
    //  startDate: { type: String }, plain string!
    //  duration: { type: String }, plain string!
    time: {
        startDate: {type: Date, default: Date.now},
        duration: {type: Number, min: 0},
        durationLabel: {type: String, enum: durationLabelEnum, default: 'days'},
        durationLabels: {type: String, default: durationLabelEnum.join(',')}
    },

    // Migrate:
    // - was: budget:String
    budget: {
        amount: {type: Number, min: 0},
        amountMultiplier: {type: String, enum: amountMultiplierEnum, default: 'K'},
        amountMultipliers: {type: String, default: amountMultiplierEnum.join(',')},
        currencyLabel: {type: String, enum: currencyEnum, default: 'USD'},
        currencyLabels: {type: String, default: currencyEnum.join(',')}
    },

    // Migrate:
    // - was summary/recommendations/notes (flat, String)
    // - was description:String
    notes: {
        reasons: {type: String, default: ''}, // Ensures parent is always created
        goals: {type: String},
        resources: {type: String},
        summary: {type: String},
        recommendations: {type: String}
    },

    // Migrate:
    // - was: criteria.vendors: []
    requirements: [{
        name: {type: String, required: true},
        description: {type: String},
        topic: {type: String},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        selected: {type: Boolean}, // default?
        custom: {type: Boolean, default: true}
    }],

    // Migrate:
    // - was: vendors - inside criteria! (can get any/first req to migrate)
    products: [{
        name: {type: String, required: true},
        description: {type: String},
        category: {type: String},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        selected: {type: Boolean},
        custom: {type: Boolean, default: true}
    }],

    // Categories:
    //
    selectedCategory: {type: String},
    categories: [{
        name: {type: String, required: true}, // TODO - verify uniqueness
        domain: {type: String},
        custom: {type: Boolean, default: true}
    }],

    // Migrate: was
    // - grade was named score
    // - weight/input was inside criteria arr
    table: [{
        reqId: {type: String, required: true},
        name: {type: String, required: true},
        weight: {type: Number, min: 0, max: 100, default: 1},
        popularity: {type: Number, min: 0, max: 100, default: 0},
        products: [{
            prodId: {type: String, required: true},
            name: {type: String, required: true},
            input: {type: String, default: ''},
            grade: {type: Number, min: 0, max: 10, default: 0},
            popularity: {type: Number, min: 0, max: 100, default: 0}
        }]
    }]
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

    //console.log('>> Pre save: reqs', JSON.stringify(doc.requirements));
    //console.log('>> Pre save: prodys', JSON.stringify(doc.products));

    // TODO: Return if not add/remove product/req

    if (isEmptyTable(doc)) {
        doc.table = [];
        return next();
    }

    // buildIndex
    var index = buildTableIndex(doc);
    var diff = genDiffByIndex(doc.table, index);
    var res = patchTable(doc.table, diff);

    console.log('[DB]: Synced table model[%s] diff: ', doc.id, JSON.stringify(res));

    next();
});

function isEmptyTable(doc) {
    // Table makes sense with at least 1 req and 1 product (API level may impose other requirements)
    var selectedReqs = _.findWhere(doc.requirements, {selected: true});
    var selectedProds = _.findWhere(doc.products, {selected: true});

    return !selectedReqs || !selectedProds;
}

function buildTableIndex(doc) {
    var index = {reqs: {}, prods: {}};

    _.forEach(doc.requirements, function (req) {
        if (req.selected) {
            index.reqs[req._id] = req;
        }
    });
    _.forEach(doc.products, function (prod) {
        if (prod.selected) {
            index.prods[prod._id] = prod;
        }
    });

    return index;
}


function genDiffByIndex(table, index) {
    var diff = {
        reqs: {add: [], remove: []},
        prods: {add: [], remove: []}
    };

    // reqs - remove
    _.forEach(table, function (row) {
        if (index.reqs[row.reqId]) {
            delete index.reqs[row.reqId]; // to keep only added items in index
        } else {
            // not in index => remove
            diff.reqs.remove.push(row);
        }
    });
    // reqs - add
    _.forEach(index.reqs, function (req) {
        diff.reqs.add.push({
            reqId: req._id,
            name: req.name,
            popularity: req.popularity,
            products: []
        });
    });

    // prods - remove
    var prods0 = table[0] ? table[0].products : [];
    _.forEach(prods0, function (col) {
        if (index.prods[col.prodId]) {
            delete index.prods[col.prodId];
        } else {
            // not in index => remove
            diff.prods.remove.push(col.prodId); // id!
        }
    });
    // prods - add
    _.forEach(index.prods, function (prod) {
        diff.prods.add.push({
            prodId: prod._id,
            name: prod.name,
            popularity: prod.popularity
        });
    });

    return diff;
}

function patchTable(table, diff) {
    //reqs
    _.forEach(diff.reqs.remove, function (removed) {
        table.splice(table.indexOf(removed), 1);
        console.log(' [DB]: Sync table: removed req: ', JSON.stringify(removed));
    });

    _.forEach(diff.reqs.add, function (added) {
        var copy = _.extend({}, added);
        // Add existing prods (copy)
        var prods0 = (table[0] || {}).products; // exist by now
        _.forEach(prods0, function (prod) {
            copy.products.push({
                prodId: prod.prodId,
                name: prod.name,
                popularity: prod.popularity
            });
        });

        table.push(copy);

        console.log(' [DB]: Sync table: added req: ', JSON.stringify(added));
    });

    //prods
    _.forEach(diff.prods.remove, function (removedId) {
        var req0 = table[0];
        var prod = _.findWhere(req0.products, {prodId: removedId});
        var prodIdx = req0.products.indexOf(prod);
        _.forEach(table, function (req) {
            req.products.splice(prodIdx, 1);
        });

        console.log(' [DB]: Sync table: removed prod: ', JSON.stringify(removedId));
    });

    _.forEach(diff.prods.add, function (added) {
        _.forEach(table, function (req) {
            req.products.push(added);
        });
        console.log(' [DB]: Sync table: added prod:', JSON.stringify(added));
    });

    return diff;
}

// Model
//
var Project = mongoose.model('Project', projectSchema);


module.exports = {
    ProjectModel: Project
};