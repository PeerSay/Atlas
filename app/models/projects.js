var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var defaultProject = {
    title: 'Welcome Project'
};

var DAY = 1000*60*60*24;
var MONTH = DAY*30;

// Schema
//

var projectSchema = new Schema({
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


projectSchema.virtual('duration.days').get(function () {
    var dur = this.duration;
    var diff = dur.finishedAt - dur.startedAt;
    return Math.floor(diff/DAY + 0.5);
});


projectSchema.statics.createByUser = function (project, user, next) {
    project = (project || defaultProject);
    project.collaborators = [user._id];

    Project.create(project, function (err, prj) {
        if (err) return next(err);

        // Create stub sub-doc
        var stubPrj = {
            id: nextId(user.projects),
            title: prj.title,
            _ref: prj._id
        };
        user.projects.push(stubPrj); // user.save() is required and responsibility of caller
        next(null, stubPrj);
    });

    function nextId(arr) {
        return 1 + _.reduce(arr, function (res, it) {
            return Math.max(res, it.id);
        }, 0);
    }
};


projectSchema.statics.removeByUser = function (stub_id, user, next) {
    var stubPrj = _.find(user.projects, {id: stub_id});

    Project.findOneAndRemove({_id: stubPrj._ref}, function (err, prj) {
        if (err) return cb(err);

        // Remove stub sub-doc
        user.projects.id(stubPrj._id).remove(); // mongoose can only remove by id().remove()
        next(null, stubPrj); // save() is required and responsibility of caller

        // TODO: remove collaborator's stubs
    });
};


// Model
//
var Project = mongoose.model('Project', projectSchema);


module.exports = {
    ProjectModel: Project
};