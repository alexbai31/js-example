/*#######################################################################

 Dan Wahlin
 http://twitter.com/DanWahlin
 http://weblogs.asp.net/dwahlin
 http://pluralsight.com/training/Authors/Details/dan-wahlin

 Normally like the break AngularJS controllers into separate files.
 Kept them together here since they're small and it's easier to look through them.
 example.

 #######################################################################*/

var scrollToBottom = function (instant) {
    var doScroll = function () {
        el = document.getElementById("content-inner");
        el.scrollTop = el.scrollHeight;
    };
    if (instant)
        setTimeout(doScroll, 50);
    else
        setTimeout(doScroll, 500);
};


/**
 * Holds additional master scope code
 */
app.controller('MasterController', function ($scope, $rootScope, $timeout, $location, $window, AuthService, $interval, APIService) {
    $scope.auth = AuthService;

    $scope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $rootScope.intervals = [];

    $scope.$on("$routeChangeStart", function (ev, next, current) {
        for (var i in $rootScope.intervals) {
            $interval.cancel($rootScope.intervals[i]);
        }
    });


    var is_desktop = function () {
        return ($scope.windowWidth >= 1024)
    };
    var is_tablet = function () {
        return ($scope.windowWidth < 1024) && ($scope.windowWidth >= 768)
    };
    var is_mobile = function () {
        return ($scope.windowWidth < 768)
    };
    $scope.is_desktop = is_desktop;
    $scope.is_tablet = is_tablet;
    $scope.is_mobile = is_mobile;

    $scope.reloadPage = function () {
        $rootScope.loaderError = false;
        document.location.reload(true)
    };

    // check current route properties to update heights
    $rootScope.baseURL = config.baseURL;


    $scope.current_year = new Date().getFullYear();

    $rootScope.readEvent = function (notification) {
        APIService.put(urls.usersNotificationsDetail.replace(":id", notification.id), {read: true}, function (data, status) {
            console.log(notification.id + " read;");
            var index = $rootScope.eventsList.indexOf(notification);
            if (index > -1) {
                $scope.eventsList.splice(index, 1)
            }
            $scope.eventsCount -= 1;
        });
    };

    $rootScope.checkNotifications = function () {
        APIService.get(urls.usersNotifications, {read: false}, function (data, status) {
            $rootScope.eventsCount = data.total;
            $rootScope.eventsList = data.notifications;
        }, false)
    };

});


/**
 * Used for the success/error messages.
 */
app.controller('NoticeController', function ($scope, NoticeService) {
    $scope.messages = NoticeService.messages;
    $scope.$on("$routeChangeStart", function (event, next, current) {
        if (current == undefined) return;
        NoticeService.clear()
    });
});

app.controller('ToolsController', function ($scope, AuthService) {
    if (AuthService.user != null) {
        $scope.credits = AuthService.user.available_credit
    } else {
        $scope.credits = 0;
    }
});

app.controller('ExploreNavController', function ($scope, $location) {

    if ($location.path() == "/") {
        $scope.feedActive = true;
    }

    if ($location.path() == "/people") {
        $scope.peopleActive = true;
    }

    if ($location.path() == "/topics") {
        $scope.topicsActive = true;
    }

});

app.controller('PrivacyPolicyController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {

});

app.controller('SitemapController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {

    $scope.currentUser = AuthService.user.user_id

});

app.controller('TermsConditionsController', function ($scope) {

});


app.controller("HeaderController", function ($scope, $rootScope, $location) {

    $scope.queryString = "";

    $scope.goToSearch = function () {
        $rootScope.queryString = $scope.queryString;
        $location.path("/search");
    }

});

app.controller('AboutController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {

});