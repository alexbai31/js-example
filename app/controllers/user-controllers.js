app.controller('ProfileController', function ($scope, $routeParams, APIService, $interval, $http, AuthService, $route, $location, $rootScope) {
    var userID = $routeParams.id;
    $scope.user = {};
    $scope.location = null;
    $scope.fullDetails = false;
    $scope.loggedUserTopics = [];
    $scope.followers = [];
    $scope.following = [];
    $scope.followersTab = true;
    $scope.similarUsers = [];

    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", userID), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
            }
        }, true, true, function (data, status) {
            $location.path("/user-not-found");
        })
    };

    $scope.updateLoggedUserTopics = function () {
        APIService.get(urls.userDetails.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.loggedUserTopics = data.user.topics;
            $scope.updateUser();
            $scope.getFollowers();
            $scope.getFollowing();
            $scope.getSimilar();
        });
    };

    $scope.getFollowers = function () {
        APIService.get(urls.userFollowers.replace(":id", userID), {}, function (data, status) {
            $scope.followersData = data;

        });
    };

    $scope.getFollowing = function () {
        APIService.get(urls.userFollowing.replace(":id", userID), {}, function (data, status) {
            $scope.followingData = data;
        });
    };

    $scope.getSimilar = function () {
        APIService.get(urls.similarUsers.replace(":id", userID), {}, function (data, status) {
            if (status == 200) {
                $scope.similarUsers = data.users;
            }
        })
    };

    $scope.followUser = function () {
        APIService.post(urls.followUser.replace(":id", $scope.user.user_id), {}, function (data, status) {
            if (status == 200) {
                $scope.user.num_followers = data.followers;
                $scope.user.is_following = true;
                $scope.getFollowers();
            }
        });
    };

    $scope.unfollowUser = function () {
        APIService.remove(urls.followUser.replace(":id", $scope.user.user_id), {}, function (data, status) {
            if (status == 204) {
                $scope.user.num_followers -= 1;
                $scope.user.is_following = false;
                $scope.getFollowers();
            }
        });
    };

    $scope.voteUp = function () {
        APIService.post(urls.voteUser.replace(":id", userID), {vote: 1}, function (data, status) {
            if (data.success) {
                $scope.user.vote = data.vote;
                $scope.user.rated = 1;
                $scope.user.num_voted = data.num_voted;
            }
        });
    };

    $scope.voteDown = function () {
        APIService.post(urls.voteUser.replace(":id", userID), {vote: 0}, function (data, status) {
            if (data.success) {
                $scope.user.vote = data.vote;
                $scope.user.rated = 0;
                $scope.user.num_voted = data.num_voted;
            }
        });
    };

    $scope.expandAbout = function () {
        $(".about-panel").animate({height: $(".about-panel")[0].scrollHeight}, 200);
        $scope.fullDetails = !$scope.fullDetails;
    };

    $scope.collapseAbout = function () {
        $(".about-panel").animate({height: "101px"}, 200);
        $scope.fullDetails = !$scope.fullDetails;
    };

    $scope.isFollowing = function (topic) {
        for (var i in $scope.loggedUserTopics.interests) {
            if (topic.id == $scope.loggedUserTopics.interests[i].id) {
                return true;
            }
        }
        return false;
    };

    $scope.followTopic = function (topic) {
        APIService.post(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            topic.num_followers = data['total'];
            angular.element('.follow-' + topic.id).addClass('ng-hide');
            angular.element('.unfollow-' + topic.id).removeClass('ng-hide');
            if (AuthService.user.user_id == $scope.user.user_id) {
                $scope.updateLoggedUserTopics();
            }
        });
    };

    $scope.unfollowTopic = function (topic) {
        APIService.remove(urls.topicFollowers.replace(":topicId", topic.id), {}, function (data, status) {
            if (topic.num_followers > 0) {
                topic.num_followers -= 1;
            }
            angular.element('.unfollow-' + topic.id).addClass('ng-hide');
            angular.element('.follow-' + topic.id).removeClass('ng-hide');
            if (AuthService.user.user_id == $scope.user.user_id) {
                $scope.updateLoggedUserTopics();
            }
        });
    };

    $scope.isSelf = function () {
        return $scope.user.user_id == AuthService.user.user_id;
    };

    $scope.updateLoggedUserTopics();

    $rootScope.intervals.push($interval($scope.updateLoggedUserTopics, 15000));

});

app.controller("ProfileFollowersController", function ($scope, APIService, AuthService, $routeParams) {
    var userID = $routeParams.id;
    $scope.currentPage = 0;
    $scope.numPages = 1;

    $scope.filters = {};

    $scope.currentGenderFilter = 'Any gender';
    $scope.currentOnlineFilter = 'Online status';
    $scope.currentHasPhotoFilter = 'Avatar status';

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

    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", userID), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
            }
        }, true, true, function (data, status) {
            $location.path("/user-not-found");
        })
    };

    $scope.isSelf = function (user) {
        return AuthService.user.user_id == user.user_id;
    };

    $scope.getFollowers = function () {
        $scope.filters.page = 1;
        APIService.get(urls.userFollowers.replace(":id", userID), $scope.filters, function (data, status) {
            $scope.numPages = data.num_pages;
            $scope.currentPage = 0;
            $scope.followersData = data;

        });
    };

    $scope.loadFollowers = function () {
        APIService.get(urls.userFollowers.replace(":id", userID), $scope.filters, function (data, status) {
            $scope.numPages = data.num_pages;
            for (var i in data.followers) {
                $scope.followersData.followers.push(data.followers[i]);
            }

        });
    };

    $scope.updateLoggedUserTopics = function () {
        APIService.get(urls.userDetails.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.loggedUserTopics = data.user.topics;
            $scope.updateUser();
            $scope.getFollowers();
        });
    };

    $scope.loadMore = function () {
        if ($scope.currentPage < $scope.numPages) {
            $scope.currentPage += 1;
            if ($scope.currentPage > 1) {
                $scope.filters.page = $scope.currentPage;
                $scope.loadFollowers();
            }
        }
    };

    $scope.updateLoggedUserTopics();

});

app.controller('ProfileFollowingController', function ($scope, APIService, AuthService, $routeParams) {
    var userID = $routeParams.id;
    $scope.currentPage = 0;
    $scope.numPages = 1;

    $scope.filters = {};

    $scope.currentGenderFilter = 'Any gender';
    $scope.currentOnlineFilter = 'Online status';
    $scope.currentHasPhotoFilter = 'Avatar status';

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

    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", userID), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
            }
        }, true, true, function (data, status) {
            $location.path("/user-not-found");
        })
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

    $scope.getFollowing = function () {
        $scope.filters.page = 1;
        APIService.get(urls.userFollowing.replace(":id", userID), $scope.filters, function (data, status) {
            $scope.numPages = data.num_pages;
            $scope.currentPage = 0;
            $scope.followingData = data;
        });
    };

    $scope.loadFollowing = function () {
        APIService.get(urls.userFollowing.replace(":id", userID), $scope.filters, function (data, status) {
            $scope.numPages = data.num_pages;
            for (var i in data.following) {
                $scope.followingData.following.push(data.following[i]);
            }

        });
    };

    $scope.updateLoggedUserTopics = function () {
        APIService.get(urls.userDetails.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.loggedUserTopics = data.user.topics;
            $scope.updateUser();
            $scope.getFollowing();
        });
    };

    $scope.loadMore = function () {
        if ($scope.currentPage < $scope.numPages) {
            $scope.currentPage += 1;
            if ($scope.currentPage > 1) {
                $scope.filters.page = $scope.currentPage;
                $scope.loadFollowing();
            }
        }
    };

    $scope.updateLoggedUserTopics();
});

app.controller('EditProfileController', function ($scope, AuthService, APIService, $interval, $templateCache, $rootScope) {
    $scope.user = false;
    $scope.location = null;
    $scope.followers = [];
    $scope.following = [];
    $scope.followersTab = true;
    $scope.similarUsers = [];
    $scope.dob = {};
    $scope.gender = "U";
    $scope.cityID = null;
    $scope.userForm = {
        dob: {},
        gender: "",
        aboutMe: ""
    };
    $scope.topicsSearchResult = {
        interests: [],
        education: [],
        employment: [],
        locations: [],
        knowledge: []
    };
    $scope.topicsSearch = {
        interests: "",
        education: "",
        employment: "",
        locations: "",
        knowledge: ""
    };
    $scope.topicPreSave = {
        interests: null,
        education: null,
        employment: null,
        locations: null,
        knowledge: null
    };
    $scope.certifications = [];
    $scope.similarUsers = [];

    $scope.edit_status_message = '';
    $scope.topicDefault = '';

    $scope.selectDefaultTopic = function (topic) {

        if ($scope.user.topics.knowledge.indexOf(topic) != -1 && topic.primary_topic != true) {
            //$scope.topicDefault = 'knowledgeTopicDefault'+topic.id;

            angular.forEach($scope.user.topics.knowledge, function (topic, key) {
                if (topic.primary_topic == true) {
                    APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                        primary_topic: false,
                        group: 'K',
                        topic: topic.id,
                        user: $scope.user.user_id
                    }, function (data, status) {
                        //$scope.updateUser();
                    });
                }
            });

            APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                primary_topic: true,
                group: 'K',
                topic: topic.id,
                user: $scope.user.user_id
            }, function (data, status) {
                $scope.updateUser();
            });


        }

        if ($scope.user.topics.education.indexOf(topic) != -1) {
            //$scope.topicDefault = 'educationTopicDefault'+topic.id;

            APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                primary_topic: true,
                group: 'E',
                topic: topic.id,
                user: $scope.user.user_id
            }, function (data, status) {
                $scope.updateUser();
            });
        }

        if ($scope.user.topics.interests.indexOf(topic) != -1) {
            //$scope.topicDefault = 'interestsTopicDefault'+topic.id;

            APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                primary_topic: true,
                group: 'I',
                topic: topic.id,
                user: $scope.user.user_id
            }, function (data, status) {
                $scope.updateUser();
            });
        }

        if ($scope.user.topics.employment.indexOf(topic) != -1) {
            //$scope.topicDefault = 'employmentTopicDefault'+topic.id;

            APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                primary_topic: true,
                group: 'J',
                topic: topic.id,
                user: $scope.user.user_id
            }, function (data, status) {
                $scope.updateUser();
            });
        }

        if ($scope.user.topics.locations.indexOf(topic) != -1) {
            //$scope.topicDefault = 'locationsTopicDefault'+topic.id;

            APIService.put(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {
                primary_topic: true,
                group: 'L',
                topic: topic.id,
                user: $scope.user.user_id
            }, function (data, status) {
                $scope.updateUser();
            });
        }

    };

    $scope.delThisTopic = function (topic) {
        APIService.remove(urls.userTopicsDetail.replace(":id", $scope.user.user_id).replace(":user_topic_id", topic.user_topic_id), {}, function (data, status) {
            $scope.updateUser();
        });
    };

    $scope.editStatusMessage = function () {

        if ($scope.user.status_message == '') {
            $scope.user.status_message == 'Add tagline';
        }

        if ($scope.edit_status_message == '') {
            $scope.edit_status_message = $scope.user.status_message;
        }
        else {
            $scope.edit_status_message = '';
        }
    };

    $scope.statusMessageNewValue = function () {
        var status_message = angular.element('#status_message').val();
        APIService.put(urls.userDetails.replace(":id", $scope.user.user_id), {status_message: status_message}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
            }
        })

        $scope.edit_status_message = '';

    };

    $scope.$watch("topicsSearch.knowledge", function (newValue, oldValue) {
        if (newValue != oldValue) {
            if (newValue != "") {
                APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                    if (status == 200) {
                        $scope.topicsSearchResult.knowledge = data.items;
                    }
                });
            } else {
                $scope.topicsSearchResult.knowledge = [];
            }
        }
    });

    $scope.$watch("topicsSearch.education", function (newValue, oldValue) {
        if (newValue != oldValue) {
            if (newValue != "") {
                APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                    if (status == 200) {
                        $scope.topicsSearchResult.education = data.items;
                    }
                });
            } else {
                $scope.topicsSearchResult.education = [];
            }
        }
    });

    $scope.$watch("topicsSearch.employment", function (newValue, oldValue) {
        if (newValue != oldValue) {
            if (newValue != "") {
                APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                    if (status == 200) {
                        $scope.topicsSearchResult.employment = data.items;
                    }
                });
            } else {
                $scope.topicsSearchResult.employment = [];
            }
        }
    });

    $scope.$watch("topicsSearch.locations", function (newValue, oldValue) {
        if (newValue != oldValue) {
            if (newValue != "") {
                APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                    if (status == 200) {
                        $scope.topicsSearchResult.locations = data.items;
                    }
                });
            } else {
                $scope.topicsSearchResult.locations = [];
            }
        }
    });

    $scope.$watch("topicsSearch.interests", function (newValue, oldValue) {
        if (newValue != oldValue) {
            if (newValue != "") {
                APIService.get(urls.topicsList, {q: newValue}, function (data, status) {
                    if (status == 200) {
                        $scope.topicsSearchResult.interests = data.items;
                    }
                });
            } else {
                $scope.topicsSearchResult.interests = [];
            }
        }
    });

    APIService.get(urls.userCertifications.replace(":id", AuthService.user.user_id), {}, function (data, status) {
        $scope.certifications = data.certifications;
    });

    $scope.setPreSave = function (group, topic) {
        if (group == 'knowledge') {
            $scope.topicsSearch.knowledge = topic.name;
        }

        if (group == 'education') {
            $scope.topicsSearch.education = topic.name;
        }

        if (group == 'employment') {
            $scope.topicsSearch.employment = topic.name;
        }

        if (group == 'interests') {
            $scope.topicsSearch.interests = topic.name;
        }

        if (group == 'locations') {
            $scope.topicsSearch.locations = topic.name;
        }

        $scope.topicPreSave[group] = topic;
    };

    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", AuthService.user.user_id), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
                if ($scope.user.status_message == '') {
                    $scope.user.status_message = 'Add tagline';
                }

                try {
                    var dob = $scope.user.date_of_birth.split("-") || [];
                } catch (err) {
                    var dob = [];
                }
                if (dob.length == 3) {
                    $scope.userForm.dob.year = dob[0];
                    $scope.userForm.dob.month = dob[1];
                    if (dob[2][0] == "0") {
                        dob[2] = dob[2].substring(1);
                    }
                    $scope.userForm.dob.day = dob[2];
                }
                $scope.userForm.gender = $scope.user.gender;
            }
        })
    };

    $scope.$watch("location", function (newValue, oldValue) {
        if (newValue != oldValue) {
            APIService.get(urls.citiesList, {q: newValue}, function (data, status) {
                $scope.citiesAutocomplete = data.cities;
            })
        }
    });

    $scope.setCity = function (city) {
        $scope.location = city.city + ", " + city.region + ", " + city.country;
        $scope.cityID = city.id;
    };

    $scope.saveLocation = function () {
        if ($scope.cityID != null) {
            APIService.put(urls.userDetails.replace(":id", AuthService.user.user_id), {location: $scope.cityID}, function (data, status) {
                $scope.updateUser();
            });
        }
    };


    $scope.clearAvatar = function () {
        $scope.uploadResult = {};
        $scope.file = {};
        $scope.options = {
            fieldName: "file",
            change: function (file) {
                file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                    $scope.uploadResult.url = data.data.tmp_media.file;
                    $scope.uploadResult.id = data.data.tmp_media.id;
                    $scope.uploadResult.previewReady = true;
                    $scope.file = {};
                })
            }
        };
    };

    $scope.clearAvatar();

    $scope.editorUploadResult = {};
    $scope.editorFile = {};
    $scope.editorOptions = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.editorFile).then(function (data) {
                $scope.editorUploadResult.url = data.data.tmp_media.file;
                $scope.editorUploadResult.id = data.data.tmp_media.id;
                $scope.editorUploadResult.previewReady = true;
                $scope.editorFile = {};
            })
        }
    };


    $scope.updateDescription = function () {
        APIService.put(urls.userDetails.replace(":id", AuthService.user.user_id), {about: $scope.userForm.aboutMe}, function (data, status) {
            if (data.success) {
                $scope.updateUser();
            }
        })
    };

    $scope.cancelDescription = function () {
        $scope.userForm.aboutMe = $scope.user.about_me;
    };

    $scope.getSimilar = function () {
        APIService.get(urls.similarUsers.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            if (status == 200) {
                $scope.similarUsers = data.users;
            }
        })
    };

    $scope.saveDob = function () {
        APIService.put(
            urls.userDetails.replace(":id", AuthService.user.user_id),
            {date_of_birth: $scope.userForm.dob.month + "/" + $scope.userForm.dob.day + "/" + $scope.userForm.dob.year},
            function (data, status) {
                if (data.success) {
                    $scope.userForm.dob.error = false;
                    $scope.updateUser();
                } else {
                    $scope.userForm.dob.error = data.errors.date_of_birth;
                }
            });
    };

    $scope.saveGender = function () {
        APIService.put(
            urls.userDetails.replace(":id", AuthService.user.user_id),
            {gender: $scope.userForm.gender},
            function (data, status) {
                if (data.success) {
                    $scope.updateUser();
                }
            });
    };

    $scope.uploadAvatar = function () {
        if ($scope.uploadResult.previewReady) {
            APIService.put(urls.userDetails.replace(":id", AuthService.user.user_id) + "?full=true", {avatar: $scope.uploadResult.id}, function (data, status) {
                if (data.success) {
                    $templateCache.removeAll();
                    $scope.user.avatar_big = data.user.avatar_big + "?v=fuckyoucache" + Math.random();
                    $scope.user.avatar = data.user.avatar + "?v=fuckyoucache" + Math.random();

                    angular.element('#photoModal').modal('hide');
                    $scope.clearAvatar();
                }
            })
        }
    };

    $scope.createKnowledge = function () {
        if ($scope.topicPreSave['knowledge'] != null) {
            $scope.createUserTopic($scope.topicPreSave['knowledge'], 'K');
        }
    };

    $scope.createLocations = function () {
        if ($scope.topicPreSave['locations'] != null) {
            $scope.createUserTopic($scope.topicPreSave['locations'], 'L');
        }
    };

    $scope.createEducation = function () {
        if ($scope.topicPreSave['education'] != null) {
            $scope.createUserTopic($scope.topicPreSave['education'], 'E');
        }
    };

    $scope.createEmployment = function () {
        if ($scope.topicPreSave['employment'] != null) {
            $scope.createUserTopic($scope.topicPreSave['employment'], 'J');
        }
    };

    $scope.createInterests = function () {
        if ($scope.topicPreSave['interests'] != null) {
            $scope.createUserTopic($scope.topicPreSave['interests'], 'I');
        }
    };

    $scope.createUserTopic = function (topic, group) {
        APIService.post(urls.userTopicsList.replace(":id", AuthService.user.user_id), {
            topic: topic.id,
            group: group
        }, function (data, status) {
            if (status == 201) {
                $scope.updateUser();
            }
        })
    };

    $scope.getFollowers = function () {
        APIService.get(urls.userFollowers.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.followers = data.followers;
        });
    };

    $scope.getFollowing = function () {
        APIService.get(urls.userFollowing.replace(":id", AuthService.user.user_id), {}, function (data, status) {
            $scope.following = data.following;
        });
    };

    $("#photoModal").on('click', '#browse', function () {
        $('#uploader').trigger('click');
    });

    $scope.isSelf = function () {
        return $scope.user.user_id == AuthService.user.user_id;
    };

    $scope.updateUser();
    $scope.getFollowers();
    $scope.getFollowing();
    $scope.getSimilar();
    $rootScope.intervals.push($interval($scope.updateUser, 40000));
});

app.controller('CertificationController', function ($scope, AuthService, APIService, $routeParams, $anchorScroll) {

    $scope.files = [];
    $scope.showSuccess = false;
    $scope.certificationToResubmit = null;
    $scope.showError = false;
    $scope.certifications = [];
    $scope.expertiseDescription = "";
    $scope.file = {};//Модель
    $scope.options = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                $scope.files.push({name: $scope.file.filename, id: $scope.file.tmp_media.id})
            })
        }
    };
    $scope.topics = [];
    $scope.topicsSearch = "";
    $scope.topicToAdd = null;
    $scope.stopSearch = false;
    $scope.topicsSearchResult = [];
    $scope.sortingOn = false;
    $scope.hideResubmit = false;


    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", AuthService.user.user_id), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
            }
        })
    };


    if (typeof $routeParams.id != "undefined") {
        APIService.get(urls.userCertificationsDetail.replace(":id", AuthService.user.user_id).replace(":cert_id", $routeParams.id), {}, function (data, status) {
            $scope.certificationToResubmit = data.certification;
            $scope.expertiseDescription = $scope.certificationToResubmit.description;
            $scope.topics.push($scope.certificationToResubmit.topic);
            $("#browse").click(function () {
                $("#uploader").trigger('click');
            })
        })
    }

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

    $scope.updateCertifications = function (order_by) {
        var filter = {};
        if (typeof order_by != "undefined") {
            filter = {
                order_by: order_by
            };
            $scope.sortingOn = true;
        }
        APIService.get(urls.userCertifications.replace(":id", AuthService.user.user_id), filter, function (data, status) {
            if (data.success)
                $scope.certifications = data.certifications;
        });
    };

    $scope.prepareTopic = function (topic) {
        $scope.topicToAdd = topic;
        $scope.topicsSearch = topic.name;
        $scope.topicsSearchResult = [];
        $scope.stopSearch = true;
    };

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

    $scope.addTopicToList = function () {
        if (!$scope.inList($scope.topicToAdd, $scope.questionTopics)) {
            if ($scope.topicToAdd !== null) {
                $scope.topicsSearchResult = [];
                $scope.topics.push($scope.topicToAdd);
                $scope.topicToAdd = null;
                $scope.topicsSearch = "";
            } else {
                APIService.post(urls.topicsList, {name: $scope.topicsSearch}, function (data, status) {
                    if (data.success) {
                        $scope.topics.push(data.topic);
                        $scope.topicsSearch = "";
                    }
                });
            }
        }
    };

    $scope.removeTopic = function (topic) {
        var index = $scope.topics.indexOf(topic);

        if (index > -1) {
            $scope.topics.splice(index, 1)
        }
    };

    $scope.removeFile = function (file) {
        var index = $scope.files.indexOf(file);
        $scope.files.splice(index, 1);
    };

    $scope.uploadCertifications = function () {
        var topicIDs = [];
        for (var i in $scope.topics) {
            topicIDs.push($scope.topics[i].id);
        }
        APIService.post(urls.userCertifications.replace(":id", AuthService.user.user_id), {
            topics: topicIDs,
            docs: $scope.files,
            description: $scope.expertiseDescription
        }, function (data, success) {
            if (data.success) {
                $scope.showSuccess = true;
                $scope.topicToAdd = null;
                $scope.topics = [];
                $scope.files = [];
                $scope.expertiseDescription = "";
                $anchorScroll();
            }
            else {
                $scope.showError = true;
                $anchorScroll();
            }
            angular.element("body")[0].scrollTop = 0;
            $scope.updateCertifications();
        });
    };

    $scope.removeCertification = function (certificationId) {
        APIService.remove(urls.userCertificationsDetail.replace(":id", AuthService.user.user_id).replace(":cert_id", certificationId), {}, function (data, status) {
            newCertificationList = []
            angular.forEach($scope.certifications, function (value, key) {
                console.log(value);
                if (value.id != certificationId) {
                    newCertificationList.push(value)
                }
            });
            $scope.certifications = newCertificationList;
        })
    };

    $scope.updateUser();
    $scope.updateCertifications();
    $("#browse").click(function () {
        $("#uploader").trigger('click');
    })
});

app.controller('GeneralSettingsController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {


    $scope.old_password = '';
    $scope.new_password = '';
    $scope.repeat_password = '';
    $scope.valid_password_result = '';
    $scope.user = AuthService.user;
    $scope.email = "";


    $scope.changePassword = function () {
        var old_password = $scope.old_password;
        var new_password = $scope.new_password;
        var repeat_password = $scope.repeat_password;

        $scope.password_error = {'status': false};

        if (old_password == '') {
            $scope.old_password_error = true;
        }

        function validate(password) {
            var upper = /[A-Z]/,
                lower = /[a-z]/,
                number = /[0-9]/,
                special = /[^A-Za-z0-9]/,
                count = 0;

            if (password.length >= 6) {
                // Only need 3 out of 4 of these to match
                if (upper.test(password)) count++;
                if (lower.test(password)) count++;
                if (number.test(password)) count++;
                if (special.test(password)) count++;
            }
            return count;
        }

        if (validate(new_password) < 4) {
            $scope.password_error.status = true;
            $scope.password_error.message = 'New password not valid!'
        }
        else {
            if (new_password == repeat_password) {

                APIService.put(urls.userChangePassword, {
                    new_password: new_password,
                    repeat_password: repeat_password,
                    old_password: old_password
                }, function (data, status) {
                    if (data.success) {
                        $scope.change_password_result = true;
                    }
                    else {
                        $scope.password_error.status = true;
                        $scope.password_error.message = 'Old password not valid!'
                    }
                })
            }
            else {
                $scope.password_error.status = true;
                $scope.password_error.message = 'Confirm password not valid!'
            }
        }

    };

    $scope.changeEmail = function () {
        var pattern = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        if ($scope.email.match(pattern)) {
            APIService.post(urls.userChangeEmail, {email: $scope.email}, function (data, status) {
                if (status == 200) {
                    $scope.changedEmailSuccess = true;
                }
                else {
                    $scope.changedEmailError = true;
                    $scope.changedEmailErrorMessage = data.errors.email[0];
                }
            })
        }
        else {
            $scope.changedEmailError = true;
            $scope.changedEmailErrorMessage = 'Email field not valid';
        }

    };

    $scope.userSetTimeSettings = function (time) {
        APIService.get(urls.userSetTimeSettings, {time: time}, function (data, status) {
            if (status == 200) {
                console.log(data);
                AuthService.init()
            }
        });
    };


});

app.controller('StatementEarningsController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {
    $scope.transactionsHistory = [];
    $scope.earnGrouping = 'week';
    $scope.currentGroupingTitle = 'Weekly';
    $scope.startDate = "";
    $scope.endDate = "";

    //$("#start-date").datepicker("destroy");
    //$("#start-date").removeClass("hasDatepicker");
    //$("#end-date").datepicker("destroy");
    //$("#end-date").removeClass("hasDatepicker");


    $("#start-date").datepicker({
        maxDate: 0,
        onClose: function (selectedDate) {

            $("#end-date").datepicker("option", "minDate", selectedDate);
        }
    });


    $("#end-date").datepicker({
        maxDate: 0,
        onClose: function (selectedDate) {
            if (selectedDate != "") {
                $("#start-date").datepicker("option", "maxDate", selectedDate);
            }
        }
    });


    $scope.selectTransGrouping = function (groupName, title) {
        $scope.earnGrouping = groupName;
        $scope.currentGroupingTitle = title;
    };

    $scope.earningsUserSummary = function () {

        APIService.get(urls.earningsUserSummary.replace(":user_id", $scope.user.user_id), {
            earnGrouping: $scope.earnGrouping,
            start_date: $scope.startDate,
            end_date: $scope.endDate
        }, function (data, status) {
            if (status == 200) {
                $scope.transactionsHistory = data["data"];
            }
        });
    };
    $scope.earningsUserSummary();

});

app.controller('StatementTransactionsController', function ($scope, $routeParams, APIService, $interval, $http, AuthService) {
    $scope.transactionsHistory = [];
    $scope.transGrouping = 'week';
    $scope.currentGroupingTitle = 'Weekly';
    $scope.startDate = "";
    $scope.endDate = "";


    $scope.selectTransGrouping = function (groupName, title) {
        $scope.transGrouping = groupName;
        $scope.currentGroupingTitle = title;
    };

    $scope.transactionsUserSummary = function () {


        APIService.get(urls.transactionsUserSummary.replace(":user_id", $scope.user.user_id), {
            transGrouping: $scope.transGrouping,
            start_date: $scope.startDate,
            end_date: $scope.endDate
        }, function (data, status) {
            if (status == 200) {
                console.log(data);
                $scope.transactionsHistory = data["data"];
            }
        });
    };
    $scope.transactionsUserSummary();

});

app.controller('NotificationsController', function ($scope, $routeParams, APIService, $interval, $http, AuthService, $location) {
    $scope.notifications = [];

    $scope.checkNotification = function (notification, $event) {
        $event.stopPropagation();
        var link = notification.link;
        APIService.remove(urls.usersNotificationsDetail.replace(":id", notification.id), {}, function (data, status) {
            $location.path(link);
        })
    };

    $scope.readNotifications = function (notifications) {
        for (var i in notifications) {
            APIService.put(urls.usersNotificationsDetail.replace(":id", notifications[i].id), {read: true}, function (data, status) {
                console.log(notifications[i].id + " read;");
            });
        }
    };

    $scope.getNotifications = function () {

        APIService.get(urls.usersNotifications, {}, function (data, status) {
            if (status == 200) {
                $scope.notifications = data["notifications"];
                $scope.readNotifications($scope.notifications);
            }
        });
    };
    $scope.getNotifications();

});
