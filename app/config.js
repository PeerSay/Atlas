module.exports = {
    web: {
        port: Number(process.env.PORT || 5000),
        static_dir: process.env.DEV ? 'static' : 'dist'
    },
    db: {
        url: 'mongodb://localhost/test'
    }
};
