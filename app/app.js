urls = {
    questionsList: "/questions",
    questionsDetail: "/questions/:id",
    questionsSuggestEdit: "/questions/:id/suggest",
    answersList: "/questions/:id/answers",
    answersCommentCreate: "/questions/answers/:id/comments",
    likeComment: "/questions/answers/comments/:id/like",
    userTopicsList: "/users/:id/topics",
    userTopicsDetail: "/users/:id/topics/:user_topic_id",
    userCertifications: "/users/:id/certifications",
    recentUsersList: "/users/:id/recent",
    likeQuestion: "/questions/:id/like",
    reportQuestion: "/questions/:id/report",
    likeAnswer: "/questions/answers/:id/like",
    usersList: "/users",
    userDetails: "/users/:id",
    followUser: "/users/:id/follow",
    voteUser: "/users/:id/vote",
    freeUser: "/users/:id/free",
    userFollowers: "/users/:id/followers",
    userFollowing: "/users/:id/following",
    similarUsers: "/users/:id/similar",
    topicsList: "/topics",
    topicsDetail: "/topics/:id",
    topicFollowers: "/topics/:topicId/followers",
    reportReasons: "/report-reasons",
    questionSharingCreate: "/questions/:id/share",
    topicSharingCreate: "/topics/:id/share",
    citiesList: "/cities",
    countriesList: "/countries",
    userCertificationsDetail: "/users/:id/certifications/:cert_id",
    chatsList: "/chats/:user_id",
    chatsFavorite:"/chat/favorite",
    creditPackages:"/payments/credit-packages",
    messagesList: "/chat/messages?chat_id=:id",
    closeChat: "/chat/:chat_id/close",
    billingProfiles: "/payments/billing-profiles/:id",
    billingProfileDetail: "/payments/billing-profile/:profileId",
    buyPackage: "/payments/buy-credits",
    blockChat: "/chat/:other_user_id/block",
    unblockChat: "/chat/:other_user_id/unblock",
    msgCost: "/commissions/:id/message-cost",
    saveStripeCustomer:"/payment/stripe/save-customer",
    userChangePassword:"/settings/change-password",
    userChangeEmail:"/settings/change-email",
    userSetTimeSettings:"/settings/set-time-settings",
    earningsUserSummary:"/earnings/:user_id/summary",
    transactionsUserSummary:"/transactions/:user_id/summary",
    createWithdrawal: "/payments/withdraw",
    usersNotifications:"/users/notifications",
    usersNotificationsDetail:"/users/notifications/:id"
};

var geolocationUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=:address&key=:key";
var googleMapApiKey = "AIzaSyAaU6AiuKnZQELqNyYFxaY4d9i_SdKKp-4";


if (debug) {
    var config = {
        baseURL: 'http://localhost:8000',
        socketURL: 'http://localhost:6332'
    };
} else {
    var config = {
        baseURL: 'http://dev.co:6200',
        socketURL: 'http://dev.co:6332'
    };
}


var app =

    // Configure glosk app and include the ng-upload module
    angular.module('app', [
        'configuration',
        'ngRoute',
        'oi.file',
        'ngSanitize',  //are we using it?
        //'ngUpload',
        'chatuserFilters',
        'genericFilters',
        'oauth.io',
        'ui.bootstrap',
        'contenteditable',
        'ngTagsInput',
        'ngClipboard',
        'ngAnimate',
        'dibari.angular-ellipsis',
        'uiGmapgoogle-maps',
        'lastSeenFilters',
        'profileFilters',
        'btford.socket-io',
        'infinite-scroll',
        'angular-stripe',
        'chatFilters'
    ])

        // configure the http intercetor. It's used for the moment to show the loading icon for all ajax requests
        .config(function ($httpProvider, $locationProvider) {
            $httpProvider.interceptors.push('HTTPInterceptorService');

            // use the HTML5 History API
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });
            $locationProvider.hashPrefix('!');

            // don't send cookies
            $httpProvider.defaults.withCredentials = false;

            // csrf
            $httpProvider.defaults.xsrfCookieName = 'csrftoken';
            $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

            $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
            $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

        })
        .config(function (OAuthProvider, OAUTH_IO_KEY) {
            OAuthProvider.setPublicKey(OAUTH_IO_KEY);  // where instead of ABC you put your key
        })
        .config(function (uiGmapGoogleMapApiProvider) {
            uiGmapGoogleMapApiProvider.configure({
                key: googleMapApiKey,
                v: '3.20', //defaults to latest 3.X anyhow
                libraries: 'weather,geometry,visualization'
            });
        })
        .config(function (stripeProvider) {
            stripeProvider.setPublishableKey('pk_test_no6Yq12HdVRxVwDYAkNxdTps');
        })
        .run(function ($rootScope, $window, $location, $route, $http, $timeout, AuthService, AppLogger, SettingsService, PostLoginService) {
            // FastClick.attach(document.body);

            $rootScope.log = AppLogger.log;
            $rootScope.location = $location;
            $rootScope.$window = $window;

            // store previous url
            $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                $rootScope.previousRoute = oldUrl.split('#!')[1]
            });

            // we need to check each Controller is it requires authentication. there is no angular.js built in functionality so that we made our own
            $rootScope.$on("$routeChangeStart", function (event, next, current) {
                $rootScope.showLoader = true;
            });

            // set page title <title></title>
            $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
                $rootScope.showLoader = false;
                if (current.$$route && current.$$route.page_title)
                    $rootScope.page_title = current.$$route.page_title;
            });

            // add windowWidth to rootScope
            $rootScope.windowWidth = $window.innerWidth;
            $rootScope.windowHeight = $window.innerHeight;
            angular.element($window).bind('resize', function () {
                $rootScope.windowWidth = $window.innerWidth;
                $rootScope.windowHeight = $window.innerHeight;
                $rootScope.$apply('windowWidth');
                $rootScope.$apply('windowHeight');
            });

            angular.element($window).bind('scroll', function () {

            });

        })
        .factory('chatSocket', function (socketFactory) {
            var chatSocket = socketFactory({
                prefix: 'chat:',
                ioSocket: io.connect(config.socketURL + '/chat')
            });
            chatSocket.forward('is_typing');
            chatSocket.forward('msg_to_room');
            chatSocket.forward('chat_loaded');
            chatSocket.forward('update_messages');
            chatSocket.forward('all_is_read');
            return chatSocket;
        }).
        config(['$compileProvider', function ($compileProvider) {
            var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
        }]);


var LoginRequired = {
    // redirect to /login if user not logged in
    requireAuth: function (AuthService, $q, $location) {
        var d = $q.defer();
        AuthService.initialized.promise.then(function () {
            if (AuthService.user) {
                console.log("AUTH OK", AuthService.user);

                if (AuthService.user.is_suspended == true){
                    $location.path('/suspended');
                }

                if (AuthService.user.is_deactivated == true){
                    $location.path('/deactivated');
                }
                d.resolve();
            } else {
                console.log("NO AUTH", AuthService.user);
                $location.path('/login');
                d.reject();
            }
        });
        return d.promise
    }
};

var GuestOnly = {
    // don't go to controller unless user is not logged in
    isLogged: function (AuthService, $location, $q) {
        return AuthService.isLogged().then(function (isLogged) {
            if (isLogged) {
                $location.path('/');
                return $q.reject()
            }
            return $q.when()
        })
    }
};


app.config(function ($routeProvider) {
    $routeProvider
        .when('/login',
        {
            templateUrl: '/app/partials/auth/login.html',
            controller: 'LoginController',
            resolve: GuestOnly
        })
        .when('/signup',
        {
            templateUrl: '/app/partials/auth/register.html',
            controller: 'SignupController',
            page_title: 'Signup - Txtprt',
            resolve: GuestOnly
        })
        .when('/logout',
        {
            templateUrl: '/app/partials/auth/logged_out.html',
            controller: 'LogoutController',
            page_title: 'Logout',
            resolve: LoginRequired
        })
        .when('/oauth-signup',
        {
            controller: 'OAuthSignupController',
            templateUrl: '/app/partials/auth/oauth-signup.html',
            page_title: 'Signup - Txtprt',
            resolve: {
                // ensure we are oauth.logged, and also guest (not auth.logged)
                OAuthLogged: function (OAuth, $q, $location) {
                    if (!OAuth.logged) {
                        $location.path('/login')
                        return $q.reject()
                    }
                    return $q.when()
                },
                isLogged: GuestOnly.isLogged
            }
        })
        .when('/password-reset',
        {
            controller: 'PasswordResetController',
            templateUrl: '/app/partials/auth/password-reset.html',
            page_title: 'Password reset',
            resolve: GuestOnly
        })
        .when('/auth/password-reset-confirm/:uidb64/:token',
        {
            controller: 'PasswordResetConfirmController',
            templateUrl: '/app/partials/auth/password-reset-confirm.html',
            page_title: 'Password reset confirm',
        })
        .when('/activate/:confirmation_key',
        {
            controller: 'ActivateController',
            templateUrl: '/app/partials/auth/activation.html',
            page_title: 'Account Activation',
            resolve: {
                isLogged: function (AuthService) {
                    return AuthService.isLogged()
                }
            }
        })
        .when('/email-confirm/:confirmation_key',
        {
            controller: 'EmailConfirmController',
            templateUrl: '/app/partials/auth/email-confirm.html',
            page_title: 'Email confirmation',
            resolve: {
                isLogged: function (AuthService) {
                    return AuthService.isLogged()
                }
            }
        })
        .when('/',
        {
            controller: 'ExploreController',
            templateUrl: '/app/partials/default/explore-new.html',
            page_title: 'Explore',
            resolve: LoginRequired
        })
        .when('/questions/:filter/topic/:id',
        {
            controller: 'ExploreController',
            templateUrl: '/app/partials/default/explore-new.html',
            page_title: 'Explore',
            resolve: LoginRequired
        })
        .when('/people',
        {
            controller: 'PeopleController',
            templateUrl: '/app/partials/default/people.html',
            page_title: 'People',
            resolve: LoginRequired
        })
        .when('/people/topic/:id',
        {
            controller: 'PeopleController',
            templateUrl: '/app/partials/default/people.html',
            page_title: 'People',
            resolve: LoginRequired
        })
        .when('/people/morelike/:userId',
        {
            controller: 'PeopleController',
            templateUrl: '/app/partials/default/more-like.html',
            page_title: 'More Like',
            resolve: LoginRequired
        })
        .when('/contacts',
        {
            controller: 'ContactsController',
            templateUrl: '/app/partials/default/contacts.html',
            page_title: 'Contacts',
            resolve: LoginRequired
        })
        .when('/topics',
        {
            controller: 'TopicsController',
            templateUrl: '/app/partials/default/topics.html',
            page_title: 'Topics',
            resolve: LoginRequired
        })
        .when('/topic/:id',
        {
            controller: 'TopicDetailController',
            templateUrl: '/app/partials/default/topic-details.html',
            page_title: 'Topic',
            resolve: LoginRequired
        })
        .when('/question/ask',
        {
            controller: 'AskQuestionController',
            templateUrl: '/app/partials/default/ask-question.html',
            page_title: 'Ask a question',
            resolve: LoginRequired
        })
        .when('/question/ask/topic/:id',
        {
            controller: 'AskQuestionController',
            templateUrl: '/app/partials/default/ask-question.html',
            page_title: 'Ask a question',
            resolve: LoginRequired
        })
        .when('/question/:id',
        {
            controller: 'QuestionDetailController',
            templateUrl: '/app/partials/default/question-detail.html',
            page_title: 'Question',
            resolve: LoginRequired
        })
        .when('/question/:id/edit',
        {
            controller: 'SuggestEditController',
            templateUrl: '/app/partials/default/suggest-edit.html',
            page_title: 'Suggest edit',
            resolve: LoginRequired
        })
        .when('/profile/edit',
        {
            controller: 'EditProfileController',
            templateUrl: '/app/partials/default/profile-edit.html',
            page_title: 'Profile',
            resolve: LoginRequired
        })
        .when('/profile/certification',
        {
            controller: 'CertificationController',
            templateUrl: '/app/partials/default/certification.html',
            page_title: 'Certification',
            resolve: LoginRequired
        })
        .when('/profile/certification/:id/resubmit',
        {
            controller: 'CertificationController',
            templateUrl: '/app/partials/default/certification.html',
            page_title: 'Certification',
            resolve: LoginRequired
        })
        .when('/profile/:id',
        {
            controller: 'ProfileController',
            templateUrl: '/app/partials/default/profile.html',
            page_title: 'Profile',
            resolve: LoginRequired
        })
        .when('/profile/followers/:id',
        {
            controller: 'ProfileFollowersController',
            templateUrl: '/app/partials/default/profile-followers.html',
            page_title: 'Profile followers',
            resolve: LoginRequired
        })
        .when('/profile/following/:id',
        {
            controller: 'ProfileFollowingController',
            templateUrl: '/app/partials/default/profile-following.html',
            page_title: 'Profile following',
            resolve: LoginRequired
        })
        .when('/conversations',
        {
            controller: 'ConversationsController',
            templateUrl: '/app/partials/default/conversations.html',
            page_title: 'Conversations',
            resolve: LoginRequired
        })
        .when('/chat-settings',
        {
            controller: 'ChatSettingsController',
            templateUrl: '/app/partials/default/chat-settings.html',
            page_title: 'Chat settings',
            resolve: LoginRequired
        })
        .when('/chat/:id',
        {
            controller: 'ChatController',
            templateUrl: '/app/partials/default/chat.html',
            page_title: 'Chat',
            resolve: LoginRequired
        })
        .when('/conversations/favorites',
        {
            controller: 'ConversationsFavoritesController',
            templateUrl: '/app/partials/default/conversations-favorites.html',
            page_title: 'Conversations Favorites',
            resolve: LoginRequired
        })
        .when('/credit-packages',
        {
            controller: 'CreditPackagesController',
            templateUrl: '/app/partials/default/choose-package.html',
            page_title: 'Choose package',
            resolve: LoginRequired
        })
        .when('/payment-settings',
        {
            controller: 'PaymentSettingsController',
            templateUrl: '/app/partials/default/payment-methods.html',
            page_title: 'PaymentMethods',
            resolve: LoginRequired
        })
        .when('/withdrawals',
        {
            controller: 'WithdrawalsController',
            templateUrl: '/app/partials/default/withdrawals.html',
            page_title: 'Withdrawals',
            resolve: LoginRequired
        })
        .when('/withdrawals-history',
        {
            controller: 'WithdrawalsHistoryController',
            templateUrl: '/app/partials/default/withdrawals-history.html',
            page_title: 'Withdrawals History',
            resolve: LoginRequired
        })
        .when('/general-settings',
        {
            controller: 'GeneralSettingsController',
            templateUrl: '/app/partials/default/general-settings.html',
            page_title: 'General Settings',
            resolve: LoginRequired
        })
        .when('/statements-earnings',
        {
            controller: 'StatementEarningsController',
            templateUrl: '/app/partials/default/statements-earnings.html',
            page_title: 'Statement Earnings',
            resolve: LoginRequired
        })
        .when('/statements-transactions',
        {
            controller: 'StatementTransactionsController',
            templateUrl: '/app/partials/default/statements-transactions.html',
            page_title: 'Statement Transactions',
            resolve: LoginRequired
        })
        .when('/privacy-policy',
        {
            controller: 'PrivacyPolicyController',
            templateUrl: '/app/partials/default/privacy.html',
            page_title: 'Privacy Policy ',
            resolve: LoginRequired
        })
        .when('/sitemap',
        {
            controller: 'SitemapController',
            templateUrl: '/app/partials/default/sitemap.html',
            page_title: 'Sitemap',
            resolve: LoginRequired
        })
        .when('/user-not-found',
        {
            controller: 'SitemapController',
            templateUrl: '/app/partials/default/user-not-found.html',
            page_title: 'User Not Found',
            resolve: LoginRequired
        })
        .when('/notifications',
        {
            controller: 'NotificationsController',
            templateUrl: '/app/partials/default/notifications.html',
            page_title: 'Notifications',
            resolve: LoginRequired
        })
        .when('/about',
        {
            controller: 'AboutController',
            templateUrl: '/app/partials/default/about.html',
            page_title: 'About'
        })
        .when('/terms-and-conditions',
        {
            controller: 'AboutController',
            templateUrl: '/app/partials/default/terms.html',
            page_title: 'Terms'
        })
        .when('/suspended',
        {
            controller: 'AboutController',
            templateUrl: '/app/partials/default/account-suspended.html',
            page_title: 'Account Suspended'
        })
        .when('/deactivated',
        {
            controller: 'AboutController',
            templateUrl: '/app/partials/default/account-deactivated.html',
            page_title: 'Account Deactivated'
        })
        .otherwise({redirectTo: '/'});
});

