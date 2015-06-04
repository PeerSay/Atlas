var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Products
var productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' }, // foreign key to Categories
    popularity: {type: Number, min: 0, max: 100, default: 0}
});

var Model = mongoose.model('Product', productSchema);


module.exports = {
    ProductModel: Model
};
