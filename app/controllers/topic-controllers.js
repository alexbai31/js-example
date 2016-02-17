app.controller("TopicDetailController", function ($scope, APIService, $routeParams, $rootScope, $http) {
    var topicId = $routeParams.id;

    $scope.experts = [];
    $scope.topic = null;
    $scope.similarTopics = [];
    $scope.openQuestions = [];
    $scope.topStories = [];
    $scope.topicFollowers = [];
    $scope.fullDetails = [];

    $scope.encodedBaseURL = encodeURIComponent($rootScope.baseURL);

    $scope.reportForm = {};
    $scope.reportingQuestion = 0;
    $scope.reportReasons = [];

    $scope.map = {center: {latitude: 0, longitude: 0}, zoom: 8};

    APIService.get(urls.topicsDetail.replace(":id", topicId), {full: true}, function (data, status) {
        if (data.success) {
            $scope.topic = data.topic;
            if ($scope.topic.is_location) {
                var topicLocation = $scope.topic.location.split(",");
                $scope.map.center = {
                    latitude: topicLocation[0],
                    longitude: topicLocation[1]
                }
            }
            APIService.get(urls.topicsList, {category_id: $scope.topic.category_id}, function (data, status) {
                if (status == 200)
                    $scope.similarTopics = data.items
            });
            APIService.get(urls.questionsList, {
                has_answers: false,
                topics: "[@]".replace("@", $scope.topic.id)
            }, function (data, status) {
                if (status == 200) {
                    $scope.openQuestions = data.items;
                }
            })
        }
    });

    APIService.get(urls.usersList, {knows_about: topicId}, function (data, status) {
        if (status == 200)
            $scope.experts = data.items;
    });

    APIService.get(urls.questionsList, {topics: "[" + topicId + "]", order_by: "V"}, function (data, status) {
        if (status == 200)
            $scope.topStories = data.items;
    });

    APIService.get(urls.topicFollowers.replace(":topicId", topicId), {}, function (data, status) {
        if (status == 200)
            $scope.topicFollowers = data.followers;
    });

    APIService.get(urls.reportReasons, {}, function (data, status) {
        if (status == 200) {
            $scope.reportReasons = data.objects;
        }
    });

    $scope.followTopic = function () {
        APIService.post(urls.topicFollowers.replace(":topicId", $scope.topic.id), {}, function (data, status) {
            $scope.topic.num_followers = data['total'];
            $scope.topic.is_following = true;
        });
    };

    $scope.unfollowTopic = function () {
        APIService.remove(urls.topicFollowers.replace(":topicId", $scope.topic.id), {}, function (data, status) {
            $scope.topic.num_followers -= 1;
            $scope.topic.is_following = false;
        });
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

    $scope.showTail = function (question) {
        $('.tail-' + question.id).fadeToggle();
        $('.question-image-' + question.id).fadeToggle(100);
        $scope.fullDetails[question.id] = !$scope.fullDetails[question.id];
    };

    $scope.increaseTopicSharings = function ($clickEvent, topic, provider) {
        $clickEvent.preventDefault();
        APIService.post(urls.topicSharingCreate.replace(":id", topic.id), {provider: provider}, function (data, status) {
            if (data.success) {
                topic.sharings = topic.sharings + 1;
                window.location = $clickEvent.target.href;
            }
        })
    };

    $scope.reportQuestion = function () {
        var questionID = $scope.reportingQuestion,
            reason = $scope.reportForm.reportReason;
        APIService.post(urls.reportQuestion.replace(":id", questionID), {reason: reason}, function (data, status) {
            if (data.success) {
                $("#reportModal").modal('hide');
            }
        });
    };

    $scope.reportPrepare = function (question) {
        $scope.reportingQuestion = question.id;
    };
});