var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var topicSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    popularity: {type: Number, min: 0, max: 100, default: 0}
});
topicSchema.plugin(findOrCreate);

var Topic = mongoose.model('Topic', topicSchema);


// Load JSON data
var data = require('./data/all');
data.load(data.topics, Topic, ['name']);


module.exports = {
    TopicModel: Topic
};
