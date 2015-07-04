var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

// Categories of Products
var categorySchema = new Schema({
    name: { type: String, required: true },
    domain: { type: String, default: '' },
    popularity: {type: Number, min: 0, max: 100, default: 0}
});
categorySchema.plugin(findOrCreate);

var Category = mongoose.model('Category', categorySchema);


// Load JSON data
var data = require('./data/all');
data.load(data.categories, Category);


module.exports = {
    CategoryModel: Category
};
