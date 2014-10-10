var path = require('path');

module.exports = {
    web: {
        port: Number(process.env.PORT || 5000),
        static_dir: path.join(__dirname, '..', process.env.DEV ? 'static' : 'dist')
    },
    db: {
        url: process.env.DEV ? 'mongodb://localhost/peersay' : process.env.MONGOHQ_URL,
        test_url: 'mongodb://localhost/peersay_test',
        hash_iters: process.env.MONGOHQ_URL ? 100000 : 1000 // many iterations for production, few for dev/test
    }
};
