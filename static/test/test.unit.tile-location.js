/*global describe:true, it:true */

describe('Client - unit', function () {

    describe('Module', function () {
        var module, deps;
        before(function () {
            module = angular.module('peersay');
            deps = module.value('peersay').requires;
        });

        it('should be registered', function () {
            module.should.not.be.equal(null);
        });

        it('should have good deps', function () {
            deps[0].should.be.equal('ngRoute');
            deps[1].should.be.equal('ngMessages');
        });

    });

    describe('TileLocation', function () {
        var TileLocation, Storage, rootScope;
        beforeEach(function () {
            module('peersay');

            inject(function (_TileLocation_, _Storage_, _$rootScope_) {
                TileLocation = _TileLocation_;
                Storage = _Storage_;
                rootScope = _$rootScope_;

                sinon.stub(Storage, 'get', function () {
                });
                sinon.stub(Storage, 'set', function () {
                });
            })
        });

        afterEach(function () {
            Storage.get.restore();
        });

        it('should contain TileLocation service & methods & wrap $location', function () {
            TileLocation.should.be.a('object');
            TileLocation.load.should.be.a('function');
            TileLocation.add.should.be.a('function');
            TileLocation.remove.should.be.a('function');
            TileLocation.url.should.be.a('function'); // $location.url
        });

        it('should read Storage on load()', function () {
            TileLocation.load();
            Storage.get.callCount.should.be.equal(1);
        });

        it('should not emit on empty storage', function () {
            var spy = sinon.spy();
            rootScope.$on('add:tile', spy);
            TileLocation.load();
            spy.callCount.should.be.equal(0);
        });

        it('should read & emit once settings from storage', function (done) {
            Storage.get.restore();
            sinon.stub(Storage, 'get')
                .returns({tile: 'xy,ab'});

            var spy = sinon.spy();
            rootScope.$on('add:tile', spy);

            rootScope.$on('add:tile', function (event, arr) {
                arr.should.be.deep.equal(['xy', 'ab']);
                done();
            });

            TileLocation.load();
            TileLocation.url().should.be.equal('/?tile=xy,ab');
            spy.callCount.should.be.equal(1);
        });

        it('should change $location on add()', function () {
            TileLocation.add('tile', 'xy');
            TileLocation.url().should.be.equal('/?tile=xy');

            TileLocation.add('tile', 'ab');
            TileLocation.url().should.be.equal('/?tile=xy,ab');
        });

        it('should emit add:tile once on add()', function (done) {
            var spy = sinon.spy();
            rootScope.$on('add:tile', spy);

            rootScope.$on('add:tile', function (event, arr) {
                arr.should.be.deep.equal(['xy']);
                done();
            });

            TileLocation.add('tile', 'xy');
            spy.callCount.should.be.equal(1);
        });

        it('should store on add()', function () {
            TileLocation.add('tile', 'xy');
            Storage.set.callCount.should.be.equal(1);
        });

        it('should change $location on remove()', function () {
            Storage.get.restore();
            sinon.stub(Storage, 'get')
                .returns({tile: 'xy,ab'});

            TileLocation.load();
            TileLocation.remove('tile', 'xy');
            TileLocation.url().should.be.equal('/?tile=ab');

            TileLocation.remove('tile', 'ab');
            TileLocation.url().should.be.equal('/');
        });

        it('should emit once remove:tile on remove()', function (done) {
            Storage.get.restore();
            sinon.stub(Storage, 'get')
                .returns({tile: 'xy'});
            var spy = sinon.spy();
            rootScope.$on('remove:tile', spy);

            rootScope.$on('remove:tile', function (event) {
                done();
            });

            TileLocation.load();
            TileLocation.remove('tile', 'xy');
            spy.callCount.should.be.equal(1);
        });

        it('should store on remove()', function () {
            TileLocation.remove('tile', 'xy');
            Storage.set.callCount.should.be.equal(1);
        });
    });
});