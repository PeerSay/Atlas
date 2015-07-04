var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

//Requirement
var requirementSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    topic: { type: String, default: '' }, // foreign key to Topics
    popularity: {type: Number, min: 0, max: 100, default: 0}
});
requirementSchema.plugin(findOrCreate);

var Requirement = mongoose.model('Requirement', requirementSchema);

// Load JSON data
var data = require('./data/all');
data.load(data.requirements, Requirement);

module.exports = {
    RequirementModel: Requirement
};
