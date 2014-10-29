var should = require('chai').should();
var util = require('../app/util');

describe('Util', function () {

    describe('crypto', function () {
        var hash_salt_weak;
        var ITERS_STRONG = 100000;

        function split(joined) {
            var arr = joined.split('_');
            return {
                hash: arr[0],
                salt: new Buffer(arr[1], 'hex')
            };
        }

        beforeEach(function (done) {
            // generate password hash
            util.hasher({ plaintext: 'secret'}, function (err, result) {
                hash_salt_weak = [result.key.toString('hex'), result.salt.toString('hex')].join('_');
                done();
            });
        });

        it('should verify password hash', function (done) {
            var tested = split(hash_salt_weak);
            util.hasher({ plaintext: 'secret', salt: tested.salt}, function (err, result) {
                should.not.exist(err);
                tested.hash.should.be.equal(result.key.toString('hex'));
                done();
            });
        });

        it('should produce different hash when iterations not match', function (done) {
            var tested = split(hash_salt_weak);
            util.hasher({ plaintext: 'secret', salt: tested.salt, iterations: 1000}, function (err, result) {
                should.not.exist(err);
                tested.hash.should.not.be.equal(result.key.toString('hex'));
                done();
            });
        });

        // Note: test is too slow and should be generally turned off. Still it is good to assess the strong hash calc time
        // On my machine it is ~300ms
        // For definition of 'strong' number of iterations see:
        // http://stackoverflow.com/questions/4433216/password-encryption-pbkdf2-using-sha512-x-1000-vs-bcrypt (PBKDF2/86k iters/8chars pdw => $18k HW cost)
        // and this: http://codereview.stackexchange.com/questions/12330/node-js-password-salting-hashing
        //
        it.skip('should produce strong hash in reasonable time', function (done) {
            var hash_salt_strong;

            // generate strong password hash
            util.hasher({ plaintext: 'secret', iterations: ITERS_STRONG}, function (err, result) {
                hash_salt_strong = [result.key.toString('hex'), result.salt.toString('hex')].join('_');

                // test
                var tested = split(hash_salt_strong);
                var start = Date.now();
                util.hasher({ plaintext: 'secret', salt: tested.salt, iterations: ITERS_STRONG}, function (err, result) {
                    var passed = Date.now() - start;
                    should.not.exist(err);
                    tested.hash.should.be.equal(result.key.toString('hex'));
                    passed.should.be.below(500);
                    done();
                });
            });
        });
    });


   describe('random', function () {
       it('should generate random hex string', function () {
           util.randomBase64(10, function (err, res) {
               res.should.be.a('string');
               new Buffer(res, 'base64').should.have.length(10);
           });
       });

       it('should generate alpha-num random restore code', function () {
           util.genRestorePwdKey.restore(); // remove stub

           var code = util.genRestorePwdKey();
           var code_re = /[\d\w]{8,11}/;

           code.should.be.a('string');
           code_re.test(code).should.equal(true);
       });
   })
});
