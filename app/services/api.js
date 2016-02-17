/**
 *  The API service provides easy access to API/Backend Services
 */
app.factory('APIService', function ($http, $location, SettingsService, NoticeService, AuthService, DeviceDetectorService) {
    var service = {
        get: function (url, params, success_fn, loadingFlag, noReload, errorFn) {
            var prms = angular.copy(params);
            if (AuthService.token)
                prms['sessionid'] = AuthService.token;
            return service.apiCall({
                method: 'GET',
                url: url,
                params: prms,
                success_fn: success_fn,
                errorFn: errorFn,
                loading: loadingFlag,
                noReload: noReload,
            })
        },
        post: function (url, data, success_fn, loadingFlag, noReload) {
            var dta = angular.copy(data);
            if (AuthService.token)
                dta['sessionid'] = AuthService.token;
            return service.apiCall({
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                url: url,
                data: dta,
                success_fn: success_fn,
                loading: loadingFlag,
                noReload: noReload,
            })
        },
        put: function (url, data, success_fn, loadingFlag, noReload) {
            var dta = angular.copy(data);
            if (AuthService.token)
                dta['sessionid'] = AuthService.token;
            return service.apiCall({
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                url: url,
                data: dta,
                success_fn: success_fn,
                loading: loadingFlag,
                noReload: noReload
            });
        },
        remove: function (url, data, success_fn, loadingFlag, noReload) {
            var dta = angular.copy(data);
            if (AuthService.token)
                dta['sessionid'] = AuthService.token;
            return service.apiCall({
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                url: url,
                data: dta,
                success_fn: success_fn,
                loading: loadingFlag,
                noReload: noReload
            });
        },
        apiCall: function (opts) {
            NoticeService.clear();

            opts.data = JSON.stringify(opts.data) || JSON.stringify({});
            opts.success_fn = opts.success_fn || function () {
                };
            opts.errorFn = opts.errorFn || function () {
                };
            var loadingFlag = (typeof opts.loadingFlag == 'undefined') ? true : opts.loadingFlag;
            var noReload = (typeof opts.noReload == 'undefined') ? false : opts.noReload;

            return $http({
                method: opts.method,
                url: SettingsService.api + opts.url,
                params: opts.params || {},
                headers: opts.headers || {},
                data: opts.data,
                loading: loadingFlag
            }).success(function (data, status) {
                if (data.error != undefined) {
                    NoticeService.addError(data.error);
                }
                else {
                    opts.success_fn(data, status)
                }
            }).error(function (data, status) {
                console.log("AJAX ERROR", data, status);
                if (status == 500) {
                    NoticeService.addError('Server Error! Please try again.');
                    opts.errorFn();
                }
                else if (status == 404) {
                    NoticeService.addError('API url not found.');
                    opts.errorFn();
                }
                else if (status == 403 && data.user_suspended) {
                    $location.path('/suspended')
                }
                else if (status == 401) { // stale session or something like that - log user out
                    // do full reload
                    if (!noReload) {
                        console.log("Full Reload!");
                        localStorage.clear();
                        location.reload(true)
                    }
                } else { //probably something that needs to be hadle with success_fn
                    opts.success_fn(data, status)
                }
            })
        }
    };
    return service
});

/**
 * HTTPInterceptorService is used to wrap around all HTTP calls including partials rendering
 */
app.factory('HTTPInterceptorService', function ($q, $rootScope, $log) {
    var numLoadings = 0;
    var HTTP_TIMEOUT = 30000; //setting
    $rootScope.showLoader = false;
    $rootScope.loaderError = false;
    $('.preloader-overlay').removeClass('hide')
    return {
        request: function (config) {
            config.timeout = HTTP_TIMEOUT
            config.withCredentials = false
            numLoadings++;
            // Show loader
            if (config.loading && config.loading === true) {
                $rootScope.loaderError = false;
                $rootScope.showLoader = true;
            }
            return config || $q.when(config)
        },
        response: function (response) {
            if ((--numLoadings) <= 0) {
                // Hide loader
                numLoadings = 0;
                $rootScope.showLoader = false;
                $rootScope.loaderError = false;
            }
            return response || $q.when(response);
        },
        responseError: function (response) {
            --numLoadings;
            console.log("RESPONSE ERROR", response, numLoadings)
            // Show error on loader
            if (response.status == 0)
                $rootScope.loaderError = true;
            else if (numLoadings <= 0) {
                // Hide loader
                console.log("HideLoader")
                numLoadings = 0;
                $rootScope.showLoader = false;
                $rootScope.loaderError = false;

            }
            return $q.reject(response);
        }
    };
})
