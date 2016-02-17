/**
 *  Auth service provices info and methods for the current user
 *  The token is used to authorize user sessions as session id is not sent with AJAX requests
 */
app.factory('AuthService', function (StorageService, SettingsService, $q, $http) {
    var auth = {
        user: null,
        token: false,
        initialized: $q.defer(),
        init: function () {
            var storedUser = StorageService.get("user");
            var storedToken = StorageService.get("token");
            // JH - Not too fond of this function the way it works but leave it for now...
            // storedUser = null;
            if (storedUser && storedToken) {
                var params = {
                    'username': storedUser.username,
                    'sessionid': storedToken
                };
                $http.get(SettingsService.api + '/auth/verify-user', {params: params}).then(
                    function (response) { // success
                        auth.token = storedToken;
                        auth.user = $user();
                        auth.user.initFromData(response.data.user_data);
                        auth.initialized.resolve();
                    },
                    function () { // 401 or something - clear the user
                        auth.clear();
                        auth.initialized.resolve();
                    }
                )
            } else {
                auth.clear();
                auth.initialized.resolve()
            }
        },
        clear: function () {
            auth.user = null;
            auth.token = false;
            StorageService.remove("user");
            StorageService.remove("token")
        },
        login: function (user, token) {
            auth.user = user;
            console.log(auth.user);
            auth.token = token;
            StorageService.set("user", user);
            StorageService.set("token", token)
        },
        updateUser: function (user_data) {
            auth.user.initFromData(user_data);
            StorageService.set("user", auth.user)
        },
        isLogged: function () {
            return auth.initialized.promise.then(function () {
                return (auth.user != null);
            })
        }
    };
    auth.init();
    return auth;
});


app.factory('PostLoginService', function ($rootScope, AuthService, $interval) {
    // Performs post login actions.
    // This code can't reside in AuthService since it would cause circular dependencies
    var service = {
        init: function () {
            AuthService.isLogged().then(function (isLogged) {
                if (isLogged)
                    service.postLoginActions()
            })
        },
        postLoginActions: function () {
            // make 'user' available to all controllers and templates
            $rootScope.user = AuthService.user;
            // connect to chat

            $interval($rootScope.checkNotifications, 10000);
            $rootScope.checkNotifications();
        }
    };
    service.init();
    return service
});


/**
 * We;re not using cookies anymore.Instead we use the HTML5 local storage available with most browsers
 * We could handle old browsers with a fallback to cookies
 */
app.factory('StorageService', [function () {
    var srv = {
        get: function (key) {
            var val = localStorage.getItem(key);
            if (val) {
                try {
                    var json = JSON.parse(val);
                } catch (e) {
                    return val
                }
                return json
            } else
                return false;
        },
        set: function (key, obj) {
            localStorage.setItem(key, JSON.stringify(obj))
        },
        remove: function (key) {
            localStorage.removeItem(key)
        }
    };
    return srv;
}]);