/*global angular:true*/

angular.module('PeerSay')
    .factory('Backend', Backend);

// General CRUD rule:
// create → POST    /collection
// read →   GET     /collection[/id]
// update → PUT     /collection/id
// patch →  PATCH   /collection/id
// delete → DELETE  /collection/id

Backend.$inject = ['$rootScope', '$http', '$q', 'Notification', 'Util'];
function Backend($rootScope, $http, $q, Notification, _) {
    var B = {
        // Middleware
        use: use,
        // Cache
        invalidateCache: invalidateCache,
        // Crud
        read: request('get'),
        update: request('put'),
        create: request('post'),
        post: request('post'),
        remove: request('delete'),
        patch: request('patch')
    };
    var cache = {};
    var middleware = [];
    var httpCodes = {
        NOT_AUTHORIZED: 401
    };

    function request(method) {
        return function (path, data, query) {
            var url = buildUrl(path);
            var promise, deferred;

            if (method === 'get') {
                promise = readCached(url, query);
            } else {
                deferred = $q.defer();
                promise = deferred.promise;
                doRequest(deferred, method, url, data);
            }

            // Error handling
            promise.catch(function (reason) {
                console.log('API error: ', reason);

                if (reason.status === httpCodes.NOT_AUTHORIZED) {
                    // Cannot call User method due to circular dependency
                    $rootScope.$emit('ps.user.not-authorized');
                }
                else {
                    var err = 'Failed to ' + method + ': [' + url + ']';
                    Notification.showError('API Error', err);
                }
                invalidateCache(url);
            });

            return promise;
        };
    }

    function readCached(url, query) {
        var key = url + (query ? JSON.stringify(query) : '');
        var cached = cache[key];
        if (cached) {
            return cached.promise;
        }

        var deferred = cache[key] = $q.defer();
        doRequest(deferred, 'get', url, null, query);

        return deferred.promise;
    }


    function invalidateCache(url) {
        var key = angular.isArray(url) ? buildUrl(url) : url;
        delete cache[key];
    }

    function doRequest(deferred, method, url, data, query) {
        return $http({
            url: url,
            method: method,
            params: query,
            data: data,
            transformResponse: appendTransform($http.defaults.transformResponse, getTransform(method + url))
        })
            .success(function (res) {
                deferred.resolve(res);
            })
            .error(function (data, status/*, headers, config*/) {
                deferred.reject({status: status, msg: data.error});
            });
    }

    // Credit: $http docs
    function appendTransform(defaults, transform) {
        defaults = angular.isArray(defaults) ? defaults : [defaults];
        return defaults.concat(transform);
    }

    function getTransform(key) {
        return function (data) {
            var mw = _.find(middleware, function (m) {
                return m.re.test(key);
            });

            if (mw && data.result) {
                //console.log('Matched middleware [%s] for url [%s]', mw.re, key);
                return {result: mw.cb(data.result)};
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

    function buildUrl(arr) {
        return [].concat('/api', arr).join('/');
    }

    return B;
}
