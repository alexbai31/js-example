angular.module('chatuserFilters', []).filter('shortDate', function () {
        return function (input) {
            var date = input
            var now = new Date()
            var diff = (now.getTime() - date.getTime()) / 1000;
            if (diff >= 3600 * 24 * 365) {
                var years = Math.round(diff / (3600 * 24 * 365))
                return years + 'y'
            }
            if (diff >= 3600 * 24 * 30) {
                var months = Math.round(diff / (3600 * 24 * 30))
                return months + 'mo'
            }
            if (diff >= 3600 * 24) {
                var days = Math.round(diff / (3600 * 24))
                return days + 'd'
            }
            if (diff >= 3600) {
                var hours = Math.round(diff / 3600)
                return hours + 'h'
            }
            if (diff >= 60) {
                var minutes = Math.round(diff / 60)
                return minutes + 'm'
            }
            return Math.round(diff) + 's'
        };
    })
    .filter('switchTime', function ($filter) {
        var standardDateFilterFn = $filter('date');
        var format = 'HH:mm'
        return function (dateToFormat, opt) {
            if (!opt) {
                format = 'h:mm a'
            } else {
                format = 'HH:mm'
            }
            ;
            return standardDateFilterFn(dateToFormat, format);
        }
    });

angular.module('genericFilters', [])
    .filter('txtprtDate', function () {
        var numbers = {
            '1': 'st',
            '2': 'nd',
            '3': 'rd',
            '21': 'st',
            '22': 'nd'
        };
        return function (input) {
            var date = input;
            var day = new Date(date).getDay();
        }
    })
    .filter('cutText', function () {
        return function (input) {
            if (input.length > 300) {
                return input.slice(0, 300) + "...";
            }

            return input;
        }
    })
    .filter('tail', function () {
        return function (input) {
            if (input.length > 300) {
                return input.slice(300);
            }
        }
    })
    .filter('nFormatter', function () {
        return function (input) {
            var si = [
                {value: 1E18, symbol: "E"},
                {value: 1E15, symbol: "P"},
                {value: 1E12, symbol: "T"},
                {value: 1E9, symbol: "G"},
                {value: 1E6, symbol: "M"},
                {value: 1E3, symbol: "k"}
            ], i;
            for (i = 0; i < si.length; i++) {
                if (input >= si[i].value) {
                    return (input / si[i].value).toFixed(1).replace(/\.?0+$/, "") + si[i].symbol;
                }
            }
            return input;
        }
    })
    .filter('cutMessage', function () {
        return function (input) {
            if (typeof input != "undefined") {
                if (input.length > 100) {
                    return input.slice(0, 100) + "...";
                } else {
                    return input;
                }
            } else {
                return "";
            }
        }
    })
    .filter('htmlToPlainText', function () {
        return function (text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });

angular.module('lastSeenFilters', [])
    .filter('lastSeenDay', function () {

        return function (dateStr) {
            var d = new Date(Date.parse(dateStr));
            return d.getUTCDate() + 1;

        }
    })
    .filter('lastSeenMonth', function () {

        return function (dateStr) {
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            var d = new Date(Date.parse(dateStr));
            return monthNames[d.getMonth()];

        }
    })
    .filter('getNameMonth', function () {

        return function (dateStr) {
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            return monthNames[parseInt(dateStr) - 1];

        }
    })
    .filter('checkDateCard', function () {

        return function (dateArr) {

            var now = new Date();

            if (parseInt(dateArr[1]) < parseInt(now.getFullYear())) {
                return false;
            }

            if ((parseInt(dateArr[1]) === parseInt(now.getFullYear())) && (parseInt(dateArr[0]) < (parseInt(now.getMonth()) + 1) )) {
                return false;
            }

            return true;

        }
    })
    .filter('getMessageDay', function () {

        return function (dateStr) {
            var d = new Date(Date.parse(dateStr));
            return d.getUTCDate();

        }
    })
    .filter('getMessageYear', function () {

        return function (dateStr) {
            var d = new Date(Date.parse(dateStr));
            return d.getFullYear();

        }
    })
    .filter('getMessageM', function () {

        return function (dateStr) {
            var d = new Date(Date.parse(dateStr));
            return d.getMonth();

        }
    });

angular.module('profileFilters', [])
    .filter('popularityString', function () {
        return function (input) {
            if ((input > 60) && (input < 80)) {
                return "manager";
            }
            if ((input > 80) && (input < 90)) {
                return "popular Manager";
            }
            if (input > 90) {
                return "a very popular Manager";
            }
        }
    })
    .filter('splitStatusMessage', function () {

        return function (statusMessage) {
            return statusMessage.substring(0, 100);

        }
    });

angular.module('chatFilters', [])
    .filter('addZero', function () {
        return function (input) {
            if (input.toString().length == 1) {
                return "0" + input;
            } else {
                return input;
            }
        };
    });

