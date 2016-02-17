app.directive('checkUser', ['$rootScope', '$location', 'userSrv', function ($root, $location, userSrv) {
    return {
        link: function (scope, elem, attrs, ctrl) {
            $root.$on('$routeChangeStart', function (event, currRoute, prevRoute) {
                if (userSrv.isLogged) {
                    return
                }
                if (prevRoute.access.guest == undefined) {
                    return
                }
                if (prevRoute.access.guest == false) {
                    return
                }
            });
        }
    }
}]);

app.directive('setOnlineOnClick', function (APIService, AuthService) {
    return function (scope, element, attrs) {
        function process() {
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
        }

        process(); // run immediately
        element.bind('click', process)
    }
});

app.directive('serverError', function () {
    /*
     This directive should be applied to all elements of a form that will be validated on the server.
     The server response handler should do $setValidity('server', false) on the elements with error,
     and this directive will clear the invalid state on focus, so that the form can be re-submmitted.
     See /contact (contact form) for example usage
     */
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, element, attrs, ctrl) {
            element.on('focus', function () {
                scope.$apply(function () {
                    ctrl.$setValidity('server', true)
                })
            })
        }
    }
})

app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.directive('focusMe', function ($timeout) {
    return {
        //scope: true,   // optionally create a child scope
        link: function (scope, element, attrs) {
            scope.$watch(attrs.focusMe, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus()
                    }, 100);
                }
            });
        }
    };
});

app.directive('infiniteScroll', ['$rootScope', '$window', '$timeout', function ($rootScope, $window, $timeout) {
    return {
        link: function (scope, elem, attrs) {
            var raw = elem[0];
            elem.bind('scroll', function () {
                if (raw.scrollTop + raw.offsetHeight + 100 >= raw.scrollHeight) {
                    scope.$apply(attrs.infiniteScroll);
                }
            });
        }
    };
}]);

app.directive("scrollBottom", function ($timeout) {
    return {
        link: function (scope, element, attr) {
            el = document.getElementById("content-main")
            $(element).on("focus", function () {
                $timeout(function () {
                    el.scrollTop = el.scrollHeight;
                }, 500);
            });
        }
    }
});

app.directive('numbersAndLetters', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            var validator = function (value) {
                var new_value = value.replace(/[^a-zA-Z0-9/-]*/g, '')
                if (new_value != value) {
                    ctrl.$setViewValue(new_value);
                    ctrl.$render();
                }
                return new_value
            }
            ctrl.$parsers.push(validator);
        }
    };
});

app.directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            var validator = function (value) {
                if (!value)
                    return value
                var new_value = value.replace(/[^0-9]*/g, '')
                if (new_value != value) {
                    ctrl.$setViewValue(new_value);
                    ctrl.$render();
                }
                return new_value
            }
            ctrl.$parsers.push(validator);
        }
    };
});

app.directive('banlist', ['APIService', function (APIService) {
    return {
        require: 'ngModel',
        link: function (scope, elem, attr, ngModel) {
            scope.$watch(attr.ngModel, function (value) {
                scope.editing.pendingResponse += 1;
                APIService.call('/validate-tag', {tag: ngModel.$modelValue}, function (data, status) {
                    if (data.success === true) {
                        ngModel.$setValidity('banlist', true);
                    }
                    else {
                        ngModel.$setValidity('banlist', false);
                    }
                    scope.editing.pendingResponse -= 1;
                    return value;
                }, false)
            });
        }
    };
}]);

app.directive('checkEmptyProfile', ['AuthService', function (AuthService) {
    return {
        link: function (scope, elem, attrs) {
            angular.element(elem).bind('click', function (event) {
                user = scope.u
                if (user.profile_filled === false && AuthService.user.user_id != user.user_id) {
                    console.log('This profile is not filled.');
                    event.preventDefault();
                }
            });
        }
    }
}])

app.directive('file', function ($window) {
    return {
        restrict: 'E',
        template: '<input type="file" />',
        replace: true,
        require: 'ngModel',
        link: function (scope, elem, attr, ctrl) {
            angular.element(elem).bind('change', function (event) {
                var file, img, width, height, up_id, _URL;
                _URL = scope.$window.URL || scope.$window.webkitURL;
                up_id = attr.imageName
                if (elem[0].files != 'undefined' && (file = elem[0].files[0])) {
                    if (file.size > 5242880) { // 5mb limit
                        NoticeService.addError("Images are limited to max 5mb")
                        return;
                    }
                    img = new Image();
                    img.onerror = function () {
                        alert("Not a valid file type: " + file.type);
                    };
                    img.src = _URL.createObjectURL(file);
                    scope.uploaded_image[up_id] = img.src;
                    scope.editing[up_id] = true
                }
                scope.$apply(function () {
                    attr.multiple ? ctrl.$setViewValue(elem[0].files) : ctrl.$setViewValue(elem[0].files[0]);
                });
            });
        }
    }
});

app.directive('selectOnClick', function () {
    // Linker function
    return function (scope, element, attrs) {
        element.bind('click', function () {
            this.select();
        });
    };
});

app.directive('ngKeepScroll', function ($timeout) {
    return function (scope, element, attrs) {
        //load scroll position after everything has rendered
        $timeout(function () {
            var scrollY = parseInt(scope.$eval(attrs.ngKeepScroll));
            element.scrollTop(scrollY ? scrollY : 0);
        }, 0);

        //save scroll position on change
        scope.$on("$routeChangeStart", function () {
            scope.$eval(attrs.ngKeepScroll + " = " + element.scrollTop());
        });
    }
});


app.directive('googleplace', function () {
    return {
        scope: {
            googleplace: '&'
        },
        link: function (scope, element, attrs) {
            var options = {
                types: ['(cities)']
            };
            scope.gPlace = new google.maps.places.Autocomplete(element[0], options);
            google.maps.event.addListener(scope.gPlace, 'place_changed', function () {
                console.log("Place changed")
                var place = scope.gPlace.getPlace();
                scope.$apply(scope.googleplace({place: place}))
            });
        }
    };
});

app.directive('slider', function ($parse) {
    return {
        restrict: 'E',
        replace: true,
        template: '<input type="text" />',
        link: function ($scope, element, attrs) {
            var model = $parse(attrs.model);
            var slider = $(element[0]).slider();

            slider.on('slide', function (ev) {
                model.assign($scope, ev.value);
                $scope.$apply();
            });
        }
    }
});


app.directive('autoGrow', function () {
    return {
        require: 'ngModel',

        link: function (scope, element, attr, ngModel) {
            var minHeight = element[0].offsetHeight,
                paddingLeft = element.css('paddingLeft'),
                paddingRight = element.css('paddingRight');

            var $shadow = angular.element('<div></div>').css({
                position: 'absolute',
                top: -10000,
                left: -10000,
                width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
                fontSize: element.css('fontSize'),
                fontFamily: element.css('fontFamily'),
                lineHeight: element.css('lineHeight'),
                resize: 'none'
            });
            angular.element(document.body).append($shadow);

            var update = function () {
                var times = function (string, number) {
                    for (var i = 0, r = ''; i < number; i++) {
                        r += string;
                    }
                    return r;
                }

                var val = element.val().replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/&/g, '&amp;')
                    .replace(/\n$/, '<br/>&nbsp;')
                    .replace(/\n/g, '<br/>')
                    .replace(/\s{2,}/g, function (space) {
                        return times('&nbsp;', space.length - 1) + ' '
                    });
                $shadow.html(val);

                element.css('height', Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + 'px');
            }

            if (attr.ngModel) {
                // update when the model changes
                scope.$watch(attr.ngModel, update);
            }

            scope.$on('$destroy', function () {
                $shadow.remove();
            });

            element.bind('keyup keydown keypress change', update);
            update();
        }
    }
});

app.directive('syncFocusWith', function ($timeout, $rootScope, OnResizeService) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
        link: function ($scope, $element, attrs) {
            $scope.$watch("focusValue", function (currentValue, previousValue) {
                if (currentValue) {
                    $element[0].focus()
                } else {
                    $element[0].blur();
                }
            })
        }
    }
});

app.directive('bsSwitch', function ($timeout) {
    return {
        restrict: 'EA',
        require: 'ngModel',
        scope: {
            switchActive: '@',
            switchOnText: '@',    // changed name
            switchOffText: '@',   // changed name
            switchOnColor: '@',   // changed name
            switchOffColor: '@',  // changed name
            switchAnimate: '@',
            switchSize: '@',
            switchLabel: '@',
            switchIcon: '@',      // changed behaviour
            switchWrapper: '@'    // container class modifier
        },
        template: function (tElement) {
            return ('' + tElement.nodeName).toLowerCase() === 'input' ? undefined : '<input>';
        },
        replace: true,
        link: function link(scope, element, attrs, controller) {

            /**
             * Listen to model changes.
             */
            var listenToModel = function () {
                // When the model changes
                controller.$formatters.push(function (newValue) {
                    if (newValue !== undefined) {
                        $timeout(function () {
                            element.bootstrapSwitch('state', newValue || false, true);
                        });
                    }
                });

                scope.$watch('switchActive', function (newValue) {
                    var active = newValue === true || newValue === 'true' || !newValue;
                    element.bootstrapSwitch('disabled', !active);
                });

                scope.$watch('switchOnText', function (newValue) {
                    element.bootstrapSwitch('onText', getValueOrUndefined(newValue));
                });

                scope.$watch('switchOffText', function (newValue) {
                    element.bootstrapSwitch('offText', getValueOrUndefined(newValue));
                });

                scope.$watch('switchOnColor', function (newValue) {
                    attrs.dataOn = newValue;
                    element.bootstrapSwitch('onColor', getValueOrUndefined(newValue));
                });

                scope.$watch('switchOffColor', function (newValue) {
                    attrs.dataOff = newValue;
                    element.bootstrapSwitch('offColor', getValueOrUndefined(newValue));
                });

                scope.$watch('switchAnimate', function (newValue) {
                    element.bootstrapSwitch('animate', scope.$eval(newValue || 'true'));
                });

                scope.$watch('switchSize', function (newValue) {
                    element.bootstrapSwitch('size', newValue);
                });

                scope.$watch('switchLabel', function (newValue) {
                    element.bootstrapSwitch('labelText', newValue ? newValue : '&nbsp;');
                });

                scope.$watch('switchIcon', function (newValue) {
                    if (newValue) {
                        // build and set the new span
                        var spanClass = '<span class=\'' + newValue + '\'></span>';
                        element.bootstrapSwitch('labelText', spanClass);
                    }
                });

                scope.$watch('switchWrapper', function (newValue) {
                    // Make sure that newValue is not empty, otherwise default to null
                    if (!newValue) {
                        newValue = null;
                    }
                    element.bootstrapSwitch('wrapperClass', newValue);
                });
            };

            /**
             * Listen to view changes.
             */
            var listenToView = function () {
                // When the switch is clicked, set its value into the ngModelController's $viewValue
                element.on('switchChange.bootstrapSwitch', function (e, data) {
                    scope.$apply(function () {
                        controller.$setViewValue(data);
                    });
                });
            };

            /**
             * Returns the value if it is truthy, or undefined.
             *
             * @param value The value to check.
             * @returns the original value if it is truthy, {@link undefined} otherwise.
             */
            var getValueOrUndefined = function (value) {
                return (value ? value : undefined);
            };

            // Listen and respond to model changes
            listenToModel();

            // Bootstrap the switch plugin
            element.bootstrapSwitch();

            // Listen and respond to view changes
            listenToView();

            // Delay the setting of the state
            $timeout(function () {
                element.bootstrapSwitch('state', controller.$modelValue || false, true);
            });

            // On destroy, collect ya garbage
            scope.$on('$destroy', function () {
                element.bootstrapSwitch('destroy');
            });

        }
    };
});

app.directive('editor', function () {

    return {
        restrict: 'E',
        templateUrl: '/app/partials/directives/editor.html',
        replace: true,
        scope: {
            editorModel: '=',
            id: '=',
            options: '=',
            uploadResult: '=',
            init: '='
        },

        link: function ($scope, el, attrs) {

            $scope.$watch('uploadResult.previewReady', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    el.find('.content').focus();
                    if (newValue)
                        document.execCommand('insertImage', false, $scope.uploadResult.url);
                    $scope.uploadResult.previewReady = false;
                }
            });

            function bindStateWatchers() {
                el.find('.content').on('click', function () {
                    if (document.queryCommandState('bold'))
                        $('.editor-bold').addClass('active');
                    else
                        $('.editor-bold').removeClass('active');
                });
                el.find('.content').on('click', function () {
                    if (document.queryCommandState('italic'))
                        $('.editor-italic').addClass('active');
                    else
                        $('.editor-italic').removeClass('active');
                });
                el.find('.content').on('click', function () {
                    if (document.queryCommandState('insertOrderedList'))
                        $('.editor-list-ol').addClass('active');
                    else
                        $('.editor-list-ol').removeClass('active');
                });
                el.find('.content').on('click', function () {
                    if (document.queryCommandState('insertUnorderedList'))
                        $('.editor-list-ul').addClass('active');
                    else
                        $('.editor-list-ul').removeClass('active');
                });
                el.find('.content').on('click', function () {
                    if (document.queryCommandValue('formatBlock') == 'blockquote')
                        $('.editor-blockquote').addClass('active');
                    else
                        $('.editor-blockquote').removeClass('active');
                });
                el.find('.content').on('click', function () {
                    if (document.queryCommandState('underline'))
                        $('.editor-underline').addClass('active');
                    else
                        $('.editor-underline').removeClass('active');
                });
            }

            bindStateWatchers();


            el.find('.content').on('input', function () {
                if (document.queryCommandState('insertUnorderedList'))
                    $('.editor-list-ul').addClass('active');
                else
                    $('.editor-list-ul').removeClass('active');

                if (document.queryCommandState('insertOrderedList'))
                    $('.editor-list-ol').addClass('active');
                else
                    $('.editor-list-ol').removeClass('active');
            });
            el.find('.editor-bold').click(function () {
                $(this).toggleClass('active');
                document.execCommand('bold', false, null);
            });
            el.find('.editor-italic').click(function () {
                $(this).toggleClass('active');
                document.execCommand('italic', false, null);
            });
            el.find('.editor-underline').click(function () {
                $(this).toggleClass('active');
                document.execCommand('underline', false, null);
            });
            el.find('.editor-blockquote').click(function () {
                $(this).toggleClass('active');
                document.execCommand('formatBlock', false, 'blockquote');
            });
            el.find('.editor-list-ol').click(function () {
                $(this).toggleClass('active');
                document.execCommand('insertOrderedList', false, null);
            });
            el.find('.editor-list-ul').click(function () {
                $(this).toggleClass('active');
                document.execCommand('insertUnorderedList', false, null);
            });
            el.find('.editor-insert-picture').click(function () {
                $('.editor-upload-' + $scope.id).trigger('click');
            });


        }
    }
});

app.directive('emitOnFinish', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    }
});

app.directive('isSelf', function (AuthService) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var userID = attrs.isSelf;
            if (AuthService.isLogged()) {
                if (userID != AuthService.user.user_id) {
                    element.hide()
                }
            }
            return true;
        }
    }
});

app.directive('notIsSelf', function (AuthService) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var userID = attrs.notIsSelf;
            if (userID == AuthService.user.user_id) {
                element.hide();
            }
            return false;
        }
    }
});
