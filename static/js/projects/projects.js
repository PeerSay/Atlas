/*global angular:true*/

angular.module('peersay')
    .factory('Projects', Projects);

Projects.$inject = ['restApi'];

var PROJECTS = [
    {
        id: 1,
        title: 'Welcome Project',
        dueTo: +new Date
    },
    {
        id: 2,
        title: 'My Project',
        dueTo: +new Date + 100
    }
];

function Projects(rest) {

    Projects.projects = [];
    Projects.create = {
        showDlg: false,
        title: ''
    };
    Projects.getProjects = getProjects;
    Projects.toggleCreateDlg = toggleCreateDlg;
    Projects.createProject = createProject;

    getProjects();


    function getProjects() {
        Projects.projects = PROJECTS;
    }

    function toggleCreateDlg(on) {
        Projects.create.showDlg = on;
    }

    function createProject() {
        var id = nextId();
        Projects.projects.push({
            id: id,
            title: Projects.create.title,
            dueTo: +new Date
        });

        Projects.create.showDlg = false;
        Projects.create.title = '';
    }

    function nextId() {
        return Projects.projects[Projects.projects.length - 1].id + 1
    }

    return Projects;
}
