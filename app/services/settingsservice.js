/**
 * SettingsService returns the application configuration
 */
app.factory('SettingsService', [function() {
    var ret = {
        api:  'http://localhost:8000/api',
        xmpp:  'http://ded697.ded.reflected.net:7070/http-bind/'
    };
    return ret;
}]);

