module.exports = {
    web: {
        port: Number(process.env.PORT || 5000),
        static_dir: process.env.DEV ? 'static' : 'dist'
    },
    db: {
        url: process.env.DEV ? 'mongodb://localhost/peersay' : process.env.MONGOHQ_URL,
        test_url: 'mongodb://localhost/peersay_test'
    }
};
