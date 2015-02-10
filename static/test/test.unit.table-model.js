/*global describe:true, it:true, inject:true */

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
        module('peersay');

        inject(function (_TableModel_) {
            TableModel = _TableModel_;
        });
    });

    describe('Build', function () {
        it('should build model on empty criteria data', function () {
            var data = [];
            var model = TableModel.buildModel(data);

            model.rows.should.have.length(0);
            Object.keys(model.columns).should.have.length(5);
            model.columns['name'].should.have.property('field').equal('name');
            model.columns['name'].should.have.property('value').equal('Criteria');
        });

        it('should build vendor column', function () {
            var data = mockSingleVendor();
            var model = TableModel.buildModel(data);

            Object.keys(model.columns).should.have.length(7);
            model.columns['vendors\0IBM\0input'].should.have.property('value').equal('IBM');
            model.columns['vendors\0IBM\0input'].should.have.property('field').equal('IBM');
            model.columns['vendors\0IBM\0score'].should.have.property('value').equal('IBM');
            model.columns['vendors\0IBM\0score'].should.have.property('field').equal('IBM');
        });

        it('should build single vendor column from 2 criteria', function () {
            var data = mock2Rows2Vendors();
            var model = TableModel.buildModel(data);

            Object.keys(model.columns).should.have.length(7);
            model.columns['vendors\0IBM\0input'].should.have.property('value').equal('IBM');
        });

        it('should build rows', function () {
            var data = mock2Rows1Vendor();
            var model = TableModel.buildModel(data);

            Object.keys(model.rows).should.have.length(data.length);
            // 1st row - existing vendor
            model.rows[0]['name'].should.have.property('value').equal('xyz');
            model.rows[0]['vendors\0IBM\0input'].should.have.property('value').equal('str');
            model.rows[0]['vendors\0IBM\0score'].should.have.property('value').equal(1);
            // 2nd row - non-existing vendor
            model.rows[1]['name'].should.have.property('value').equal('abc');
            model.rows[1]['vendors\0IBM\0input'].should.have.property('value').equal(null);
            model.rows[1]['vendors\0IBM\0score'].should.have.property('value').equal(null);

        });
    });

    describe('Select', function () {
        it('should select single column with single selector', function () {
            var data = mock1Row0Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name'
                }];
            });

            sel.columns.should.have.length(1);
            sel.columns[0].model.should.have.property('field').equal('name');

            sel.rows.should.have.length(1);
            sel.rows[0].should.have.length(1);
            sel.rows[0][0].model.should.have.property('value').equal('abc');
        });

        it('should select multiple columns with array selector, coming in order', function () {
            var data = mock1Row0Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name', 'priority']
                }];
            });

            sel.columns.should.have.length(2);
            sel.columns[1].model.should.have.property('field').equal('priority');

            sel.rows.should.have.length(1);
            sel.rows[0].should.have.length(2);
            sel.rows[0][1].model.should.have.property('value').equal('optional');
        });

        it('should select vendor columns with re selector', function () {
            var data = mock1Row2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/input'
                }];
            });

            sel.columns.should.have.length(2); // 2 cols
            sel.columns[0].model.should.have.property('field').equal('IBM');

            sel.rows.should.have.length(1);
            sel.rows[0].should.have.length(2); // 2 cols
            sel.rows[0][1].model.should.have.property('value').equal('xp');
        });

        it('should select vendor columns with re selector and limit', function () {
            var data = mock1Row2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/score',
                    limit: 1
                }];
            });

            sel.columns.should.have.length(1); // 1 col
            sel.columns[0].model.should.have.property('field').equal('IBM');

            sel.rows.should.have.length(1);
            sel.rows[0].should.have.length(1); // 1 col
            sel.rows[0][0].model.should.have.property('value').equal(1);
        });

        it('should add columns properties from spec', function () {
            var data = mock1Row2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name',
                    column: {
                        editable: true,
                        sortable: true
                    }
                }];
            });

            sel.columns.should.have.length(1); // 1 col
            sel.columns[0].should.have.property('id'); // added by default
            sel.columns[0].should.have.property('visible').equal(true); // added by default
            sel.columns[0].should.have.property('editable').equal(true);
            sel.columns[0].should.have.property('sortable').equal(true);
        });

        it('should add cell properties from spec', function () {
            var data = mock1Row2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name',
                    cell: {
                        editable: true,
                        type: 'multiline'
                    }
                }];
            });

            sel.rows.should.have.length(1); // 1 row
            sel.rows[0][0].should.have.property('id'); // added by default
            sel.rows[0][0].should.have.property('visible').equal(true); // added by default
            sel.rows[0][0].should.have.property('editable').equal(true);
            sel.rows[0][0].should.have.property('type').equal('multiline');
        });

        it('should add virtual column with specified model', function () {
            var data = mockSingleVendor();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: null,
                    columnModel: {
                        value: 'x',
                        field: 'some'
                    }
                }];
            });

            sel.columns.should.have.length(1); // 1 col
            sel.columns[0].model.should.have.property('value').equal('x');
        });

        it('should add virtual cells with specified models', function () {
            var data = mockSingleVendor();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: null,
                    cellModels: ['topic', 'priority']
                }];
            });

            sel.columns.should.have.length(1); // 1 col
            sel.rows[0].should.have.length(1); // 1 cell
            sel.rows[0][0].models.should.have.property('topic');
            sel.rows[0][0].models.should.have.property('priority');
        });
    });

    describe('Group & sort', function () {
        it('should return groupBy value', function () {
            var data = mock3RowsForSorting();
            TableModel.buildModel(data);
            var rows = TableModel.viewModel.rows;

            // by topic
            TableModel.getGroupByValue(rows[0], 'topic').should.equal('AAA');
            should.not.exist(TableModel.getGroupByValue(rows[1], 'topic'));
            // by priority
            TableModel.getGroupByValue(rows[0], 'priority').should.equal('required');
            TableModel.getGroupByValue(rows[1], 'priority').should.equal('optional');
            // not grouped
            should.not.exist(TableModel.getGroupByValue(rows[1], null));
            should.not.exist(TableModel.getGroupByValue(rows[2], null));
        });

        it('should sort on simple column keys', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);

            var rows = TableModel.sortViewModel({'name': 'asc'}, null);
            rows[0][0].model.value.should.equal('abc'); //'abc' < 'xyz
            rows[1][0].model.value.should.equal('xyz');
        });

        it('should sort on complex column keys', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);

            TableModel.sortViewModel({'vendors\0IBM\0score': 'desc'}, null);
            var sel = TableModel.selectViewModel(function () {
                return [{ selector: 'vendors/IBM/score' }];
            });
            sel.rows[0][0].model.should.have.property('value').equal(null);
            sel.rows[1][0].model.value.should.equal(1); // row with vendor defined moved to 2nd pos
        });

        it('should sort by group first', function () {
            var data = mock3RowsForSorting();
            TableModel.buildModel(data);

            var rows = TableModel.sortViewModel({'name': 'asc'}, 'topic');
            rows[0][0].model.value.should.equal('b'); //b > a, but it's group is null, so it's on top
            rows[1][0].model.value.should.equal('a');
            rows[2][0].model.value.should.equal('c');
        });
    });

    describe('Topics', function () {

    });

    describe('Traversing', function () {

        it('should traverse rows via cell obj', function () {
            var data = mock3RowsForSorting();
            TableModel.buildModel(data);
            var rows = TableModel.viewModel.rows;
            var row0 = rows[0];
            var row1 = rows[1];
            var row2 = rows[2];

            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name'
                }];
            });
            var cell00 = sel.rows[0][0];
            var cell10 = sel.rows[1][0];
            var cell20 = sel.rows[2][0];

            var next1 = TableModel.nextRowLike(cell00);
            var next2 = TableModel.nextRowLike(cell10);
            var next3 = TableModel.nextRowLike(cell20);

            next1.should.equal(row1);
            next2.should.equal(row2);
            should.not.exist(next3);
        });

        it('should traverse sorted rows with predicate', function () {
            var data = mock3RowsForSorting();
            TableModel.buildModel(data);
            TableModel.sortViewModel({'priority': 'desc'}, null);
            var rows = TableModel.viewModel.rows;
            var row0 = rows[0];
            var row1 = rows[1];
            var row2 = rows[2];

            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name'
                }];
            });
            var cell00 = sel.rows[0][0];
            var cell10 = sel.rows[1][0];
            var cell20 = sel.rows[2][0];
            var predicate = {key: 'priority', value: 'required'};

            var next1 = TableModel.nextRowLike(cell00, predicate);
            next1.should.equal(row1);

            var next2 = TableModel.nextRowLike(cell10, predicate);
            should.not.exist(next2); // oob
        });
    });

    describe('Edit - save cell', function () {
        it('should generate non-vendor patch', function () {
            var data = mock1Row0Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'name'
                }];
            });
            var cell = sel.rows[0][0];

            //modify
            cell.model.value = '123';
            var patch = TableModel.saveCell(cell.model);

            patch[0].should.have.property('op').equal('replace');
            patch[0].should.have.property('path').equal('/criteria/0/name');
            patch[0].should.have.property('value').equal('123');
        });

        it('should generate existing vendor patch', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/input'
                }];
            });
            var cell = sel.rows[0][0];

            //modify
            cell.model.value = '123';
            var patch = TableModel.saveCell(cell.model);

            patch[0].should.have.property('op').equal('replace');
            patch[0].should.have.property('path').equal('/criteria/0/vendors/0/input');
            patch[0].should.have.property('value').equal('123');
        });

        it('should generate non-existing vendor patch', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/input'
                }];
            });
            var cell = sel.rows[1][0]; // no vendors here

            //modify
            cell.model.value = '123';
            var patch = TableModel.saveCell(cell.model);

            patch[0].should.have.property('op').equal('add');
            patch[0].should.have.property('path').equal('/criteria/1/vendors/0');
            patch[0].value.should.have.property('input').equal('123');
            patch[0].value.should.have.property('title').equal('IBM');
            patch[0].value.should.have.property('score').equal(0);
        });
    });

    describe('Edit - add & remove row', function () {
        it('should add row to empty table', function () {
            var data = [];
            TableModel.buildModel(data);
            var patch = TableModel.addRowLike(null);

            patch[0].op.should.equal('add');
            patch[0].path.should.equal('/criteria/0');
            patch[0].value.should.have.property('name').equal('');
            patch[0].value.should.have.property('priority').equal('required');

            var cell00 = TableModel.viewModel.rows[0][0];
            cell00.model.should.have.property('key').equal('name');
        });

        it('should add row to non-empty table', function () {
            var data = mock1Row0Vendors();
            var model = TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name','priority']
                }];
            });
            var cell00 = sel.rows[0][0];

            var patch = TableModel.addRowLike(cell00);

            patch[0].op.should.equal('add');
            patch[0].path.should.equal('/criteria/1');
            patch[0].value.should.have.property('name').equal('');
            patch[0].value.should.have.property('priority').equal('optional');

            var cell10 = TableModel.viewModel.rows[1][0];
            cell10.model.should.have.property('key').equal('name');
        });

        it('newly added row should have justAdded prop', function () {
            var data = mock1Row0Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name','priority']
                }];
            });
            var cell00 = sel.rows[0][0];

            var patch = TableModel.addRowLike(cell00);

            var cell10 = TableModel.viewModel.rows[1][0];
            cell10.should.have.property('justAdded').equal(true);
        });

        it.skip('should remove row', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name','priority']
                }];
            });
            var cell00 = sel.rows[0][0];

            var patch = TableModel.removeRow(cell00);

            //bad patch, see issue I opened:
            // https://github.com/Starcounter-Jack/JSON-Patch/issues/65
            console.log('>>Bad patch: ', patch);

            patch.should.have.length(1);
            patch[0].op.should.equal('remove');
            patch[0].path.should.equal('/criteria/0');
        });

        it('should remove last row', function () {
            var data = mockSingleVendor();
            var model = TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name','priority']
                }];
            });
            var cell00 = sel.rows[0][0];

            var patch = TableModel.removeRow(cell00);

            patch.should.have.length(1);
            patch[0].op.should.equal('remove');
            patch[0].path.should.equal('/criteria/0');

            // model updated
            model.rows.should.have.length(0);
            var sel2 = TableModel.selectViewModel(function () {
                return [{
                    selector: ['name','priority']
                }];
            });
            sel2.rows.should.have.length(0);
        });
    });

    describe('Edit - save, add & remove column', function () {
        it('should verify the vendor name is unique', function () {
            var data = mock1Row2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/input'
                }];
            });
            var col0 = sel.columns[0];

            TableModel.isUniqueColumn(col0.model, 'IBM').should.equal(true); // ok on itself
            TableModel.isUniqueColumn(col0.model, 'XP').should.equal(false);// conflict
            TableModel.isUniqueColumn(col0.model, 'XP2').should.equal(true); // ok
        });

        it('should save existing column title', function () {
            var data = mock2Rows2Vendors();
            TableModel.buildModel(data);
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: 'vendors/.*?/input'
                }];
            });
            var col0 = sel.columns[0];

            col0.model.value = 'XP';
            var patch = TableModel.saveColumn(col0.model);

            patch.should.have.length(2);
            patch[0].should.have.property('op').equal('replace');
            patch[0].should.have.property('path').equal('/criteria/1/vendors/0/title'); // in reverse order?
            patch[0].should.have.property('value').equal('XP');

            patch[1].should.have.property('op').equal('replace');
            patch[1].should.have.property('path').equal('/criteria/0/vendors/0/title'); // in reverse order?
            patch[1].should.have.property('value').equal('XP');
        });

        it('should add new column', function () {
            var data = mock2Rows1Vendor();
            TableModel.buildModel(data);
            var model = { field: '...', value: ''};
            var sel = TableModel.selectViewModel(function () {
                return [{
                    selector: null, // virtual
                    columnModel: model
                }];
            });

            model.value = 'XP';
            var patch = TableModel.addColumn(model.value);

            patch.should.have.length(2);
            patch[0].should.have.property('op').equal('add');
            patch[0].should.have.property('path').equal('/criteria/1/vendors/0'); // in reverse order
            patch[0].value.should.have.property('title').equal('XP');

            patch[1].should.have.property('op').equal('add');
            patch[1].should.have.property('path').equal('/criteria/0/vendors/1'); // second vendor
            patch[0].value.should.have.property('title').equal('XP');
        });

        it('should remove column', function () {
            //TODO -  (also bad patch due to fast-json-patch bug)
        });
    });
});


function mockSingleVendor() {
    return [
        { name: 'abc', description: '', topic: null, priority: 'required', vendors: [
            { title: 'IBM', input: 'str', score: 1 }
        ] }
    ];
}

function mock1Row0Vendors() {
    return [
        { name: 'abc', description: '', topic: null, priority: 'optional', vendors: [] }
    ];
}

function mock2Rows1Vendor() {
    return [
        { name: 'xyz', description: '', topic: 'AAA', priority: 'required', vendors: [
            { title: 'IBM', input: 'str', score: 1 }
        ] },
        { name: 'abc', description: '', topic: null, priority: 'required', vendors: [] }
    ]
}

function mock2Rows2Vendors() {
    return [
        { name: '', description: '', topic: null, priority: 'required',
            vendors: [
                { title: 'IBM', input: 'str', score: 1 }
            ]
        },
        { name: '', description: '', topic: null, priority: 'required',
            vendors: [
                { title: 'IBM', input: 'str2', score: 2 }
            ]
        }
    ];
}


function mock1Row2Vendors() {
    return [
        { name: '', description: '', topic: null, priority: 'required',
            vendors: [
                { title: 'IBM', input: 'ibm', score: 1 }, { title: 'XP', input: 'xp', score: 2 }
            ]
        }
    ];
}

function mock3RowsForSorting() {
    return [
        { name: 'a', description: '', topic: 'AAA', priority: 'required', vendors: [] },
        { name: 'b', description: '', topic: null, priority: 'optional', vendors: [] },
        { name: 'c', description: '', topic: 'AAA', priority: 'required', vendors: [] }
    ]
}

