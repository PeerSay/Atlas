var _ = require('lodash');

function load(dataArr, Model, pick) {
    _.forEach(dataArr, function (it) {
        var search = _.pick(it, pick);

        Model.findOrCreate(search, it, function (err, doc, created) {
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
