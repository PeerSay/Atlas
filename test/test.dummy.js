var should = require('chai').should();

describe('Server', function () {

    describe('dummy test', function () {
        it('length should be ok', function () {
            [1,2,3].should.have.length(3);
        });
    });
});