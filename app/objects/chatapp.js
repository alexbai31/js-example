/**
 * Chat instance that provides XMPP functionality.
 * @param settings
 * @returns {jQuery.extend|*}
 */
var $chat = function(settings){

    var app = {
        connection: null,
        settings: null,

        reconnect: true,
        logger: null,
        userservice: null,
        $q: null,
        chatlist: null,
        status: Strophe.Status.DISCONNECTED,

        initialize: function(settings) {
            app.settings = settings
            app.logger = settings.logger
            app.userservice = settings.userservice
            app.$q = settings.$q
            app.chatlist = settings.chatlist

            app.log("Initialising ...")
            app.connection = new Strophe.Connection(settings.server);
        },

        connect: function() {
            app.log("Connecting as " + app.settings.username + "/" + app.settings.password)
            app.connection.connect(app.settings.username,app.settings.password, this.onConnect);
        },

        disconnect: function() {
            app.log("Disconnecting")
            app.reconnect = false
            app.connection.disconnect()
        },

        log: function(value) {
            console.log("Log: " + value)
            if(app.logger) app.logger.debug("Chat:: " +value)
        },

        isDisconnected: function() {

            return app.status === Strophe.Status.DISCONNECTED
        },
        onConnect: function(status, info) {
            if (status === Strophe.Status.CONNECTED)  {
                app.log("onConnect :: Connected");
                app.connection.addHandler(app.receiveMessage, null, 'message', null, null,  null);
                app.connection.send($pres());
            }
            else if (status === Strophe.Status.AUTHENTICATING) {
                app.log("onConnect :: Authenticating");
            }
            else if (status === Strophe.Status.CONNFAIL) {
                app.log("onConnect :: CONNFAIL");
            }
            else if (status === Strophe.Status.AUTHENTICATING) {
                app.log("onConnect :: Authenticating");
            }
            else if (status === Strophe.Status.DISCONNECTING) {
                app.log("onConnect :: DISCONNECTING");
            }
            else if (status === Strophe.Status.DISCONNECTED) {
                app.log("onConnect :: DISCONNECTED");
                if(app.reconnect) {
                    setTimeout(function(){app.connect();}, 3000)
                }
            }
            else if (status === Strophe.Status.CONNECTING) {
                app.log("onConnect :: Connecting");
            }
            else if (status === Strophe.Status.AUTHFAIL) {
                app.log("onConnect :: Failed to auth");
            }
            else {
                app.log("onConnect :: status = " + status);
            }
            app.status = status
            app.dispatch('onStatus',status)
        },

        receiveMessage: function(msg) {
            var to = msg.getAttribute('to').split('@')[0].toLowerCase();
            var from = msg.getAttribute('from').split('@')[0].toLowerCase();
            var type = msg.getAttribute('type');
            var elems = msg.getElementsByTagName('body');
            console.log("Chatapp: received XMPP message", msg)
            if (elems.length > 0) {
                var content = Strophe.getText(elems[0])
                var ufrom_promise, uto_promise;
                if( from == app.chatlist.user.username) {
                    ufrom_promise = app.chatlist.user
                    // try to get to_user from chatlist.roomslist
                    if( app.chatlist.roomslist[to] != undefined )
                        uto_promise = app.chatlist.roomslist[to].to
                    else
                        uto_promise = app.userservice.getUserByUsername(to);
                } else {
                    uto_promise = app.chatlist.user
                    // try to get from_user from chatlist.roomslist
                    if( app.chatlist.roomslist[from] != undefined )
                        ufrom_promise = app.chatlist.roomslist[from].to
                    else
                        ufrom_promise = app.userservice.getUserByUsername(from);
                }
                app.$q.all([ufrom_promise, uto_promise]).then(function(results) {
                    var ufrom = results[0];
                    var uto = results[1];
                    var messsage = $message().fromData(ufrom, uto, content)
                    app.addMessage(messsage)
                    app.log("onMessage :: from " + from + ", msg = " + content);
                })
            }
            else if(msg.getElementsByTagName('error')) {
                app.log('onMessage :: Error !!!!')
            }
            else {
                app.log('onMessage :: Failed to understand the received message')
            }
            return true;
        },

        sendMessage: function(message) {
            var reply = $msg({to: message.to.getXmppUsername(), from: message.from.getXmppUsername(), type: 'chat'}).c('body').t(message.message);
            app.connection.send(reply.tree());
            app.addMessage(message)
            return true;
        },

        addMessage: function(message) {
            if(app.chatlist) {
                //console.log("adding message")
                app.chatlist.addMessage(message)
            }
        }


    }
    app.initialize(settings)
    return app
}