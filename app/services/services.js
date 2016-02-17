/**
 *  Used to detect the current device. While developing, we need a way to test it with cookie based rules. Check http://dev.glosk.com/index.php code
 */
app.factory('DeviceDetectorService', [function() {
    var sdo = {
        Android: function(){
            return /Android/i.test(navigator.userAgent);
        },
        BlackBerry: function(){
            return /BlackBerry/i.test(navigator.userAgent);
        },
        iOS: function(){
            return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        },
        Windows: function(){
            return /IEMobile/i.test(navigator.userAgent);
        },
        any: function(){
            return (sdo.Android() || sdo.BlackBerry() || sdo.iOS() || sdo.Windows());
        },

    };
    return sdo;
}]);

/**
 *  The NoticeService is used to append errors and success messages in the view. The notice controller uses this service and is included on demand or in the main layout.
 */
app.factory('NoticeService', [ function() {

    var messages =  {
        errors: [],
        success: [],

        clear:function(){
            this.errors= []
            this.success= []
        }
    }

    var srv = {
        messages: messages,
        addError:function(error) {
            this.clear()
            this.messages.errors.push(error)
        },

        addSuccess:function(message) {
            this.clear()
            this.messages.success.push(message)
        },
        clear:function() {
            this.messages.clear()
        }
    };

    return srv;
}]);

/**
 * Used to fetch lists or users from the backend
 */
app.factory('UserListService', ['$http', 'APIService', 'AuthService', function($http, APIService, AuthService) {
    var list = {
        initialized: false,
        busy: false,
        page: 0,
        count: 0,
        has_next: true,
        items: [],
        opts: {},
        profileUrl: function(u) {
            if( u.user_id == AuthService.user.user_id)
                return '/edit-profile'
            return '/u/' + u.username
        },
        get: function (username){
            for(var i in list.items) {
                var u = list.items[i]
                if (u.username == username) {
                    return u
                }
            }
            console.log("not found")
            return null
        },
        clear: function () {
            list.items = []
            list.page = 0;
            list.count = undefined;
            list.has_next = true;
            list.initialized = false;
        },
        fillFromServer: function(opts) {
            list.opts = opts || {}
            list.clear()
            return APIService.get('/profiles/users-list', list.opts, function(data, status) {
                for (var i in data.users) {
                    var user = $user()
                    user.initFromData(data.users[i])
                    list.items.push(user)
                }
                list.page = 1
                if(!data.has_next)
                    list.has_next = false
                list.count = data.count
                list.initialized = true
                console.log("Userlist Filled", list.page, list.has_next)
            });
        },
        nextPage: function() {
            console.log("NEXT PAGE", list.page, list.has_next, list.busy)
            if( !list.has_next || list.busy || !list.initialized)
                return;
            list.busy = true
            list.page += 1
            var opts = angular.copy(list.opts)
            opts.page = list.page
            APIService.get('/profiles/users-list', opts, function(data, status) {
                for (var i in data.users) {
                    var user = $user()
                    user.initFromData(data.users[i])
                    list.items.push(user)
                    //console.log(user)
                }
                if(!data.has_next)
                    list.has_next = false
                list.count = data.count
                list.busy = false
            })
        }
    }
    return list;
}]);


/**
 * Used to fetch information about users
 */
app.factory('UserService', ['$q', 'UserListService', 'APIService', function($q, UserListService, APIService) {
    var service = {
        getUserByUsername: function(username, full) {
            var d = $q.defer();
            var params = {username: username}
            if (full) {
                params.full = true
            }
            APIService.get('/profiles/user-profile', params, function(data, status) {
                var user = $user()
                user.initFromData(data.user_data)
                console.log("Get by username returning" , user)
                d.resolve(user)
            })
            return d.promise;
        },
        getUserById: function(user_id, full) {
            var d = $q.defer();
            var params = {user_id: user_id}
            if (full) {
                params.full = true
            }
            APIService.get('/profiles/user-profile', params, function(data, status) {
                var user = $user()
                user.initFromData(data.user_data)
                console.log("Get by id returning" , user)
                d.resolve(user)
            })
            return d.promise;
        }
    }
    return service
}]);


/**
 * Used for debugging purposes. In conjunction with DebuggerController could provide visual traces. alternative to debug toolbar
 */
app.factory('AppLogger', [function() {
    var links = {
        onMessage: function(message){},
        list: [],
        log: function(){return links.list},
        error : function(message){
            links.list.push(message)
            links.onMessage("Error:: " + message)
        },
        debug : function(message){
            links.list.push(message)
            links.onMessage("Debug:: " + message)
        }
    }
    return links;
}]);



app.factory('UploadService', ['$q', 'APIService', 'AuthService', 'SettingsService', 'NoticeService', function($q, APIService, AuthService, SettingsService, NoticeService) {
    var service = {
        uploading: false,
        progress: 0,
        progress_multi: {},
        uploading_multi: {},
        is_image: true,
        callbacks: {},
        registerCallback: function(upload_id, callback) {
            service.callbacks[upload_id] = callback
        },
        clearCallbacks: function() {
            service.callbacks = {}
        },
        upload: function(fileInput, options) {
            // returns a promise
            var d = $q.defer()

            var formData = new FormData();
            if (options.inputname) { // multi upload
                formData.append(options.inputname, fileInput);
            } else{ // single upload
                formData.append(fileInput.name, fileInput.files[0]);
            }


            // create xhr
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", function(e) {
                console.log("Upload complete!", xhr.status)
                var data = $.parseJSON(xhr.responseText)
                if (xhr.status != 200 || !data.success ) {
                    console.log("error", status, data.success)
                    NoticeService.addError("Failed to upload")
                    d.reject()
                } else {
                    console.log("Success - updating scope")
                    d.resolve(data)
                }
            }, false);

            options = options || {};
            if(!options.data) options.data = {};

            upload_url = SettingsService.api + options.url + '?sessionid=' + AuthService.token +'&'+ $.param(options.data);

            var onprogress = function(e) {
                var percentage = (e.loaded / e.total) * 100;
                console.log(percentage)
                if(options.upload_id) {
                    service.progress_multi[options.upload_id] = percentage
                } else {
                    service.progress = percentage
                }
                options.scope.safeApply();
            }

            xhr.upload.onprogress = onprogress

            xhr.open("POST", upload_url);
            xhr.send(formData);
            return d.promise
        },

        upload_with_progress: function(fileInput, callback, options, callbackError) {
            service.progress = 0;
            var g_progress_intv;
            var progress_id = Math.random()
            options = options || {};
            if(!options.data)
                options.data = {};
            options.data['X-Progress-ID'] = progress_id;
            if(options.upload_id) {
                service.uploading_multi[options.upload_id] = true;
            } else {
                service.uploading = true;
            }

            service.upload(fileInput, options).then(function(data) {
                if(options.upload_id){
                    service.progress_multi[options.upload_id] = 0
                } else {
                    service.progress = 0
                }
                clearInterval(g_progress_intv);
                if(options.upload_id) {
                    service.uploading_multi[options.upload_id] = false;
                } else {
                    service.uploading = false;
                }
                callback(data, options);
                // call registered callback
                if (service.callbacks[options.upload_id] ) {
                    service.callbacks[options.upload_id]()
                }
            }, function() { // error
                service.is_image = false
                var errorList = {
                    'is_image': service.is_image
                }
                callbackError(options, errorList);
                clearInterval(g_progress_intv);
                if(options.upload_id) {
                    service.uploading_multi[options.upload_id] = false;
                } else {
                    service.uploading = false;
                }
            });
        }
    }
    return service;
}]);


app.factory('SearchService', [function() {
    // stores the state of the Search view, so that you can go back to it without refreshing anything
    var service = {
        initialized: false,
        searchForm: {},
        page_title: 'Search',
        show_form: false,
        search_applied: false,
        filterOption: 'online_only',
        scrollY: 0,
        get_distance: function() {
            // returns distance in miles
            if(!service.searchForm.distance)
                return '';
            if(service.searchForm.distance == 1)
                return 10;
            if(service.searchForm.distance == 2)
                return 25;
            if(service.searchForm.distance == 3)
                return 50;
            if(service.searchForm.distance == 4)
                return 100;
        },
        reset: function() {
            service.initialized = false
            service.scrollY = 0
            service.searchForm = {
                gender: '',
                seeking_tags: [],
                offering_tags: [],
                q: '',
                has_photo: '',
                online_only: '',
                order: '',
                city: '',
                country: '',
                distance: '',
                category: '',
                age_from: '',
                age_to: ''
            }
            service.search_applied = false
            service.page_title = 'Search'
        }
    }
    return service;
}]);


app.factory('TagService', function(APIService) {
    var user; // private variable
    var self = {
        popularTags: [],
        seeking_tag_form: {},
        offering_tag_form: {},

        init: function(u) {
            user = u;
            self.reset_tag_form()
            APIService.get('/account/get-popular-tags', {}, function(data, status) {
                self.popularTags = data.popular_tags
            })
        },

        reset_tag_form: function() {
            self.seeking_tag_form = {}
            for (var i=1;i<=3;i++) {
                var key = 'tag'+i
                if( i <= user.seeking_tags.length )
                    self.seeking_tag_form[key] = user.seeking_tags[i-1]
                else
                    self.seeking_tag_form[key] = ''
            }
            self.offering_tag_form = {}
            for (var i=1;i<=3;i++) {
                var key = 'tag'+i
                if( i <= user.offering_tags.length )
                    self.offering_tag_form[key] = user.offering_tags[i-1]
                else
                    self.offering_tag_form[key] = ''
            }
        },

        pickTag: function(type, tag) {
            var tag_form = (type == 'seeking' ? self.seeking_tag_form : self.offering_tag_form)
            for (var i=1;i<=3;i++) {
                var key = 'tag'+i
                if(typeof(tag_form[key]) == 'undefined' || !tag_form[key].length){
                    for (var name in tag_form) {
                         if (tag_form[name] == tag)
                            return;
                    }
                    tag_form[key] = tag;
                    console.log(tag_form)
                    return;
                }
            }
        }
    }

    return self;
})

/**
 * Url Shortener (AngularJS service using Google UrlShortener API)
 */

app.factory('UrlShortenerService', function($q, $rootScope, $http) {
    return {
        shorten: function(url) {
            var def = $q.defer();
            $http({
                method: 'POST',
                url: 'https://www.googleapis.com/urlshortener/v1/url',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    longUrl: url
                }),
            }).success(function(data) {
                def.resolve(data);
            }).error(function() {
                def.reject('Failed to get url');
            });
            return def.promise;
        }
    }
});
