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
    // Tables
    m.criteria = [];
    m.criteria2 = [
        {
            id: 1,
            name: "Initial Capacity",
            description: '12TB Basic (end of 2015)',
            table: 'required',
            group: null
        },
        {
            id: 2,
            name: "Support Level",
            description: 'NBD / Global',
            table: 'required',
            group: null
        },
        {
            id: 3,
            name: "Scale Up Growth",
            description: 'Another 10 TB',
            table: 'optional',
            group: null
        },
        {
            id: 4,
            name: "Network Connections",
            description: 'NAS / ISCSI',
            table: 'optional',
            group: 'Network'
        }
    ];
    var tableSettings = {
        counts: [],
        total: 0,
        getData: function ($defer, params) {
            var filter = params.filter();
            var filtered = $filter('filter')(m.criteria, filter);

            if (!filtered.length) {
                filtered.push({
                    id: 5,
                    name: '',
                    description: '',
                    table: 'required',
                    group: null,
                    edit: 'name'
                });
                filtered.empty = true; // XXX?
            }

            //console.log('>>Data reloaded', filtered);

            $defer.resolve(filtered);
        }
    };
    m.normTableParams = new ngTableParams({ count: 10 }, tableSettings);
    m.fullTableParams = new ngTableParams({
        count: 10,
        filter: { table: 'required' }
    }, angular.extend(tableSettings, {groupBy: 'group'}));
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

    //popover
    m.popoverOn = null;


    activate();

    function activate() {
        Projects.readProjectCriteria(m.projectId)
            .then(function (res) {
                m.criteria = res.criteria;
            });

        Tiles.setProgress(m.tile, m.progress);
        $scope.$on('$destroy', function () {
            m.progress = { value: 0, total: 0 };
            Tiles.setProgress(m.tile, m.progress);
        });
    }

    function showFullView(control) {
        m.popoverOn = null;
        Tiles.toggleFullView(true, m.tile.uri, control);
    }

    function reloadTables() {
        m.popoverOn = null;
        m.fullTableParams.reload();
    }

    function nextCriteria(criteria) {
        return find(m.criteria, function (crit) {
            var ok = (crit.table === criteria.table && crit.id > criteria.id);
            return ok ? crit : null;
        })[0];
    }

    function prevCriteria(criteria) {
        var arr = find(m.criteria, function (crit) {
            var ok = (crit.table === criteria.table && crit.id < criteria.id);
            return ok ? crit : null;
        });
        return arr[arr.length - 1];
    }

    function addCriteriaLike(crit) {
        var id = m.criteria[m.criteria.length - 1].id + 1;
        var cr = {
            id: id,
            name: '',
            description: '',
            table: crit.table,
            group: crit.group,
            edit: crit.edit
        };

        console.log('>> Add new', cr);
        m.criteria.push(cr);
        reloadTables();
    }

    function removeCriteria(crit) {
        var prev = prevCriteria(crit);
        if (prev) {
            prev.edit = 'name';
        }

        var idx = m.criteria.indexOf(crit);
        m.criteria.splice(idx, 1);
        reloadTables();
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

    // TODO: to util
    function find(arr, func) {
        return $.map(arr, function (obj) {
            return func(obj);
        });
    }
}