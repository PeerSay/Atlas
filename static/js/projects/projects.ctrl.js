/*global angular:true*/

angular.module('peersay')
    .controller('ProjectListCtrl', ProjectListCtrl)
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectListCtrl.$inject = ['Projects', '$routeParams'];
function ProjectListCtrl(Projects, $routeParams) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);

    Projects
        .getProjects()
        .success(function () {
            m.projects = Projects.projects;
        });
}


ProjectDetailsCtrl.$inject = ['Projects', '$routeParams'];
function ProjectDetailsCtrl(Projects, $routeParams) {
    var m = this;
    var id = Number($routeParams.projectId);
    m.tileView = 'norm';
    m.tileBtnClass= {
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

    getProject();

    function getProject() {
        Projects
            .getProjects()
            .success(function () {
                m.project = findBy('id')(Projects.projects, id)[0];
            });
    }

    function toggleTileView() {
        m.tileView = (m.tileView === 'norm') ? 'min' : 'norm';
    }

    function toggleTile(tile) {
        tile.show = !tile.show;
    }

    function findBy(key) {
        return function (arr, val) {
            return $.map(arr, function (p) {
                return (p[key] !== val) ? null : p;
            });
        }
    }
}
