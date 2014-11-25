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
    // Tables
    m.criteria = [];
    m.criteria2 = [
        {
            name: "Initial Capacity",
            description: '12TB Basic (end of 2015)',
            table: 'required',
            group: null
        },
        {
            name: "Support Level",
            description: 'NBD / Global',
            table: 'required',
            group: null
        },
        {
            name: "Scale Up Growth",
            description: 'Another 10 TB',
            table: 'optional',
            group: null
        },
        {
            name: "Network Connections",
            description: 'NAS / ISCSI',
            table: 'optional',
            group: 'Network'
        }
    ];
    var tableSettings = {
        counts: [],
        total: 0,
        getData: function ($defer) {
            //var filter = params.filter();
            //var filtered = $filter('filter')(m.criteria, filter);

            console.log('>>Data reloaded', m.criteria);

            $defer.resolve(m.criteria);
        }
    };
    m.normTableParams = new ngTableParams({ count: 10 }, tableSettings);
    m.fullTableParams = new ngTableParams({ count: 10 }, angular.extend(tableSettings, {
        groupBy: function (item) {
            return item.group;
        }}));
    //
    m.reloadTables = reloadTables;
    m.criteriaKeyPressed = criteriaKeyPressed;
    // Groups
    m.groups = [
        null,
        'Network',
        'Storage'
    ];
    m.selectGroup = selectGroup;
    m.newGroup = {
        edit: false,
        value: ''
    };
    m.groupKeyPressed = groupKeyPressed;
    // Grouping


    // Popover
    m.popoverOn = null;


    activate();

    function activate() {
        Projects.readProjectCriteria(m.projectId)
            .then(function (res) {
                m.criteria = res.criteria;
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

    function reloadTables() {
        m.popoverOn = null;
        m.normTableParams.reload();
        m.fullTableParams.reload();
    }

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
            table: crit ? crit.table : 'required',
            group: crit ? crit.group : null,
            edit: crit  ? crit.edit : null
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