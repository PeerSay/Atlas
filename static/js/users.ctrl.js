/*global angular:true*/

angular.module('peersay')
    .controller('Users', Users);

Users.$inject = ['restApi'];

function Users(rest) {
    var m = this;

    m.users = [];
    m.showEdit = false;
    m.edit = null;
    m.addUser = add;
    m.editUser = edit;
    m.removeUser = remove;
    m.saveUser = save;
    m.cancel = cancel;

    getUsers();


    function getUsers() {
        return rest.readAll('users').then(function (res) {
            m.users = res.data.result;
            return m.users;
        });
    }

    function add() {
        m.edit = { name: '', email: '' };
        m.showEdit = true;
    }

    function edit(user) {
        return rest.read('users', user.id).then(function (res) {
            m.edit = res.data.result;
            m.showEdit = true;
            //return m.edit;
        });
    }

    function save() {
        var id = m.edit.id;

        if (id) {
            rest.update('users', m.edit).then(function (res) {
                m.users[getIdx(id)] = res.data.result;
            });
        } else {
            rest.create('users', m.edit).then(function (res) {
                m.users.push(res.data.result);
            });
        }
        cancel();
    }

    function remove(user) {
        rest.remove('users', user.id).then(function (res) {
            var idx = getIdx(res.data.result.id);
            m.users.splice(idx, 1);
        });
    }

    function cancel() {
        m.edit = null;
        m.showEdit = false;
    }

    function getIdx(id) {
        var idx = -1;
        angular.forEach(m.users, function (obj, i) {
            if (obj.id === id) {
                idx = i;
            }
        });
        return idx;
    }
}
