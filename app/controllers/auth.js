var get_tz_offs = function () {
    return (new Date()).getTimezoneOffset()
};

app.controller('LoginController', function ($scope, $location, APIService, AuthService, PostLoginService) {
    var username; // for sending email confirmation
    $scope.state = '';
    $scope.login = function () {
        $scope.error = '';
        APIService.post(
            '/auth/login', {username: $scope.username, password: $scope.password, tz_offset: get_tz_offs()},
            function () {
            },
            true, true
        ).success(function (data) {
            var user = $user();
            user.initFromData(data.user_data);
            AuthService.login(user, data.sessionid);
            AuthService.isLogged().then(function (isLogged) {
                if (isLogged && AuthService.user.status != 'online') {
                    APIService.put(
                        "/users/" + AuthService.user.user_id,
                        {status: "online"},
                        function () {
                        },
                        false, false
                    )
                }
            });
            PostLoginService.postLoginActions();
            $location.path('/')
        }).error(function (data, status) {
            if (data.email_unconfirmed) {
                $scope.state = 'email_unconfirmed';
                $scope.email = data.email;
                username = data.username; // store username in a different var in case user edits it in the form
            } else {
                $scope.errors = data.errors
            }
        })
    }

    $scope.resend_email = function () {
        APIService.post('/auth/resend-email', {username: username}, function (data) {
            if (data.success) {
                $scope.state = 'resend_success'; // show success page
            } else {
                alert("Some error occurred")
            }
        })
    }
})

app.controller('SignupController', function ($scope, $location, APIService) {
    $scope.forms = {};  // container for signupForm
    $scope.signup = {};  // ng-model for the form
    $scope.register_success = false;
    $scope.state = 'step1';

    var handle_errors = function (data) {
        // loop over the errors returned by server and mark the corresponding fields as 'server'-invalid
        $scope.errors = data.errors; // make the errors available in scope so that they can be displayed
        console.log(data.errors);
        for (var field in data.errors) {
            if ($scope.forms.signupForm[field] != undefined) {
                console.log("setting invalid for", field, $scope.forms.signupForm[field], $scope.forms.signupForm)
                $scope.forms.signupForm[field].$setValidity('server', false)
            }
        }
    };

    $scope.step2 = function () {
        $scope.errors = {}; // reset errors
        var params = {
            'username': $scope.signup.username,
            'email': $scope.signup.email,
        };
        APIService.get('/auth/register/validate', params).success(function (data) {
            $scope.state = 'step2'
        }).error(handle_errors)
    };

    $scope.submitForm = function () {
        $scope.errors = {}  // reset errors
        var params = angular.copy($scope.signup)
        params['tz_offset'] = get_tz_offs()
        APIService.post('/auth/register', params).success(function (data) {
            $scope.state = 'register_success' // show success page
        }).error(handle_errors)
    };

    $scope.resend_email = function () {
        APIService.post('/auth/resend-email', {username: $scope.signup.username}, function (data) {
            if (data.success) {
                $scope.state = 'resend_success'  // show success page
            } else {
                alert("Some error occurred")
            }
        })
    }
});


app.controller('PasswordResetController', function ($scope, APIService) {
    $scope.forms = {};  // container for recoverForm
    $scope.recover = function () {
        $scope.errors = {};  // reset errors
        APIService.post('/auth/password-reset', {email: $scope.email}, function (data, status) {
            if (data.success) {
                $scope.email_sent = true
            } else {
                // loop over the errors returned by server and mark the corresponding fields as 'server'-invalid
                $scope.errors = data.errors; // make the errors available in scope so that they can be displayed
                console.log($scope.errors);
                for (var field in data.errors) {
                    if ($scope.forms.recoverForm[field] != undefined) {
                        console.log("setting invalid for", field)
                        $scope.forms.recoverForm[field].$setValidity('server', false)
                    }
                }
            }
        })
    }
});


app.controller('PasswordResetConfirmController', function ($scope, $routeParams, $location, APIService, AuthService, PostLoginService) {
    var uidb64 = $routeParams.uidb64,
        token = $routeParams.token;

    APIService.get('/auth/get-username', {uid: uidb64}, function (data, status) {
        if (data.success) {
            $scope.username = data.username
        }
    })

    $scope.change = function () {
        $scope.notMatch = $scope.new_password1 != $scope.new_password2 || !$scope.new_password1 || !$scope.new_password2;
        if (!$scope.notMatch) {
            var params = {
                new_password1: $scope.new_password1,
                new_password2: $scope.new_password2,
                uidb64: uidb64,
                token: token,
                tz_offset: get_tz_offs()
            }
            APIService.post('/auth/password-reset-confirm', params, function (data, status) {
                if (data.success) {
                    $scope.password_changed = true
                    var user = $user()
                    user.initFromData(data.user_data)
                    AuthService.login(user, data.sessionid)
                    PostLoginService.postLoginActions()
                } else if (data.link_expired) {
                    $scope.link_invalid = true
                }
            })
        }
    }
    $scope.$location = $location
});


app.controller('OAuthController', function ($scope, $location, AuthService, APIService, PostLoginService, OAuth) {
    $scope.oauth_login = function (provider) {
        OAuth.popup(provider).then(function (result) {
            console.log("check with backend...");
            var params = {
                token: OAuth.token,
                token_secret: OAuth.token_secret,
                tz_offset: get_tz_offs()
            };
            APIService.get('/auth/' + provider + '/check-user/' + OAuth.oaUser.id, params, function (data, status) {
                console.log(data);
                if (data.exists) { // log in the user
                    var user = $user();
                    user.initFromData(data.user_data);
                    AuthService.login(user, data.sessionid);
                    AuthService.isLogged().then(function (isLogged) {
                        if (isLogged && AuthService.user.status != 'online') {
                            APIService.put(
                                "/users/" + AuthService.user.user_id,
                                {status: "online"},
                                function () {
                                },
                                false, false
                            )
                        }
                    });
                    PostLoginService.postLoginActions();
                    $location.path('/');
                } else { // signup
                    $location.path('/oauth-signup');
                }
            })
        })
    }
})

app.controller('OAuthSignupController', function ($scope, $location, APIService, AuthService, PostLoginService, OAuth) {
    var titlecase = function (str) {
        return str[0].toUpperCase() + str.substr(1);
    }
    $scope.forms = {};  // form container
    $scope.username = '';
    $scope.password = '';
    $scope.password1 = '';
    $scope.provider = titlecase(OAuth.provider);
    var email = OAuth.oaUser.email;  // assuming email will always be present there
    if (OAuth.oaUser.alias) {
        $scope.username = OAuth.oaUser.alias
    } else {
        $scope.username = email.split('@')[0]
    }

    $scope.signup = function () {
        var params = {
            username: $scope.username,
            email: email,
            password: $scope.password,
            password1: $scope.password1,
            oauth_id: OAuth.oaUser.id,
            oauth_provider: OAuth.provider,
            oauth_token: OAuth.token,
            oauth_token_secret: OAuth.token_secret,
            tz_offset: get_tz_offs()
        }
        $scope.errors = {}  // reset errors
        APIService.post('/auth/register', params).success(function (data) {
            // auto-login the user
            var user = $user();
            user.initFromData(data.user_data);
            AuthService.login(user, data.sessionid);
            PostLoginService.postLoginActions();
            $location.path('/');
        }).error(function (data) {
            // loop over the errors returned by server and mark the corresponding fields as 'server'-invalid
            $scope.errors = data.errors;  // make the errors available in scope so that they can be displayed
            console.log(data.errors);
            for (var field in data.errors) {
                if ($scope.forms.signupForm[field] != undefined) {
                    console.log("setting invalid for", field, $scope.forms.signupForm[field], $scope.forms.signupForm);
                    $scope.forms.signupForm[field].$setValidity('server', false);
                }
            }
        })
    }
})

app.controller('LogoutController', function ($rootScope, $location, APIService) {
    APIService.get('/auth/logout', {}, function (data, status) {
        $rootScope.user = null;
        AuthService.clear()
    })
});

/**
 *   Auto-Login for chatters
 */



app.controller('ActivateController', function (isLogged, $scope, $rootScope, $routeParams, APIService, AuthService, PostLoginService) {
    // show error message in template if is logged
    if (isLogged) {
        $rootScope.page_title = 'Activation Error'
        return;
    }

    var confirmation_key = $routeParams.confirmation_key
    $scope.confirmation = {
        'status': true,
        'email': '',
    }
    APIService.get('/auth/activate', {
        confirmation_key: confirmation_key,
        tz_offset: get_tz_offs()
    }, function (data, status) {
        if (data.success) {
            $scope.confirmation.status = true
            $scope.confirmation.email = data.email
            // auto-login the user
            var user = $user()
            user.initFromData(data.user_data)
            AuthService.login(user, data.sessionid)
            PostLoginService.postLoginActions()
        } else {
            $scope.confirmation.status = false
        }
    })
});


app.controller('EmailConfirmController', function (isLogged, $scope, $routeParams, APIService, AuthService, PostLoginService) {
    var confirmation_key = $routeParams.confirmation_key;
    $scope.confirmation = {
        'status': true,
        'email': '',
        'result': ''
    };
    APIService.post('/auth/confirm-user-email', {
        confirmation_key: confirmation_key,
        tz_offset: get_tz_offs()
    }, function (data, status) {
        if (data.success) {
            $scope.confirmation.status = true;
            $scope.confirmation.email = data.email;
            $scope.confirmation.result = data.result;  // 'login', 'same_user', 'another_user'
            console.log($scope.confirmation);
            if (data.result == 'login') {
                // user was not logged in, and server logged in the user
                var user = $user();
                user.initFromData(data.user_data);
                AuthService.login(user, data.sessionid);
                PostLoginService.postLoginActions()
            }
        } else {
            $scope.confirmation.status = false
        }
    })
});