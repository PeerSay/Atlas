var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Categories of Products
var categorySchema = new Schema({
    name: { type: String, required: true },
    domain: { type: String, default: '' },
    popularity: {type: Number, min: 0, max: 100, default: 0}
});

var Model = mongoose.model('Category', categorySchema);


module.exports = {
    CategoryModel: Model
};
