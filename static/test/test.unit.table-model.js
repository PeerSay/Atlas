/*global describe:true, it:true, inject:true */

describe.only('TableModel', function () {
    var TableModel;
    beforeEach(function () {
        module('peersay');

        inject(function (_TableModel_) {
            TableModel = _TableModel_;
        });
    });

    describe('Build', function () {
        it('should build model on empty criteria data', function () {
            var data = [];
            var model = TableModel.buildModel(data);

            model.columns.should.have.length(4);
            model.columns[0].should.have.property('field').equal('name');
            model.columns[0].should.have.property('value').equal('Criteria');
            model.rows.should.have.length(0);
        });

        it('should build vendor column', function () {
            var data = [
                { name: '', description: '', group: null, priority: 'required', vendors: [
                    { title: 'IBM', value: 'str' }
                ] }
            ];
            var model = TableModel.buildModel(data);

            model.columns.should.have.length(5);
            model.columns[4].should.have.property('field').equal('IBM');
            model.columns[4].should.have.property('value').equal('IBM');
        });

        it('should build single vendor column from 2 criteria', function () {
            var data = [
                { name: '', description: '', group: null, priority: 'required',
                    vendors: [
                        { title: 'IBM', value: 'str' }
                    ]
                },
                { name: '', description: '', group: null, priority: 'required',
                    vendors: [
                        { title: 'IBM', value: 'str2' }
                    ]
                }
            ];
            var model = TableModel.buildModel(data);

            model.columns.should.have.length(5);
            model.columns[4].should.have.property('value').equal('IBM');
        });

        it('should build rows', function () {
            var data = [
                { name: 'xyz', description: '', group: null, priority: 'required', vendors: [
                    { title: 'IBM', value: 'str' }
                ] },
                { name: 'abc', description: '', group: null, priority: 'required', vendors: [] }
            ];
            var model = TableModel.buildModel(data);

            model.rows.should.have.length(data.length);
            model.rows[0].should.have.length(model.columns.length); // same length as columns
            model.rows[0][0].should.have.property('id').equal('name_0');
            model.rows[0][0].should.have.property('value').equal('xyz');
            model.rows[0][0].should.have.property('path').equal('/criteria/0/name');
            // existing vendor
            model.rows[0][4].should.have.property('id').equal('IBM_0');
            model.rows[0][4].should.have.property('value').equal('str');
            model.rows[0][4].should.have.property('path').equal('/criteria/0/vendors/0/value');
            // non-existing vendor
            model.rows[1][4].should.have.property('id').equal('IBM_1');
            model.rows[1][4].should.have.property('value').equal('');
            model.rows[1][4].should.have.property('path').equal('/criteria/1/vendors/-');
        });
    });

    describe('Select', function () {
        it('should build select static columns', function () {
            var data = [
                { name: 'abc', description: '', group: null, priority: 'required', vendors: [] }
            ];
            TableModel.buildModel(data);
            var sel = TableModel.selectColumns([{ field: 'name' }]);

            sel.columns.should.have.length(1);
            sel.rows.should.have.length(data.length);
            sel.rows[0].should.have.length(1);

            var sel2 = TableModel.selectColumns([{ field: 'name' }, {field: 'description'}, {field: 'group'}]);

            sel2.columns.should.have.length(3);
            sel2.rows.should.have.length(data.length);
            sel2.rows[0].should.have.length(3);
        });

        it('should build select all/some vendor columns', function () {
            var data = [
                { name: 'abc', description: '', group: null, priority: 'required', vendors: [
                    {title: 'IBM', value: 1},
                    {title: 'XP', value: 2},
                    {title: 'PS', value: 3}
                ] }
            ];
            TableModel.buildModel(data);
            var sel = TableModel.selectColumns([{ vendor: true }]);

            sel.columns.should.have.length(3);
            sel.rows.should.have.length(data.length);
            sel.rows[0].should.have.length(3);

            var sel2 = TableModel.selectColumns([{ vendor: true }], 2);

            sel2.columns.should.have.length(2);
            sel2.rows.should.have.length(data.length);
            sel2.rows[0].should.have.length(2);
        });
    });


    describe('Topics', function () {

    });


    describe('Traversing', function () {
        it('cell should rowIdx for traversal', function () {
            var data = [
                { name: '', description: '', group: null, priority: 'required', vendors: [] },
                { name: '', description: '', group: null, priority: 'required', vendors: [] }
            ];
            var model = TableModel.buildModel(data);
            var row0 = model.rows[0];
            var cell0 = row0[0];

            cell0.rowIdx().should.equal(0);
        });

        it('should traverse rows via cell obj', function () {
            var data = [
                { name: '', description: '', group: null, priority: 'required', vendors: [] },
                { name: '', description: '', group: null, priority: 'required', vendors: [] }
            ];
            var model = TableModel.buildModel(data);
            var row0 = model.rows[0];
            var row1 = model.rows[1];
            var cell00 = row0[0];
            var cell10 = row1[0];

            var next1 = TableModel.nextRowLike(cell00);
            next1.should.equal(row1);

            var next2 = TableModel.nextRowLike(cell10);
            should.not.exist(next2); // oob
        });

        it('should traverse rows with predicate', function () {
            var data = [
                { name: '', description: '', group: null, priority: 'required', vendors: [] },
                { name: '', description: '', group: null, priority: 'required', vendors: [] },
                { name: '', description: '', group: null, priority: 'optional', vendors: [] }
            ];
            var model = TableModel.buildModel(data);
            var row0 = model.rows[0];
            var row1 = model.rows[1];
            var cell00 = row0[0];
            var cell10 = row1[0];
            var predicate = {key: 'priority', value: 'required'};

            var next1 = TableModel.nextRowLike(cell00, predicate);
            next1.should.equal(row1);

            var next2 = TableModel.nextRowLike(cell10, predicate);
            should.not.exist(next2); // oob
        });
    });


    describe('Edits', function () {
        it('should add row', function () {
            var data = [
                { name: 'aaa', description: '', group: 'AAA', priority: 'required', vendors: [] },
                { name: '', description: '', group: null, priority: 'optional', vendors: [] }
            ];
            var model = TableModel.buildModel(data);
            var row0 = model.rows[0];
            var row1 = model.rows[1];
            var cell00 = row0[0];
            var cell10 = row1[0];

            TableModel.addRowLike(cell00);
            var newRow = model.rows[1];
            newRow[0].rowIdx().should.equal(1); // new row has correct idx
            newRow[0].criteria.group.should.equal('AAA'); // new row inherits some props
            newRow[0].criteria.priority.should.equal('required');
            newRow[0].criteria.name.should.equal(''); // others are empty

            cell10.rowIdx().should.equal(2); // row after added has index changed
        });
    })
});
