angular.module('peersay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$filter', '$timeout', '$q', 'Tiles', 'ngTableParams', 'Projects'];
function ProjectRequirementsCtrl($scope, $filter, $timeout, $q, Tiles, ngTableParams, Projects) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
    m.progress = {
        value: 0,
        total: 1
    };
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;
    m.onFullView = onFullView;
    // Data
    m.criteria = [];
    m.criteriaStr = null;
    m.groups = [];
    // Table settings
    var tableSettings = {
        counts: [],
        total: 0,
        getData: tableGetData
    };
    m.normTableParams = new ngTableParams({ count: 10 }, tableSettings);
    m.fullTableParams = new ngTableParams({ count: 10 }, angular.extend(tableSettings, {
        groupBy: tableGroupBy
    }));
    // General
    m.compactTable = false;
    m.popoverOn = null;
    m.savingData = false;
    m.reloadTables = reloadTables;
    m.updateCriteria = updateCriteria;
    // Grouping
    m.groupByOptions = [
        null,
        'name',
        'group',
        'priority'
    ];
    m.groupBy = 'group';
    m.selectGroupBy = selectGroupBy;
    // Sorting
    m.tableSortClass = tableSortClass;
    m.tableSortClick = tableSortClick;
    // Edit groups
    m.setCriteriaGroup = setCriteriaGroup;
    m.newGroup = {
        edit: false,
        value: ''
    };
    m.groupKeyPressed = groupKeyPressed;
    // Edit cell
    m.criteriaKeyPressed = criteriaKeyPressed;


    activate();

    function activate() {
        readCriteria();

        Tiles.setProgress(m.tile, m.progress); // TODO - what is progress??
        $scope.$on('$destroy', function () {
            m.progress = { value: 0, total: 0 };
            Tiles.setProgress(m.tile, m.progress);
        });
    }

    function showFullView(control) {
        m.popoverOn = null;
        Tiles.toggleFullView(true, m.tile.uri, control);
    }

    function onFullView() {
        if (!m.criteria.length) {
            var added = addCriteriaLike(null);
            added.edit = 'name'; // invite to edit
        }

        // This triggers the focus on first element
        reloadTables();
    }

    // Data
    //
    function readCriteria() {
        Projects.readProjectCriteria(m.projectId)
            .then(function (res) {
                //m.criteria = m.criteria2;
                m.criteria = res.criteria;
                m.criteriaStr = JSON.stringify({ criteria: m.criteria });
                m.groups = [].concat(null, getGroups());
                reloadTables(true);
            });
    }

    function updateCriteria() {
        var data = getCriteriaData();
        if (!data) { return; } // unmodified

        var delayPromise = $timeout(function () {}, 300, false);
        var requestPromise = $q(function (resolve) {
            Projects.updateProjectCriteria(m.projectId, data).finally(resolve);
        });

        m.savingData = true;
        $q.all([delayPromise, requestPromise])
            .then(function () {
                m.savingData = false;
            });
    }

    function getCriteriaData() {
        var res = {criteria: []};
        angular.forEach(pruneEmpty(m.criteria), function (crit) {
            res.criteria.push({
                name: crit.name,
                description: crit.description,
                priority: crit.priority,
                group: crit.group
            });
        });

        var str = JSON.stringify(res);
        if (m.criteriaStr === str) {
            return null; // omit update of identical
        } else {
            m.criteriaStr = str;
            return res;
        }
    }

    function pruneEmpty(arr) {
        return $.map(arr, function (crit) {
            if (!crit.name && !crit.description) {
                return null;
            }
            return crit;
        });
    }

    function getGroups() {
        var groups = [];
        var found = {};
        angular.forEach(m.criteria, function (crit) {
            if (crit.group && !found[crit.group]) {
                found[crit.group] = true;
                groups.push(crit.group);
            }
        });
        return groups;
    }

    // Ng-table handling
    //
    function reloadTables(save) {
        m.popoverOn = null; // hide popover
        m.normTableParams.reload();
        m.fullTableParams.reload();

        if (save) {
            updateCriteria();
        }
    }

    function tableGetData($defer, params) {
        var orderByArr = params.orderBy();
        var orderBy = orderByArr[0];
        var orderByGroup = m.groupBy &&
            orderBy ? m.groupBy !== orderBy.substring(1) : true;
        if (orderByGroup) {
            orderByArr.unshift(m.groupBy);
        }
        //console.log('>>Data reload, orderBy, groupBy', orderByArr, m.groupBy);

        m.criteria = $filter('orderBy')(m.criteria, orderByArr);
        $defer.resolve(m.criteria);
    }

    function tableGroupBy(item) {
        if (m.groupBy === 'name') {
            return item.name[0];
        }
        return item[m.groupBy];
    }

    // Grouping / sorting
    //
    function selectGroupBy(by) {
        m.groupBy = by;
        reloadTables();
    }

    function tableSortClass(tableParams, by) {
        return {
            'sort-asc': tableParams.isSortBy(by, 'asc'),
            'sort-desc': tableParams.isSortBy(by, 'desc')
        };
    }

    function tableSortClick(tableParams, by) {
        var sortOrder = {};
        sortOrder[by] = tableParams.isSortBy(by, 'asc') ? 'desc' : 'asc';
        tableParams.sorting(sortOrder);
    }

    // Edit
    //
    function nextCriteriaLike(criteria) {
        var criteriaIdx = m.criteria.indexOf(criteria);
        var alike = $.map(m.criteria, function (crit, idx) {
            if (idx > criteriaIdx &&
                crit.group === criteria.group &&
                crit.priority === criteria.priority) {
                return crit;
            } else {
                return null;
            }
        });

        //console.log('>>all alike', alike);

        return alike[0];
    }

    function prevCriteria(criteria) {
        var idx = m.criteria.indexOf(criteria);
        return m.criteria[idx - 1];
    }

    function addCriteriaLike(crit) {
        var added = {
            name: '',
            description: '',
            group: crit ? crit.group : null,
            priority: crit ? crit.priority : 'required',
            edit: crit ? crit.edit : null
        };

        //console.log('>>added', added);

        if (crit) {
            var idx = m.criteria.indexOf(crit);
            m.criteria.splice(idx + 1, 0, added);
        }
        else {
            m.criteria.push(added);
        }
        reloadTables(true);
        return added;
    }

    function removeCriteria(crit) {
        var prev = prevCriteria(crit);
        if (prev) {
            prev.edit = 'name';
        }

        var idx = m.criteria.indexOf(crit);
        var removed = m.criteria.splice(idx, 1);
        reloadTables(true);
        return removed;
    }

    function criteriaKeyPressed(criteria, evt) {
        //console.log('>>Key pressed for[%s] of [%s]', criteria.name, criteria.edit, evt.keyCode);

        if (evt.keyCode === 13) {
            var next = nextCriteriaLike(criteria);
            //console.log('>> next', next);

            if (next) {
                next.edit = criteria.edit;
            } else {
                addCriteriaLike(criteria);
            }
            return evt.preventDefault();
        }

        if (evt.keyCode === 8) {
            if (criteria.edit === 'description' && criteria.description === '') {
                criteria.edit = 'name';
            }
            else if (criteria.edit === 'name' && criteria.name === '') {
                removeCriteria(criteria);
                return evt.preventDefault();
            }
        }
    }

    function groupKeyPressed(criteria, evt) {
        //console.log('>>Key pressed for[%s] of [%s]', criteria.name, criteria.newGroup, evt.keyCode);

        if (evt.keyCode === 13) {
            if (criteria.newGroup.value) {
                criteria.group = criteria.newGroup.value;
                if (m.groups.indexOf(criteria.group) < 0) {
                    m.groups.push(criteria.group);
                }
                reloadTables(true);
            }
            criteria.newGroup = {};
            return;
        }
        if (evt.keyCode === 27) {
            criteria.newGroup = {};
            return evt.preventDefault();
        }
    }

    function setCriteriaGroup(criteria, group) {
        criteria.group = group;
        reloadTables(true);
    }
}