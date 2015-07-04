var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

//Products
var productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' }, // foreign key to Categories
    popularity: {type: Number, min: 0, max: 100, default: 0}
});
productSchema.plugin(findOrCreate);

var Product = mongoose.model('Product', productSchema);


// Load JSON data
var data = require('./data/all');
data.load(data.products, Product);


module.exports = {
    ProductModel: Product
};
