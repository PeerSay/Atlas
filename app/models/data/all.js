var _ = require('lodash');

function load(dataArr, Model) {
    _.forEach(dataArr, function (item) {

        Model.findOrCreate({_id: item._id}, _.omit(item, '_id'), {upsert: true}, function (err, doc, created) {
            var op = created ? 'created' : '';
            // TODO - show updated
            if (op){
                console.log('[DB] Populate [%s] from JSON: %s: %s, cnt=%d', Model.modelName, op, JSON.stringify(doc));
            }
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
