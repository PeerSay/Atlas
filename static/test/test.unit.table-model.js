/*global describe:true, it:true, inject:true */

var expect = chai.expect;

// PhantomJS doesn't support bind yet
Function.prototype.bind = Function.prototype.bind || function (thisp) {
        var fn = this;
        return function () {
            return fn.apply(thisp, arguments);
        };
    };

describe('TableModel', function () {
    var TableModel;
    beforeEach(function () {
        module('PeerSay');
        inject(function (_TableModel_) {
            TableModel = _TableModel_;
        });
    });


    describe('Build/traverse 1d ranges', function () {
        it('should push to named range w/ or w/empty key', function () {
            var model = TableModel.build(function (T) {
                T.range('headers')
                    .push('', {a: 1})
                    .push('weight', {w: 2});
            });

            expect(model.headers, 'pushing data to named Range exposes a co-named range func on model').to.be.a('function');
            expect(model.headers().list, 'calling a range func without params returns a Range object, which has .list prop, among others').to.be.a('array');
            expect(model.headers().list, 'a .list prop is array of all items pushed to range so far').to.have.length(2);
            expect(model.headers().size(), 'a .size method can be used to get .list length too').to.equal(2);

            expect(model.headers(0)(), 'calling a range func with Number param returns a data access func of given index; this func returns data back').to.deep.equal({a: 1});
            expect(model.headers(0).data, 'data access function (being a JS object) also has a data prop to access same data w/out call').to.deep.equal({a: 1});

            expect(model.headers('weight')(), 'calling a range func with String param returns a data access function too').to.deep.equal({w: 2});
            expect(model.headers('weight').data).to.deep.equal({w: 2});
            expect(model.headers().list[1](), 'items in .list array are access functions too').to.deep.equal({w: 2});
        });

        it('should have default ranges', function () {
            var model = TableModel.build(function (T) {
                T.header().push('name', 'h1').push('weight', 'h2');
                T.footer().push('name', 'f1').push('weight', 'f2');
                T.rows(0).push('name', {value: 1}).push('weight', {value: 2});
            });

            expect(model.header().size()).to.equal(2);
            expect(model.footer().size()).to.equal(2);
            //expect(model.rows(0).size()).to.equal(2);
            expect(model.rows().size()).to.equal(1);

            expect(model.header('name')()).to.equal('h1');
            expect(model.footer('name')()).to.equal('f1');
            expect(model.rows(0)('name').data).to.deep.equal({value: 1});
            expect(model.rows(0)('weight').data).to.deep.equal({value: 2});
        });

        it('should support traversing with skip()', function () {
            var model = TableModel.build(function (T) {
                T.range('groups', {multi: true})(0)
                    .push('name', 1)
                    .push('weight', 2)
                    .push('', 3)
                    .push('', 4);
            });

            expect(model.groups(0)().skip(2)[0]()).to.deep.equal(3);
            expect(model.groups(0)().skip(2)[1]()).to.deep.equal(4);
        });

        it('should support group params', function () {
            var model = TableModel.build(function (T) {
                T.range('group', {param: 123})
                    .push('', 1);
            });

            expect(model.group().param).to.deep.equal(123);
        });
    });

    describe('2d ranges', function () {
        it('should push to 2d range', function () {
            var model = TableModel.build(function (T) {
                T.range('group', {multi: true})(0)
                    .push('name', 1)
                    .push('weight', 2);

                T.range('group', {multi: true})(1)
                    .push('name', 3)
                    .push('weight', 4);
            });

            expect(model.group().size()).to.equal(2);
            expect(model.group(0)('name')()).to.equal(1);
            expect(model.group(0)().list[0]()).to.equal(1);
            expect(model.group(1)().list[1]()).to.equal(4);
        });

        it('should support group params on 2d', function () {
            var model = TableModel.build(function (T) {
                T.range('group', {multi: true})(0, {param: 123})
                    .push('', 1);
            });

            expect(model.group(0)().param).to.deep.equal(123);
        });
    });

    describe('Aggregates', function () {
        it('should aggregate _sum', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({total: T._sum()})
                    .push('', {value: 1})
                    .push('', {value: 2})
                    .push('', {value: 3});
            });

            expect(model.group().total()).to.equal(6);
        });

        it('should aggregate _sum w/ getter', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({total: T._sum(T._val('a'))})
                    .push('', {a: 1})
                    .push('', {a: 2})
                    .push('', {a: 3});
            });

            expect(model.group().total()).to.equal(6);
        });

        it('should aggregate _max', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({winner: T._max()})
                    .push('', {value: 1})
                    .push('', {value: 2})
                    .push('', {value: 3});
            });

            expect(model.group().winner()).to.equal(3);
        });

        it('should let use aggregates in items (simplest formula - ref own range)', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({winner: T._max(), total: T._sum()})
                    .push('', {value: 1})
                    .push('', {value: 2})
                    .push('max', {value: 0}, {max: '=winner'})
                    .push('sum', {value: 0}, {sum: '=total'});
            });

            expect(model.group('max')().max()).to.equal(2);
            expect(model.group('sum')().sum()).to.equal(3);
        });
    });

    describe('Formulas', function () {
        it.skip('should turn aggregate into formula (isMax case)', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({winner: T._max()})
                    .push('', {value: 1}, {isMax: T.ref('=winner', T._eq())})
                    .push('', {value: 2})
                    .push('', {value: 3}, {max: '=winner'});
            });

            expect(model.group('max')().max()).to.equal(2);
            expect(model.group('sum')().sum()).to.equal(3);
        });

        it.skip('should use formula involving ranges', function () {
            var model = TableModel.build(function (T) {
                T.range('rangeX')
                    .push('', 1)
                    .push('', 2)
                    .push('', 3);
                T.range('rangeY')
                    .push('', null)
                    .push('', {}, {'ref': 1})
                    .push('', 3);
            });

            expect(model.groups(0)().skip(2)[0]()).to.deep.equal(3);
            expect(model.groups(0)().skip(2)[1]()).to.deep.equal(4);
        });


        it('should aggregate _div', function () {
            var model = TableModel.build(function (T) {
                T.range('group')
                    .aggregate({
                        total: T._sum(T._val('a')),
                        weight: T._div(T._get(T._val('a')), T._val('total'))
                    })
                    .push('', {a: 1})
                    .push('', {a: 1})
                    .push('', {a: 2})
                    .push('', {a: 4});
            });

            expect(model.group().total()).to.be.equal(8);
            expect(model.group().weight(2)).to.be.equal(0.25);
        });

        it.skip('should reference the aggregate of other range', function () {
            var model = TableModel.build(function (T) {
                // Create a special range to hold a result of aggregation
                T.range('wPercent')
                    .aggregate({
                        total: T._sum(),
                        weight: T._div(T._get(), T._val('total'))
                    })
                    .push('', {value: 1})
                    .push('', {value: 3});

                T.rows(0)
                    .push('weight', {value: 1})
                    .push('percent', {}, {tooltip: 'wPercent.weight'});
                T.rows(1)
                    .push('weight', {value: 3})
                    .push('percent', {}, {tooltip: 'wPercent.weight'});
            });

            expect(model.wPercent().total()).to.equal(4);
            expect(model.wPercent().weight(0)).to.equal(1/4);
            expect(model.wPercent().weight(1)).to.equal(3/4);

            expect(model.rows(0)('percent')().tooltip(0)).to.equal(1/4);
            expect(model.rows(1)('percent')().tooltip(1)).to.equal(3/4);
        });

        it.skip('should aggregate 2d/multi range', function () {
            var model = TableModel.build(function (T) {
                T.range('group', {multi: true})(0)
                    .push('group-weight', {model: 1})
                    .push('group-grade1', {}, {'=total': 'grade1'}) // grade1
                    .push('group-grade2', {});

                T.rows(0)
                    .push('weight', {value: 2})
                    .push('grade1', {value: 2})
                    .push('grade2', {value: 2});

                T.rows(1)
                    .push('weight', {value: 3})
                    .push('grade1', {value: 3})
                    .push('grade2', {value: 3});
            });

            //expect(model.group(0).weight).to.be.a('function');
        });
    });
});
