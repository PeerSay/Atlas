angular.module('peersay')
    .controller('ProjectEvaluationRequirementsCtrl', ProjectEvaluationRequirementsCtrl);

ProjectEvaluationRequirementsCtrl.$inject = ['$scope', '$filter', 'Tiles', 'ngTableParams', 'Projects'];
function ProjectEvaluationRequirementsCtrl($scope, $filter, Tiles, ngTableParams, Projects) {
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
    m.groups = [];
    m.criteria2 = [
        {
            name: "Initial Capacity",
            description: '12TB Basic (end of 2015)',
            priority: 'required',
            group: null
        },
        {
            name: "Support Level",
            description: 'NBD / Global',
            priority: 'required',
            group: 'Storage'
        },
        {
            name: "Scale Up Growth",
            description: 'Another 10 TB',
            priority: 'optional',
            group: null
        },
        {
            name: "Network Connections",
            description: 'NAS / ISCSI',
            priority: 'optional',
            group: 'Network'
        }
    ];

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
    m.compactTable = true;
    m.popoverOn = null;
    m.reloadTables = reloadTables;
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
    m.selectGroup = selectGroup;
    m.newGroup = {
        edit: false,
        value: ''
    };
    m.groupKeyPressed = groupKeyPressed;
    // Edit cell
    m.criteriaKeyPressed = criteriaKeyPressed;


    activate();

    function activate() {
        Projects.readProjectCriteria(m.projectId)
            .then(function (res) {
                m.criteria = m.criteria2;
                m.groups = [].concat(null, getGroups());
            });

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
        reloadTables();
    }

    // Init
    //
    function reloadTables() {
        m.popoverOn = null; // hide popover
        m.normTableParams.reload();
        m.fullTableParams.reload();
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

    function tableGetData($defer, params) {
        //console.log('>>Data reloaded', m.criteria);

        var orderedData = params.sorting() ?
            $filter('orderBy')(m.criteria, params.orderBy()) :
            m.criteria;

        $defer.resolve(orderedData);
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
    function nextCriteria(criteria) {
        var idx = m.criteria.indexOf(criteria);
        return m.criteria[idx + 1];
    }

    function prevCriteria(criteria) {
        var idx = m.criteria.indexOf(criteria);
        return m.criteria[idx - 1];
    }

    function addCriteriaLike(crit) {
        var added = {
            name: '',
            description: '',
            priority: crit ? crit.priority : 'required',
            group: crit ? crit.group : null,
            edit: crit ? crit.edit : null
        };

        m.criteria.push(added);
        reloadTables();
        return added;
    }

    function removeCriteria(crit) {
        var prev = prevCriteria(crit);
        if (prev) {
            prev.edit = 'name';
        }

        var idx = m.criteria.indexOf(crit);
        var removed = m.criteria.splice(idx, 1);
        reloadTables();
        return removed;
    }

    function criteriaKeyPressed(criteria, evt) {
        //console.log('>>Key pressed for[%s] of [%s]', criteria.name, criteria.edit, evt.keyCode);

        if (evt.keyCode === 13) {
            var next = nextCriteria(criteria);
            if (next) {
                next.edit = criteria.edit;
            } else {
                addCriteriaLike(criteria);
            }
            criteria.edit = false;
            return;
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
                m.groups.push(criteria.group);
                reloadTables();
            }
            criteria.newGroup = {};
            return;
        }
        if (evt.keyCode === 27) {
            criteria.newGroup = {};
            return evt.preventDefault();
        }
    }

    function selectGroup(criteria, group) {
        criteria.group = group;
        reloadTables();
    }
}