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
        var DeepLinking, Storage, rootScope, Location;
        beforeEach(function () {
            module('peersay');

            inject(function (_$rootScope_, _Storage_, _Location_, _DeepLinking_) {
                rootScope = _$rootScope_;
                Storage = _Storage_;
                Location = _Location_;
                DeepLinking = _DeepLinking_;

                sinon.stub(Storage, 'get', function () {});
                sinon.stub(Storage, 'set', function () {});
            })
        });

        afterEach(function () {
            Storage.get.restore();
        });

        it('should contain TileLocation service & methods & wrap $location', function () {
            DeepLinking.should.be.a('object');
            DeepLinking.load.should.be.a('function');
            DeepLinking.add.should.be.a('function');
            DeepLinking.remove.should.be.a('function');
            DeepLinking.url.should.be.a('function'); // $location.url
            DeepLinking.skipReload.should.be.a('function'); // from Location
        });

        it('should read Storage on load()', function () {
            DeepLinking.load('namespace');
            Storage.get.callCount.should.be.equal(1);
        });

        it('should not emit on empty storage', function () {
            var spy = sinon.spy();
            rootScope.$on('add:tile', spy);
            DeepLinking.load('namespace');
            spy.callCount.should.be.equal(0);
        });

        it('should read & emit once settings from storage', function (done) {
            Storage.get.restore();
            sinon.stub(Storage, 'get')
                .returns({tile: 'xy,ab'});

            var spy = sinon.spy();
            rootScope.$on('replace:tile', spy);

            rootScope.$on('replace:tile', function (event, arr) {
                arr.should.be.deep.equal(['xy', 'ab']);
                done();
            });

            DeepLinking.load('namespace');
            DeepLinking.url().should.be.equal('/?tile=xy,ab');
            spy.callCount.should.be.equal(1);
        });

        it('should change $location on add()', function () {
            DeepLinking.add('tile', 'xy');
            DeepLinking.url().should.be.equal('/?tile=xy');

            DeepLinking.add('tile', 'ab');
            DeepLinking.url().should.be.equal('/?tile=xy,ab');
        });

        it('should emit add:tile once on add()', function (done) {
            var spy = sinon.spy();
            rootScope.$on('add:tile', spy);

            rootScope.$on('add:tile', function (event, arr) {
                arr.should.be.deep.equal(['xy']);
                done();
            });

            DeepLinking.add('tile', 'xy');
            spy.callCount.should.be.equal(1);
        });

        it('should store on add()', function () {
            DeepLinking.add('tile', 'xy');
            Storage.set.callCount.should.be.equal(1);
        });

        it('should ignore duplicate on add()', function () {
            var spy = sinon.spy();
            DeepLinking.load('nsp1');
            DeepLinking.add('tile', 'xy');

            rootScope.$on('add:tile', spy);

            DeepLinking.add('tile', 'xy'); //<- duplicate
            spy.callCount.should.be.equal(0);
            DeepLinking.url().should.be.equal('/?tile=xy');
        });

        it('should change $location on remove()', function () {
            Storage.get.restore();
            sinon.stub(Storage, 'get')
                .returns({tile: 'xy,ab'});

            DeepLinking.load('namespace');
            DeepLinking.remove('tile', 'xy');
            DeepLinking.url().should.be.equal('/?tile=ab');

            DeepLinking.remove('tile', 'ab');
            DeepLinking.url().should.be.equal('/');
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

            DeepLinking.load('namespace');
            DeepLinking.remove('tile', 'xy');
            spy.callCount.should.be.equal(1);
        });

        it('should store on remove()', function () {
            DeepLinking.remove('tile', 'xy');
            Storage.set.callCount.should.be.equal(1);
        });
    });
});