module.exports = {
    web: {
        port: Number(process.env.PORT || 5000),
        static_dir: process.env.DEV ? 'static' : 'dist'
    },
    db: {
        url: process.env.DEV ? 'mongodb://localhost/test' : process.env.MONGOHQ_URL
    }
};
