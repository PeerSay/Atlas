var _ = require('lodash');

function load(dataArr, Model, picks) {
    _.forEach(dataArr, function (doc) {
        var search = _.pick(doc, picks);

        Model.findOrCreate(search, doc, {upsert: true}, function (err, doc, created) {
            var op = created ? 'created' : 'updated';
            console.log('[DB] Populate [%s] from JSON: %s: %s', Model.modelName, op, JSON.stringify(doc));
        });
    });
}

module.exports = {
    load: load,
    categories: require('./categories').categories,
    products: require('./products').products,
    topics: require('./topics').topics,
    requirements: require('./requirements').requirements
};
