app.controller('ConversationsController', function ($scope, AuthService, APIService, $rootScope, $interval) {

    $scope.chatList = [];
    $scope.chatExpertList = [];
    $scope.loggedUser = AuthService.user;

    $scope.detectUsers = function () {
        for (var i in $scope.chatList) {
            for (var j in $scope.chatList[i].users) {
                if ($scope.chatList[i].users[j].user_id != $scope.loggedUser.user_id) {
                    $scope.chatList[i].to_user = $scope.chatList[i].users[j];
                }
            }
        }
        console.log($scope.chatList);
    };

    $scope.getChatList = function () {
        APIService.get(urls.chatsList.replace(":user_id", AuthService.user.user_id), {}, function (data, status) {
            console.log("Chat list loading...");
            $scope.chatList = data.chats;
            $scope.detectUsers()
        });
    };

    $scope.getExpertList = function () {
        APIService.get(urls.usersList, {"is_expert": true}, function (data, status) {
            $scope.chatExpertList = data.items
        });
    };

    $scope.getExpertList();
    $scope.getChatList();
    $rootScope.intervals.push($interval($scope.getChatList, 20000));
    $rootScope.intervals.push($interval($scope.getExpertList, 20000));
});

app.controller('ConversationsFavoritesController', function ($scope, AuthService, APIService, $interval, $rootScope) {

    $scope.chatExpertList = [];
    $scope.chatFavoritesList = [];
    $scope.loggedUser = AuthService.user;

    $scope.detectUsers = function () {
        for (var i in $scope.chatFavoritesList) {
            for (var j in $scope.chatFavoritesList[i].chat.users) {
                if ($scope.chatFavoritesList[i].chat.users[j].user_id != $scope.loggedUser.user_id) {
                    $scope.chatFavoritesList[i].chat.to_user = $scope.chatFavoritesList[i].chat.users[j];
                }
            }
        }
        console.log($scope.chatFavoritesList);
    };

    $scope.getChatFavoriteList = function () {
        APIService.get(urls.chatsFavorite, {}, function (data, status) {
            $scope.chatFavoritesList = data.objects;
            $scope.detectUsers();
        });
    };

    $scope.getExpertList = function () {
        APIService.get(urls.usersList, {"is_expert": true}, function (data, status) {
            $scope.chatExpertList = data.items
        });
    };

    $scope.getExpertList();
    $scope.getChatFavoriteList();

    $rootScope.intervals.push($interval($scope.getChatFavoriteList, 20000));
    $rootScope.intervals.push($interval($scope.getExpertList, 20000));

});

app.controller('ChatController', function ($scope, AuthService, APIService, $routeParams, chatSocket, $timeout, $location, $rootScope, $interval) {
    var userID = $routeParams.id;

    $scope.user = {};
    $scope.chat = null;
    $scope.isExpanded = false;
    $scope.isTyping = false;
    $scope.maxCharacters = 160;
    $scope.lettersCount = 160;
    $scope.message = "";
    $scope.messages = [];
    $scope.errorForm = false;
    $scope.paidChat = true;
    $scope.isTypingTimeout = null;
    $scope.loggedUser = AuthService.user;
    $scope.previewingImage = {};
    $scope.previousDate = null;
    $scope.nextPage = 2;
    $scope.file = {};
    $scope.uploadResult = {};
    $scope.previousLength = 0;
    $scope.showLoading = false;
    $scope.animationStepNumber = 1;

    $scope.tmpMediaID = null;
    $scope.options = {
        fieldName: "file",
        change: function (file) {
            file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                $scope.uploadResult.url = data.data.tmp_media.file;
                $scope.uploadResult.previewReady = true;
                $scope.tmpMediaID = data.data.tmp_media.id;
            });
        }
    };

    $scope.animationStep = function () {
        if ($scope.animationStepNumber == 3) {
            $scope.animationStepNumber = 1;
            return;
        }
        $scope.animationStepNumber += 1;
    };

    $rootScope.intervals.push($interval($scope.animationStep, 500));

    $scope.clearPhoto = function () {
        $scope.uploadResult = {};
        $scope.file = {};
        $scope.tmpMediaID = null;
        $scope.options = {
            fieldName: "file",
            change: function (file) {
                file.$upload("/api/tmp_media", $scope.file).then(function (data) {
                    $scope.uploadResult.url = data.data.tmp_media.file;
                    $scope.uploadResult.previewReady = true;
                    $scope.tmpMediaID = data.data.tmp_media.id;
                });
            }
        };
    };

    $scope.$on("$destroy", function(){
        chatSocket.disconnect();
    });

    $scope.preview = function (message) {
        $scope.previewingImage.url = message.attachment;
        $("#previewModal").modal("show");
    };

    $scope.approveImage = function () {
        $("#photoModal").modal("hide");
        $scope.uploadResult.attachmentApproved = true;
    };

    $("#browse").click(function () {
        $("#uploader").trigger("click")
    });

    $('.chat-content').scroll(function () {
        if ($('.chat-content').scrollTop() == 0) {
            $scope.showLoading = true;
            $scope.loadMore();
        }
    });

    $scope.loadMore = function () {
        APIService.get(urls.messagesList.replace(":id", $scope.chat.id), {pages: $scope.nextPage}, function (data, status) {
            console.log("Response is here...");
            if (data.success) {
                console.log("Here we are my darling messages...");
                $scope.messages = data.messages;
                $scope.showLoading = false;
                if ($scope.previousLength < data.messages.length) {
                    $scope.nextPage += 1;
                    $scope.previousLength = data.messages.length;
                }
            }

        })
    };


    $scope.loadChat = function () {
        chatSocket.emit('get_chat', $scope.user, $scope.loggedUser);
    };

    $scope.joinToRoom = function () {
        var roomName = $scope.chat.id + '_room';
        chatSocket.emit('join', roomName, $scope.user.username, $scope.loggedUser.user_id)
    };

    $scope.updateUser = function () {
        APIService.get(urls.userDetails.replace(":id", userID), {full: true}, function (data, status) {
            if (data.success) {
                $scope.user = data.user;
                $scope.loadChat();

            }
        })
    };



    $scope.loadMessages = function () {
        console.log("Loading messages...");
        APIService.get(urls.messagesList.replace(":id", $scope.chat.id), {}, function (data, status) {
            console.log("Response is here...");
            if (data.success) {
                console.log("Here we are my darling messages...");
                $scope.messages = data.messages;
                $scope.previousLength = data.messages.length;
                angular.element(".chat-content").animate({scrollTop: angular.element(".chat-content").height()});
            }
        })
    };

    $scope.showDate = function (message) {
        var date = message.year + "/" + message.day + "/" + message.month;
        if (date != $scope.previousDate) {
            $scope.previousDate = date;
            return true;
        } else {
            return false;
        }
    };

    $scope.$watch("message", function (newValue, oldValue) {
        if (newValue != oldValue) {
            chatSocket.emit('type');
            $scope.lettersCount = $scope.maxCharacters - $scope.message.length;
            if ($scope.lettersCount < 0) {
                $scope.errorForm = true;
            } else {
                $scope.errorForm = false;
            }
        }
    });

    $scope.$on("chat:is_typing", function (ev, data) {
        $timeout.cancel($scope.isTypingTimeout);
        $scope.isTyping = true;
        $scope.isTypingTimeout = $timeout(function () {
            $scope.isTyping = false;
        }, 1500)

    });

    $scope.$on('chat:chat_loaded', function (ev, data) {
        console.log("Loading chat...");
        $scope.chat = data;
        for (var i in $scope.chat.users) {
            if ($scope.chat.users[i].user_id != $scope.loggedUser.user_id) {
                $scope.chat.other_user = $scope.chat.users[i];
            } else {
                $scope.chat.user = $scope.chat.users[i];
            }
        }
        $scope.joinToRoom();
        $scope.loadMessages();


        chatSocket.emit("read", $scope.chat.id, $scope.chat.other_user.user_id);

    });

    $scope.$on("chat:msg_to_room", function (ev, nickname, message) {
        $scope.messages.push(message);

        chatSocket.emit("read", $scope.chat.id, $scope.chat.other_user.user_id);

    });

    $scope.$on("chat:update_messages", function (ev) {
        $scope.loadMessages();
    });

    $scope.$on("chat:all_is_read", function (ev) {
        for (var i in $scope.messages) {
            if ($scope.messages[i].unread) {
                $scope.messages[i].unread = false;
            }
        }
    });

    $scope.newMessage = function () {
        chatSocket.emit("user_message", $scope.message, $scope.user.user_id, $scope.loggedUser.user_id, $scope.chat.id, $scope.tmpMediaID);
        $scope.message = "";
        $scope.clearPhoto()
    };

    $scope.followUser = function () {
        APIService.post(urls.followUser.replace(":id", $scope.user.user_id), {}, function (data, status) {
            if (status == 200) {
                $scope.user.num_followers = data.followers;
                $scope.user.is_following = true;
            }
        });
    };

    $scope.unfollowUser = function () {
        APIService.remove(urls.followUser.replace(":id", $scope.user.user_id), {}, function (data, status) {
            if (status == 204) {
                $scope.user.num_followers -= 1;
                $scope.user.is_following = false;
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

    $scope.closeChat = function () {
        APIService.get(urls.closeChat.replace(":chat_id", $scope.chat.id), {}, function (data, status) {
            $location.path("/conversations");
        })
    };

    $scope.blockUser = function () {
        APIService.post(urls.blockChat.replace(":other_user_id", $scope.user.user_id), {}, function (data, status) {
            if (data.success)
                $scope.chat.is_block = true;
        })
    };

    $scope.unblockUser = function () {
        APIService.post(urls.unblockChat.replace(":other_user_id", $scope.user.user_id), {}, function (data, status) {
            if (data.success)
                $scope.chat.is_block = false;
        })
    };

    $scope.favoriteUser = function () {
        APIService.post(urls.chatsFavorite, {chat_id: $scope.chat.id}, function (data, status) {
            if (data.success)
                $scope.chat.is_important = true;
        })
    };

    $scope.unfavoriteUser = function () {
        APIService.remove(urls.chatsFavorite, {chat_id: $scope.chat.id}, function (data, status) {
            $scope.chat.is_important = false;
        })
    };

    $scope.addToFree = function () {
        APIService.post(urls.freeUser.replace(":id", userID), {}, function (data, status) {
            if (data.success)
                $scope.chat.is_free = true;
        })
    };

    $scope.removeFromFree = function () {
        APIService.remove(urls.freeUser.replace(":id", userID), {}, function (data, status) {
            $scope.chat.is_free = false;
        })
    };

    $scope.addZero = function (minutes) {
        if (minutes.toString().length == 1) {
            return "0" + minutes;
        } else {
            return minutes;
        }
    };

    $scope.toAMPM = function (hours) {
        var isPm = hours > 12;

        if (isPm) {
            hours = hours - 12;
            return "PM " + hours;
        } else {
            return "AM " + hours;
        }
    };

    $scope.getTime = function (message) {
        var minutes = $scope.addZero(message.minutes);
        var hours = message.hours;

        if ($scope.loggedUser.time_settings) {
            return hours + ":" + minutes
        } else {
            return $scope.toAMPM(hours) + ":" + minutes
        }
    };

    $scope.updateUser();

});

app.controller('ChatSettingsController', function ($scope, AuthService, APIService) {
    $scope.messageCost = 0;
    $scope.currentUserId = AuthService.user.user_id;
    $scope.costHistory = [];
    $scope.newCost = 0;
    $scope.commission = 0;
    $scope.history = [];
    $scope.chats = [];
    $scope.error = "";
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.parseInt = parseInt;

    $scope.getMessageCost = function () {
        APIService.get(urls.msgCost.replace(":id", $scope.currentUserId), {}, function (data, status) {
            $scope.messageCost = data.cost;
            $scope.commission = data.commission;
            $scope.history = data.history;
        });
    };

    $scope.closeAllChats = function () {
        APIService.get(urls.chatsList.replace(":user_id", $scope.currentUserId), {}, function (data, status) {
            $scope.chats = data.messages;
            for (var i in $scope.chats) {
                APIService.get(urls.closeChat.replace(":other_user_id", $scope.chats[i].to_user.user_id), {}, function (data, status) {

                });
            }
        });
    };

    $scope.$watch("newCost", function (oldValue, newValue) {
        if (oldValue != newValue) {
            $scope.messageCost = $scope.newCost;
        }
    });

    $scope.setNewCost = function (newCost) {
        $scope.newCost = newCost;
    };

    $(".cost-input").click(function (event) {
        event.stopPropagation();
    });

    $scope.updateMessageCost = function () {
        APIService.put(urls.msgCost.replace(":id", $scope.currentUserId), {cost: parseInt($scope.newCost)}, function (data, status) {
            if (status == 200) {
                $scope.messageCost = data.cost;
                $scope.commission = data.commission;
                $scope.history = data.history;
                $scope.showSuccess = true;
            } else {
                $scope.showError = true;
                $scope.error = data.error;
            }
        });
    };

    $scope.getMessageCost();
});
