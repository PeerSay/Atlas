var _ = require('lodash');
var mongoose = require('mongoose');
var ShortId = require('mongoose-shortid-nodeps');
var Schema = mongoose.Schema;

var defaultProject = {
    title: 'Welcome Project'
};

/**
 * Time constants
 */
var DAY = 1000 * 60 * 60 * 24;
var MONTH = DAY * 30;

/**
 * From: https://github.com/coreh/uid2
 * 62 characters in the ascii range that can be used in URLs without special encoding.
 */
var UIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Schema
//

var projectStubSchema = new Schema({
    title: { type: String, required: true },
    _stub: {type: Boolean, default: true },
    _ref: { type: ShortId, ref: 'Project' }
});


var projectSchema = new Schema({
    _id: {
        type: ShortId,
        len: 8,
        alphabet: UIDCHARS,
        retries: 5
    },
    title: {type: String, required: true },
    domain: {type: String},
    duration: {
        startedAt: {type: Date, default: Date.now()},
        finishedAt: {type: Date, default: Date.now() + MONTH}
    },
    budget: {type: Number, default: 1000},
    collaborators: [
        { type: Schema.ObjectId, ref: 'User' }
    ]
});
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });


projectSchema.virtual('duration.days').get(function () {
    var dur = this.duration;
    var diff = dur.finishedAt - dur.startedAt;
    return Math.floor(diff / DAY + 0.5);
});


projectSchema.statics.createByUser = function (project, user, next) {
    project = (project || defaultProject);
    project.collaborators = [user._id];

    Project.create(project, function (err, prj) {
        if (err) { return next(err); }

        // Create stub sub-doc
        var stubPrj = {
            title: prj.title,
            _ref: prj._id
        };
        user.projects.push(stubPrj); // save() is required for sub-doc!

        user.save(function (err, user) {
            if (err) { return next(err); }

            next(null, stubPrj); // return stub
        });
    });

};


projectSchema.statics.removeByUser = function (project_id, user, next) {
    Project.findOneAndRemove({_id: project_id}, function (err) {
        if (err) { return next(err); }

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
    ProjectModel: Project,
    projectStubSchema: projectStubSchema
};