app.controller("QuestionDetailController", function ($scope, $routeParams, APIService, $q, $rootScope, $interval, $location) {
    var questionId = $routeParams.id;

    $scope.question = {};
    $scope.answers = [];
    $scope.commentForm = [];
    $scope.replyForm = [];
    $scope.answerForm = {};
    $scope.favouriteAnswer = null;
    $scope.answerFormOpen = false;
    $scope.replyFormOpen = false;
    $scope.pendingCommentRequest = false;
    $scope.filter = {
        order_by: 'D'
    };
    $scope.commentsByDate = true;
    $scope.answersByDate = true;

    $scope.encodedBaseURL = encodeURIComponent($rootScope.baseURL);

    $scope.reportForm = {};
    $scope.reportingQuestion = 0;

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


    $scope.filterByDate = function () {
        $scope.commentsByDate = true;
        $scope.filter = {
            order_by: 'D'
        };
        $scope.refreshAnswers();
    };

    $scope.filterByVotes = function () {
        $scope.commentsByDate = false;
        $scope.filter = {
            comments_by_votes: true,
            order_by: 'D'
        };
        $scope.refreshAnswers();
    };

    $scope.filterAnswersByDate = function () {
        $scope.answersByDate = true;
        $scope.filter = {
            order_by: 'D'
        };
        $scope.refreshAnswers();
    };
    $scope.filterAnswersByVotes = function () {
        $scope.answersByDate = false;
        $scope.filter = {
            order_by: 'V'
        };
        $scope.refreshAnswers();
    };

    $scope.refreshAnswers = function () {
        var deferred = $q.defer();
        APIService.get(urls.answersList.replace(":id", $scope.question.id), $scope.filter, function (data, status) {
            if (status == 200) {
                $scope.answers = data.items;
                deferred.resolve();
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    $scope.createAnswer = function (question) {
        APIService.post(urls.answersList.replace(":id", question.id), {answer: $scope.answerForm.answerBody}, function (data, status) {
            $scope.answerFormOpen = false;
            $scope.answerForm.answerBody = "";
            question.answer_count += 1;
            $scope.refreshAnswers();
        });
    };

    $scope.commentAnswer = function (answer) {
        $scope.pendingCommentRequest = true;
        APIService.post(urls.answersCommentCreate.replace(":id", answer.id), {body: $scope.commentForm[answer.id].commentBody}, function (data, status) {
            if (status == 201) {
                $scope.refreshAnswers().then(function () {
                    $scope.pendingCommentRequest = false;
                    $scope.commentForm[answer.id].commentBody = "";
                });
            }
        });
    };

    $scope.likeAnswer = function (answer) {
        APIService.post(urls.likeAnswer.replace(":id", answer.id), {"like": 1}, function (data, status) {
            if (data.success == true) {
                answer.likes_count = data.likes;
                answer.dislikes_count = data.dislikes;
                answer.is_liked_by_me = true;
                answer.is_disliked_by_me = false;
            }
        })
    };

    $scope.dislikeAnswer = function (answer) {
        APIService.post(urls.likeAnswer.replace(":id", answer.id), {"like": -1}, function (data, status) {
            if (data.success == true) {
                answer.likes_count = data.likes;
                answer.dislikes_count = data.dislikes;
                answer.is_liked_by_me = false;
                answer.is_disliked_by_me = true;
            }
        })
    };

    $scope.likeComment = function (comment) {
        APIService.post(urls.likeComment.replace(":id", comment.id), {"like": 1}, function (data, status) {
            if (data.success == true) {
                comment.likes_info = data.likes;
                comment.dislikes_info = data.dislikes;
                comment.is_liked_by_me = true;
                comment.is_disliked_by_me = false;
            }
        })
    };

    $scope.dislikeComment = function (comment) {
        APIService.post(urls.likeComment.replace(":id", comment.id), {"like": -1}, function (data, status) {
            if (data.success == true) {
                comment.likes_info = data.likes;
                comment.dislikes_info = data.dislikes;
                comment.is_liked_by_me = false;
                comment.is_disliked_by_me = true;
            }
        })
    };

    $scope.replyToComment = function (comment, answer) {
        $scope.pendingCommentRequest = true;
        APIService.post(urls.answersCommentCreate.replace(":id", answer.id), {
            body: $scope.replyForm[comment.id].replyBody,
            parent: comment.id
        }, function (data, status) {
            if (status == 201) {
                $scope.refreshAnswers().then(function () {
                    $scope.pendingCommentRequest = false;
                    $scope.replyForm[comment.id].replyBody = "";
                });
            }
        });
    };

    $scope.getSimilarQuestions = function (topics) {
        var IDs = [];
        for (var i in topics) {
            IDs[i] = topics[i].id;
        }
        APIService.get(urls.questionsList, {topics: JSON.stringify(IDs)}, function (data, status) {
            $scope.similarQuestions = data.items;
        });
    };

    $scope.increaseQuestionSharings = function ($clickEvent, question, provider) {
        $clickEvent.preventDefault();
        APIService.post(urls.questionSharingCreate.replace(":id", question.id), {provider: provider}, function (data, status) {
            if (data.success) {
                question.sharings = question.sharings + 1;
                window.location = $clickEvent.target.href;
            }
        })
    };

    $scope.increaseAnswerSharings = function ($clickEvent, question, provider) {
        $clickEvent.preventDefault();
        APIService.post(urls.questionSharingCreate.replace(":id", question.id), {provider: provider}, function (data, status) {
            if (data.success) {
                console.log($clickEvent);
                question.sharings = question.sharings + 1;
                window.location = $clickEvent.target.href;
            }
        })
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
            }
        });
    };

    $scope.scrollToAnswers = function () {
        el = angular.element("#answers");
        offsetTop = el.offset().top;

        angular.element('html, body').animate({
            scrollTop: offsetTop
        }, 1000);

    };

    $scope.authorOnlineCheck = function () {
        APIService.get(urls.questionsDetail.replace(":id", questionId), {}, function (data, status) {
            if (status == 200) {
                $scope.question.user.online_status = data['question'].user.online_status;
            }
        }, false, false);
    };

    $scope.$on('ngRepeatFinished', function () {
        if ($location.hash()) {
            el = angular.element("#" + $location.hash());
            offsetTop = el.offset().top;
            angular.element('html, body').animate({
                scrollTop: offsetTop
            }, 1000);

        }
    });

    $scope.detectFavouriteAnswer = function () {
        for (var i in $scope.answers) {

            var answer = $scope.answers[i];

            if (answer.likes_count >= 5) {
                if ($scope.favouriteAnswer == null) {
                    $scope.favouriteAnswer = answer
                } else {
                    if ($scope.favouriteAnswer.likes_count < answer.likes_count) {
                        $scope.favouriteAnswer = answer;
                    }
                }
            }


        }

    };


    $interval($scope.authorOnlineCheck, 15000);
    $interval($scope.refreshAnswers, 60000);

    APIService.get(urls.questionsDetail.replace(":id", questionId), {}, function (data, status) {
        if (status == 200) {
            $scope.question = data['question'];
            $scope.refreshAnswers().then($scope.detectFavouriteAnswer);
            $scope.getSimilarQuestions($scope.question.topics);
        }
    });

    APIService.get(urls.reportReasons, {}, function (data, status) {
        if (status == 200) {
            $scope.reportReasons = data.objects;
        }
    });

});

app.controller("AskQuestionController", function ($scope, APIService, AuthService, $location, $routeParams) {
    $scope.questionForm = {};
    $scope.topicsSearch = "";
    $scope.topicToAdd = null;
    $scope.topicsSearchResult = [];
    $scope.questionTopics = [];
    $scope.tmpMediaID = false;
    $scope.previewReady = false;
    $scope.stopSearch = false;
    $scope.editorUploadResult = {};

    var topicId = $routeParams.id;

    if (typeof topicId != "undefined"){
        APIService.get(urls.topicsDetail.replace(":id", topicId), {}, function(data, status){
            $scope.questionTopics.push(data.topic);
        });
    }

    $("#browse").click(function () {
        $('#uploader').trigger('click');
    });

    $scope.inList = function (topic, list) {
        if (topic === null)
            return false;

        for (var i in list) {
            if (topic.id == list[i].id) {
                return true;
            }
        }

        return false;
    };

    $scope.$watch("topicsSearch", function (newValue, oldValue) {
        if (newValue != oldValue && !$scope.stopSearch) {
            APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                if (newValue == "") {
                    $scope.topicsSearchResult = [];
                } else if (status == 200) {
                    $scope.topicsSearchResult = data.items;
                }
            })
        }
        $scope.stopSearch = false;
    });

    $scope.thumb = {};//Модель
    $scope.file = {};//Модель
    $scope.options = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.thumb).then(function (data) {
                $scope.tmpMediaID = data.data.tmp_media.id;
                $scope.previewReady = true;
            })
        }
    };

    $scope.optionsEditor = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                $scope.editorUploadResult.url = data.data.tmp_media.file;
                $scope.editorUploadResult.previewReady = true;
            });
        }
    };

    $scope.addTopicToList = function () {
        if (!$scope.inList($scope.topicToAdd, $scope.questionTopics)) {
            if ($scope.topicToAdd !== null) {
                $scope.topicsSearchResult = [];
                $scope.questionTopics.push($scope.topicToAdd);
                $scope.topicToAdd = null;
                $scope.topicsSearch = "";
            } else {
                APIService.post(urls.topicsList, {name: $scope.topicsSearch}, function (data, status) {
                    if (data.success) {
                        $scope.questionTopics.push(data.topic);
                        $scope.topicsSearch = "";
                    }
                });
            }
        }
    };

    $scope.prepareTopic = function (topic) {
        $scope.topicToAdd = topic;
        $scope.topicsSearch = topic.name;
        $scope.topicsSearchResult = [];
        $scope.stopSearch = true;
    };

    $scope.deleteTopic = function (topic) {
        var index = $scope.questionTopics.indexOf(topic);

        if (index > -1) {
            $scope.questionTopics.splice(index, 1)
        }
    };

    $scope.askQuestion = function () {
        var topics = [];
        $.each($scope.questionTopics, function (i, el) {
            topics.push(el.id);
        });
        data = {
            title: $scope.questionForm.questionTitle,
            details: $scope.questionForm.questionDetails,
            topics: topics,
            user_id: AuthService.user.user_id
        };
        if ($scope.tmpMediaID) {
            data['image'] = $scope.tmpMediaID;
        }
        APIService.post(urls.questionsList, data, function (data, status) {
            if (data.success) {
                $location.path("/question/" + data.item.id);
            }
        })
    }
});

app.controller("SuggestEditController", function ($scope, APIService, AuthService, $location, $routeParams) {
    var questionId = $routeParams.id;

    $scope.questionForm = {};
    $scope.editorUploadResult = {};
    $scope.file = {};//Модель
    $scope.optionsEditor = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                $scope.editorUploadResult.url = data.data.tmp_media.file;
                $scope.editorUploadResult.previewReady = true;
            });
        }
    };

    $scope.submitChanges = function () {
        var content = "Title: :title; Details: :details";

        content = content
            .replace(":title", $scope.questionForm.questionTitle)
            .replace(":details", $scope.questionForm.questionDetails);

        APIService.post(urls.questionsSuggestEdit.replace(":id", questionId), {content: content}, function (data, status) {
            $location.path("/question/" + questionId);
        })
    };

    APIService.get(urls.questionsDetail.replace(":id", questionId), {}, function (data, status) {
        if (status == 200) {
            $scope.question = data['question'];
            $scope.questionForm.questionTitle = $scope.question.title;
            $scope.questionForm.questionDetails = $scope.question.details;
        }
    });
});