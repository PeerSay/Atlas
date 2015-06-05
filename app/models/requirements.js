var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Requirement
var requirementSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    topic: { type: String, default: '' }, // foreign key to Topics
    popularity: {type: Number, min: 0, max: 100, default: 0}
});

var topicSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    popularity: {type: Number, min: 0, max: 100, default: 0}
});

var ReqModel = mongoose.model('Requirement', requirementSchema);
var TopicModel = mongoose.model('Topic', topicSchema);


module.exports = {
    RequirementModel: ReqModel,
    TopicModel: TopicModel
};
