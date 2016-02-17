app.controller("ExploreController", function ($scope, APIService, $q, AuthService, $rootScope, $timeout, $routeParams) {

    $scope.answerForm = [];
    $scope.answers = [];
    $scope.lastAnswer = [];
    $scope.answerFormOpen = [];
    $scope.myTopics = [];
    $scope.answersLoaded = [];

    $scope.encodedBaseURL = encodeURIComponent($rootScope.baseURL);

    $scope.currentQuestionFilter = "All questions";
    $scope.currentTopicsFilter = "All topics";
    $scope.currentPeopleFilter = "Everyone";

    $scope.reportForm = {};
    $scope.reportingQuestion = 0;

    $scope.reportReasons = [];


    $scope.fullDetails = [];

    $scope.filters = {};

    APIService.get(urls.reportReasons, {}, function (data, status) {
        if (status == 200) {
            $scope.reportReasons = data.objects;
        }
    });

    $scope.setCaret = function (question) {
        var el = document.getElementById("content-" + question.id);
        $timeout(function () {
            console.log("Focused");
            el.focus();
        }, 20, false);
    };


    $scope.file = {};
    $scope.uploadResult = {};
    $scope.options = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                $scope.uploadResult.url = data.data.tmp_media.file;
                $scope.uploadResult.previewReady = true;
            });
        }
    };

    if ($routeParams.filter == "open") {
        $scope.filters.has_answers = false;
        $scope.currentQuestionFilter = "Open questions";
    }

    if ($routeParams.filter == "top") {
        $scope.currentQuestionFilter = "Top stories";
        $scope.filters.order_by = 'V';
    }

    if (typeof $routeParams.id != "undefined") {
        $scope.filters.topics = "[" + $routeParams.id + "]";
    }

    $scope.updateTopicsFilter = function (text) {
        $scope.currentTopicsFilter = text;
    };

    $scope.setFilter = function (filter) {
        for (var key in filter) {
            $scope.filters[key] = filter[key];
        }
    };

    $scope.deleteFilter = function (name) {
        delete $scope.filters[name];
    };

    $scope.likeQuestion = function (question) {
        var like = 1;
        APIService.post(urls.likeQuestion.replace(":id", question.id), {like: like}, function (data, status) {
            if (status == 200) {
                question.is_liked_by_me = true;
                question.is_disliked_by_me = false;
                question.likes_count = data.likes;
                question.dislikes_count = data.dislikes;
            }
        });
    };

    $scope.dislikeQuestion = function (question) {
        var like = -1;
        APIService.post(urls.likeQuestion.replace(":id", question.id), {like: like}, function (data, status) {
            if (status == 200) {
                question.is_liked_by_me = false;
                question.is_disliked_by_me = true;
                question.likes_count = data.likes;
                question.dislikes_count = data.dislikes;
            }
        });
    };

    $scope.refreshQuestions = function () {
        APIService.get(urls.questionsList, $scope.filters, function (data, status) {
            $scope.questions = data;
            for (var i in data.items) {
                $scope.fullDetails[data.items[i].id] = !(data.items[i].details.length > 300);
            }
        });
    };

    $scope.reportPrepare = function (question) {
        $scope.reportingQuestion = question.id;
    };

    $scope.reportQuestion = function () {
        var questionID = $scope.reportingQuestion,
            reason = $scope.reportForm.reportReason;
        APIService.post(urls.reportQuestion.replace(":id", questionID), {reason: reason}, function (data, status) {
            if (data.success) {
                $("#reportModal").modal('hide');
                $scope.refreshQuestions({});
            }
        });
    };

    $scope.refreshTopics = function () {

        APIService.get(urls.userTopicsList.replace(':id', AuthService.user.user_id), {}, function (data, status) {
            readyData = [];
            angular.forEach(data['interests'], function (value, key) {
                readyData.push(value.id);
            });
            $scope.myTopics = JSON.stringify(readyData);
        });

    };

    $scope.getAnswers = function (id) {
        var deffered = $q.defer();

        APIService.get(urls.answersList.replace(":id", id), {order_by: "D"}, function (data, status) {
            deffered.resolve(data);
        });

        return deffered.promise
    };

    $scope.createAnswer = function (question) {
        APIService.post(urls.answersList.replace(":id", question.id), {answer: $scope.answerForm[question.id].answerBody}, function (data, status) {
            $scope.answerFormOpen[question.id] = false;
            $scope.answerForm[question.id].answerBody = "";
            question.has_answers = true;
            question.answered_by_user = true;
            question.answer_count += 1;
            question.last_answered_by = AuthService.user;
            question.last_answered_date = new Date();
        });
    };

    $scope.increaseSharings = function ($clickEvent, question, provider) {
        $clickEvent.preventDefault();
        APIService.post(urls.questionSharingCreate.replace(":id", question.id), {provider: provider}, function (data, status) {
            if (data.success) {
                console.log($clickEvent);
                question.sharings = question.sharings + 1;
                window.location = $clickEvent.target.href;
            }
        })
    };

    $scope.showTail = function (question) {
        $('.tail-' + question.id).fadeToggle();
        $('.question-image-' + question.id).fadeToggle(100);
        $scope.fullDetails[question.id] = !$scope.fullDetails[question.id];
    };

    $scope.refreshQuestions({});
    $scope.refreshTopics({});


});


app.controller("PeopleController", function ($scope, APIService, AuthService, $routeParams, $rootScope) {

    $scope.users = [];
    $scope.filters = {};

    $scope.currentGenderFilter = 'Any gender';
    $scope.currentOnlineFilter = 'Online status';
    $scope.currentHasPhotoFilter = 'Avatar status';

    $scope.currentPage = 0;
    $scope.numPages = 1;

    $scope.loadUsers = function () {
        if (typeof $routeParams.userId == "undefined") {
            APIService.get(urls.usersList, $scope.filters, function (data, status) {
                $scope.numPages = data.num_pages;
                for (var i in data.items) {
                    $scope.users.push(data.items[i]);
                }
            }, true, true);
        } else {
            APIService.get(urls.similarUsers.replace(":id", $routeParams.userId), $scope.filters, function (data, status) {
                $scope.numPages = data.num_pages;
                for (var i in data.users) {
                    $scope.users.push(data.users[i]);
                }
            }, true, true);
            APIService.get(urls.userDetails.replace(":id", $routeParams.userId), {full: true}, function (data, status) {
                $scope.user = data.user;
                $rootScope.page_title = "More like " + $scope.user.username
            });
        }
    };
    $scope.refreshUsers = function () {
        $scope.currentPage = 1;
        $scope.filters.page = 1;
        if (typeof $routeParams.userId == "undefined") {
            APIService.get(urls.usersList, $scope.filters, function (data, status) {
                $scope.numPages = data.num_pages;
                $scope.users = data.items;
            }, true, true);
        } else {
            APIService.get(urls.similarUsers.replace(":id", $routeParams.userId), $scope.filters, function (data, status) {
                $scope.users = data.users;
            }, true, true);
            APIService.get(urls.userDetails.replace(":id", $routeParams.userId), {full: true}, function (data, status) {
                $scope.user = data.user;
                $rootScope.page_title = "More like " + $scope.user.username
            });
        }
    };

    $scope.loadMore = function () {
        if ($scope.currentPage < $scope.numPages) {
            $scope.currentPage += 1;
            $scope.filters.page = $scope.currentPage;
            $scope.loadUsers();
        }
    };

    $scope.$watch("q", function (newValue, oldValue) {
        if (oldValue != newValue) {
            $scope.filters['q'] = newValue;
        }
    });

    $scope.setFilter = function (filter) {
        for (var key in filter) {
            $scope.filters[key] = filter[key];
        }
    };

    $scope.deleteFilter = function (name) {
        delete $scope.filters[name];
    };

    $scope.updateGenderTitle = function (title) {
        $scope.currentGenderFilter = title;
    };

    $scope.updateHasPhotoTitle = function (title) {
        $scope.currentHasPhotoFilter = title;
    };

    $scope.updateOnlineTitle = function (title) {
        $scope.currentOnlineFilter = title;
    };

    $scope.followUser = function (user) {
        APIService.post(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 200) {
                user.num_followers = data.followers;
                user.is_following = true;
            }
        });
    };

    $scope.unfollowUser = function (user) {
        APIService.remove(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 204) {
                user.num_followers -= 1;
                user.is_following = false;
            }
        });
    };

    $scope.isSelf = function (user) {
        return AuthService.user.user_id == user.user_id;
    };
});


app.controller("TopicsController", function ($scope, APIService, AuthService) {

    $scope.filters = {};
    $scope.topics = [];
    $scope.currentTopicFilter = "Sort Results";
    $scope.currentTopicOrder = "Order Results";

    $scope.$watch("q", function (newValue, oldValue) {
        if (oldValue != newValue) {
            $scope.filters['q'] = newValue;
        }
    });

    $scope.refreshTopics = function () {
        APIService.get(urls.topicsList, $scope.filters, function (data, status) {
            $scope.topics = data.items;
        }, true, true);
    };

    $scope.followTopic = function (topic) {
        APIService.post(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            topic.num_followers = data['total'];
            topic.is_following = true;
        });
    };

    $scope.unfollowTopic = function (topic) {
        APIService.remove(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            topic.num_followers -= 1;
            topic.is_following = false;
        });
    };

    $scope.setFilter = function (filter) {
        for (var key in filter) {
            $scope.filters[key] = filter[key];
        }
    };

    $scope.deleteFilter = function (name) {
        delete $scope.filters[name];
    };


    $scope.refreshTopics();
});


app.controller("ContactsController", function ($scope, APIService, AuthService) {

    $scope.users = [];
    $scope.filters = {};
    $scope.loggedUser = AuthService.user;

    $scope.currentGenderFilter = 'Any gender';
    $scope.currentOnlineFilter = 'Online status';
    $scope.currentHasPhotoFilter = 'Avatar status';
    $scope.currentSection = 'Recent';

    $scope.currentPage = 1;
    $scope.numPages = 1;

    $scope.refreshRecentUsers = function () {
        $scope.filters.page = 1;
        APIService.get(urls.recentUsersList.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            var users = [];
            for (var i in data.recent) {
                for (var j in data.recent[i].users){
                    if(data.recent[i].users[j].user_id != $scope.loggedUser.user_id){
                        users.push(data.recent[i].users[j])
                    }
                }
            }
            $scope.users = users;
            $scope.currentSection = "Recent";
            $scope.numPages = data.num_pages;
            $scope.currentPage = 1;
        }, true, true);
    };

    $scope.refreshFollowersUsers = function () {
        $scope.filters.page = 1;
        APIService.get(urls.userFollowers.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            $scope.users = data.followers;
            $scope.currentSection = "Followers";
            $scope.numPages = data.num_pages;
            $scope.currentPage = 1;
        }, true, true);
    };

    $scope.refreshFollowingUsers = function () {
        $scope.filters.page = 1;
        APIService.get(urls.userFollowing.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            $scope.users = data.following;
            $scope.currentSection = "Following";
            $scope.numPages = data.num_pages;
            $scope.currentPage = 1;
        }, true, true);
    };

    $scope.loadRecentUsers = function () {
        $scope.currentPage += 1;
        if ($scope.currentPage > $scope.numPages)
            return;
        $scope.filters.page = $scope.currentPage;
        APIService.get(urls.recentUsersList.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            for (var i in data.recent) {
                $scope.users.push(data.recent[i].other_user);

            }
        }, true, true);
    };

    $scope.loadFollowersUsers = function () {
        $scope.currentPage += 1;
        if ($scope.currentPage > $scope.numPages)
            return;
        $scope.filters.page = $scope.currentPage;
        APIService.get(urls.userFollowers.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            for (var i in data.followers) {
                $scope.users.push(data.followers[i]);
            }
        }, true, true);
    };

    $scope.loadFollowingUsers = function () {
        $scope.currentPage += 1;
        if ($scope.currentPage > $scope.numPages)
            return;
        $scope.filters.page = $scope.currentPage;
        APIService.get(urls.userFollowing.replace(":id", AuthService.user.user_id), $scope.filters, function (data, status) {
            for (var i in data.following) {
                $scope.users.push(data.following[i]);
            }
        }, true, true);
    };

    $scope.loadMore = function () {
        if ($scope.currentSection == 'Recent')
            $scope.loadRecentUsers();
        if ($scope.currentSection == 'Followers')
            $scope.loadFollowersUsers();
        if ($scope.currentSection == 'Following')
            $scope.loadFollowingUsers();
    };

    $scope.followUser = function (user) {
        APIService.post(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 200) {
                user.num_followers = data.followers;
                user.is_following = true;
            }
        });
    };

    $scope.unfollowUser = function (user) {
        APIService.remove(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 204) {
                $scope.user.num_followers -= 1;
                $scope.user.is_following = false;
            }
        });
    };

    $scope.isSelf = function (user) {
        return AuthService.user.user_id == user.user_id;
    };

    $scope.followUser = function (user) {
        APIService.post(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 200) {
                user.num_followers = data.followers;
                user.is_following = true;
            }
        });
    };

    $scope.unfollowUser = function (user) {
        APIService.remove(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 204) {
                user.num_followers -= 1;
                user.is_following = false;
            }
        });
    };

    $scope.refreshRecentUsers();
});


app.controller("SearchController", function ($scope, APIService, AuthService, $rootScope) {
    $scope.queryString = $rootScope.queryString;
    $scope.questionsResults = [];
    $scope.usersResults = [];
    $scope.topicsResults = [];

    $scope.updateResults = function () {
        APIService.get(urls.searchDigest, {q: $scope.queryString}, function (data, status) {
            if (status == 200) {
                $scope.questionsResults = data.questions;
                $scope.topicsResults = data.topics;
                $scope.usersResults = data.users;
            }
        })
    };

    $scope.followUser = function (user) {
        APIService.post(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 200) {
                user.num_followers = data.followers;
                user.is_following = true;
            }
        });
    };

    $scope.unfollowUser = function (user) {
        APIService.remove(urls.followUser.replace(":id", user.user_id), {}, function (data, status) {
            if (status == 204) {
                user.num_followers -= 1;
                user.is_following = false;
            }
        });
    };

    $scope.isSelf = function (user) {
        return AuthService.user.user_id == user.user_id;
    };

    $scope.followTopic = function (topic) {
        APIService.post(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            topic.num_followers = data['total'];
            topic.is_following = true;
        });
    };

    $scope.unfollowTopic = function (topic) {
        APIService.remove(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            topic.num_followers -= 1;
            topic.is_following = false;
        });
    };

    $scope.updateResults();
});
