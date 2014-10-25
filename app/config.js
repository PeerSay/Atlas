/*global __dirname:true*/

var path = require('path');

var PORT = Number(process.env.PORT || 5000);

module.exports = {
    web: {
        port: PORT,
        static_dir: path.join(__dirname, '..', process.env.DEV ? 'static' : 'dist'),
        base_url: 'http://localhost:' + PORT
    },
    db: {
        url: process.env.DEV ? 'mongodb://localhost/peersay' : process.env.MONGOHQ_URL,
        test_url: 'mongodb://localhost/peersay_test',
        hash_iters: process.env.MONGOHQ_URL ? 100000 : 1000 // many iterations for production, few for dev/test
    },
    auth: {
        linkedin: {
            api_key: '77st41xz0halpu',
            secret_key: 'nVcfUeYOJSx8vEaP'
        }
    },
    email: {
        /*TODO: SendGrid:
         auth: {
            api_user: 'pag',
            api_key: '\\H6hFx(YO<lT'
        }*/
        auth: {
            user: 'peersaytest@gmail.com',
            pass: 'x}BQPK(f0xBP'
        }
    }
};
