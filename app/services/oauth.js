/**
 *  Provider/Service to work with Oauth.io
 */
angular.module('oauth.io', []).provider('OAuth', function () {
    this.publicKey = '';
    this.handlers = {};
    this.setPublicKey = function (key) {
        this.publicKey = key;
    };
    var provider = this;

    this.$get = ['$q', '$window', '$injector', function ($q, $window, $injector) {
        var service = {
            logged: false,
            provider: '',
            token: '',
            token_secret: '',
            oaUser: null,
            popup: function (method) {
                var d = $q.defer()
                var options = {
                    authorize:{display:"popup"}
                }
                console.log("calling popup", method)
                $window.OAuth.popup(method, options, function (error, result) {
                    console.log("popup callback", error, result)
                    if (!error) {
                        console.log("oauth login success")
                        service.logged = true
                        service.provider = method
                        if (method == 'yahoo') {
                            // for yahoo .me() is not implemented on oauth.io
                            service.token = result.oauth_token
                            service.token_secret = result.oauth_token_secret
                            console.log("requesting")
                            result.get('https://social.yahooapis.com/v1/me/guid?format=json').done(function(resp) {
                                var guid = resp.guid.value
                                result.get('https://social.yahooapis.com/v1/user/' + guid + '/profile?format=json').done(function(resp1) {
                                    console.log("Raw user data:", resp1)
                                    service.oaUser = {'id': guid}
                                    if( resp1.profile.emails.length )
                                        service.oaUser.email = resp1.profile.emails[0].handle
                                    if( resp1.profile.gender )
                                        service.oaUser.gender = (resp1.profile.gender == 'M') ? 0 : 1
                                    return d.resolve(service.oaUser)
                                })
                            })
                        } else {
                            if (method == 'twitter') {
                                service.token = result.oauth_token
                                service.token_secret = result.oauth_token_secret
                            } else if (method == 'facebook') {
                                service.token = result.access_token
                            } else if (method == 'google') {
                                service.token = result.access_token
                                service.token_secret = result.id_token
                            }
                            result.me().done(function(data) {
                                // request user info
                                console.log("ME", data)
                                service.oaUser = data
                                service.oaUser.id = data.raw.id
                                return d.resolve(service.oaUser)
                            })
                        }
                    } else {
                        console.log("rejected!")
                        d.reject()
                    }
                });
                return d.promise
            }
        }
        $window.OAuth.initialize(provider.publicKey);
        return service;
    }];

});