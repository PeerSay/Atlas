/*global angular:true*/

angular.module('peersay')
    .factory('Backend', Backend);

// General CRUD rule:
// create → POST    /collection
// read →   GET     /collection[/id]
// update → PUT     /collection/id
// patch →  PATCH   /collection/id
// delete → DELETE  /collection/id

Backend.$inject = ['$http', '$q', 'Notification', 'Util'];
function Backend($http, $q, Notification, _) {
    var B = {
        // Middleware
        use: use,
        // Crud
        read: request('get'),
        update: request('put'),
        create: request('post'),
        remove: request('delete'),
        patch: request('patch')
    };
    var cache = {};
    var middleware = [];

    function request(method) {
        return function (path, data) {
            var url = [].concat('/api', path).join('/');
            var promise, deferred;

            if (method === 'get') {
                promise = readCached(url);
            } else {
                deferred = $q.defer();
                promise = deferred.promise;
                doRequest(deferred, method, url, data);
            }

            // Error handling
            promise.catch(function () {
                var err = 'Failed to ' + method + ': [' + url + ']';
                Notification.showError('API Error', err);
                invalidateCache(url);
            });

            return promise;
        };
    }

    function readCached(url) {
        var cached = cache[url];
        if (cached) {
            return cached.promise;
        }

        var deferred = cache[url] = $q.defer();
        doRequest(deferred, 'get', url);

        return deferred.promise;
    }


    function invalidateCache(url) {
        delete cache[url];
    }

    function doRequest(deferred, method, url, data) {
        return $http({
            url: url,
            method: method,
            data: data,
            transformResponse: appendTransform($http.defaults.transformResponse, getTransform(method + url))
        })
            .success(function (data) {
                deferred.resolve(data.result);
            })
            .error(function () {
                deferred.reject();
            });
    }

    // Credit: $http docs
    function appendTransform(defaults, transform) {
        defaults = angular.isArray(defaults) ? defaults : [defaults];
        return defaults.concat(transform);
    }

    function getTransform(key) {
        return function (data) {
            var mw = _.map(middleware, function (m) {
                return m.re.test(key) ? m : null;
            })[0];

            if (mw) {
                console.log('Matched middleware [%s] for url [%s]', mw.re, key);
                return { result: mw.cb(data.result) };
            }
            return data;
        };
    }

    /**
     * Middleware-like approach
     * Params ( 'get', ['path', '.*?', 'to'] ) will be turned to:
     *  regexp /get\/api\/path\/.*?\/to/
     *  which will match 'get/api/path/123/to' string
     */
    function use(method, path, cb) {
        var reStr = [].concat(method, 'api', path).join('\/');
        middleware.push({
            re: new RegExp(reStr),
            cb: cb
        });
        return B;
    }

    return B;
}
