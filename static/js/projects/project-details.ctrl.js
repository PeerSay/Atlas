/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['Projects', '$routeParams'];
function ProjectDetailsCtrl(Projects, $routeParams) {
    var m = this;
    var id = Number($routeParams.projectId);

    m.project = {};
    m.tileView = 'norm';
    m.tileBtnClass = {
        'glyphicon-zoom-out': m.tileView === 'norm',
        'glyphicon-zoom-in': m.tileView === 'min'
    };
    m.toggleTileView = toggleTileView;
    m.tiles = [
        {
            name: 'essentials',
            title: 'Project Essentials',
            progress: '1/10',
            show: true,
            html: '/html/project-essentials.html'
        },
        {
            name: 'evaluation',
            title: 'Evaluation Requirements',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            name: 'vendor-input',
            title: 'Vendor Input',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            name: 'shortlists',
            title: 'Shortlists',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            name: 'pocs',
            title: 'POCs',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            name: 'vendor-ref',
            title: 'Vendor Reference',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            name: 'debrief',
            title: 'Audit / Debrief',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        }
    ];
    m.curTile = m.tiles[0];
    m.toggleTile = toggleTile;
    // Title
    m.editTitle = {
        show: false,
        value: ''
    };
    m.toggleEditTitleDlg = toggleEditTitleDlg;
    m.updateProjectTitle = updateProjectTitle;
    // xxx
    m.dbg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    getProject();

    function getProject() {
        Projects
            .getProjects()
            .success(function () {
                m.project = findBy('id')(Projects.projects, id)[0];
                m.project.duration = '6 months';
                m.project.budget = '$50k';
            });
    }

    function toggleTileView() {
        m.tileView = (m.tileView === 'norm') ? 'min' : 'norm';
    }

    function toggleTile(tile, on) {
        tile.show = (arguments.length > 1) ? on : !tile.show;
    }

    function toggleEditTitleDlg(on) {
        if (on) {
            m.editTitle.value = m.project.title;
        }
        m.editTitle.show = on;
    }

    function updateProjectTitle() {
        Projects.updateProject(m.project)
            .then(function () {
                m.project.title = m.editTitle.value;
            })
            .finally(function () {
                m.editTitle.show = false;
            });
    }

    function findBy(key) {
        return function (arr, val) {
            return $.map(arr, function (p) {
                return (p[key] !== val) ? null : p;
            });
        };
    }
}
