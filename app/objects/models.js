/**
 * Privides simple event dispatching functionality. Probably it should be replaced by jquery.on jquery.off
 * Example: var app = $.extend($dispatcher(),{first_name:"Marian"})
 * @returns {{listeners: {}, getListeners: Function, addListener: Function, dispatch: Function}}
 */
var $dispatcher = function(){
    var res = {
        listeners: {},
        getListeners: function(eventType){
            if(res.listeners[eventType] == undefined) return []
            else return res.listeners[eventType]
        },
        addListener: function(eventType, func){
            if(res.listeners[eventType] == undefined)  {
                res.listeners[eventType]=[]
            }
            var exists = false;
            $(res.listeners[eventType]).each(function(i, f) {
                if(f == func || f.toString() == func.toString()) {
                    exists = true
                    return
                }
            })
            if( exists ) return
            res.listeners[eventType].push(func)
        },
        removeListeners: function(eventType) {
            if(res.listeners[eventType] != undefined)
                delete res.listeners[eventType]
        },
        dispatch: function(eventType, event) {
            $(res.getListeners(eventType)).each(function(i,fct){
                fct(event)
            })
        }

    }
    return res
}

var $online_statuses = ['online',  'away', 'offline']

function get_random_not_filled_text() {
    var options = [
        "I'm undercover, so no profile.. shhhh",
        "No profile... I'm special, not smart",
        "My dog ate my profile",
        "I'm basically too lazy to fill out my profile",
        "www [dot] no-profile [dot] com",
        "No profile!  I'm pleading the 5th",
        "I will have a profile when I get around to it",
    ]

    var rand_idx = Math.floor(Math.random() * options.length)
    return options[rand_idx];
}

/**
 * User Class
 * @returns {{prefix: string, phone: string, password: string, user_id: string, profile: *, initFromUsername: Function, getXmppUsername: Function, initFromSession: Function, initFromData: Function}}
 */
var $user = function(){
    var user = {
        username: '',
        password: '',
        email: '',
        user_id: '',
        status: '',
        seeking_tags: [],
        offering_tags: [],
        profile_filled: false,
        profile: $userProfile(),
        vote: 0.00,
        num_voted: 0,
        rated: false, // whether request.user rated user
        is_followed: false,  // indicates whether the user is followed by the current user (only makes sense for 'other' users)
        avatar_uploaded: false,
        avatar_abuse_reported: false, // indicates whether this user's avatar was flagged as abuse by the current user (only makes sense for 'other' users)
        avatar_abuse_action_pending: false,
        available_credit: 0,
        available_balance_usd: 0,
        message_cost: 0,
        message_commission: null,
        credit_to_usd_ratio: null,
        followers: [],
        followees: [],
        is_chatter: false,
        has_reviews: false,
        initFromUsername: function(username){
            user.username = username
        },
        getXmppUsername: function(){
            return user.username + "@glosk"
        },
        initFromData: function(data) { // init from server data
            user.user_id = data.user_id;
            user.username = data.username;
            user.password = data.isPassword;
            user.xmpp_pass = data.xmpp_pass;
            user.email = data.email;
            user.vote = data.vote;
            user.rated = data.rated;
            user.num_voted = data.num_voted;
            user.num_voted_up = data.num_voted_up || 0;
            user.status = data.status;
            user.status_message = data.status_message;
            user.chat_intro = data.chat_intro;
            user.avatar_uploaded = data.avatar_uploaded;
            user.profile.avatar = data.avatar;
            user.profile.avatar_big = data.avatar_big;
            user.profile.profile_image = data.profile_image;
            user.profile.is_expert = data.is_expert;
            user.profile.age = data.age;
            user.profile.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : '';
            user.profile.gender = data.gender;
            user.profile.about_me = data.about_me;
            user.profile.city = data.city;
            user.profile.state = data.state;
            user.profile.country = data.country;
            user.profile.location = data.location;
            user.profile.lat = data.lat;
            user.profile.lng = data.lng;
            user.seeking_tags = data.seeking_tags;
            user.offering_tags = data.offering_tags;
            user.profile_filled = data.profile_filled;
            if( !user.profile_filled)
                user.profile_not_filled_text = get_random_not_filled_text();
            user.num_followers = data.num_followers;
            user.num_followees = data.num_followees;
            user.is_followed = data.is_followed;
            user.avatar_abuse_reported = data.avatar_abuse_reported;
            user.avatar_abuse_action_pending = data.avatar_abuse_action_pending;
            user.last_visit = data.last_visit;
            user.is_important = data.is_important;
            user.is_closed = data.is_closed;
            user.available_credit = data.available_credit || 0;
            user.available_balance_usd = data.available_balance_usd || 0;
            user.message_cost = data.message_cost || 0;
            user.in_free_list = data.in_free_list;
            user.free_to_write = data.free_to_write;
            user.can_earn_money = data.can_earn_money;
            user.docs_status = data.docs_status;
            user.is_blocked = data.is_blocked;
            user.in_block_list = data.in_block_list;
            user.free_messages = data.free_messages;// number of messages you can send to this user without paying
            user.message_commission = data.message_commission;
            user.credit_to_usd_ratio = data.credit_to_usd_ratio;
            user.withdrawal_fee = data.withdrawal_fee_stripe;
            user.followers = data.followers;// limited to 9 by backend
            user.followees = data.followees;// limited to 9
            user.referrer = data.referrer;
            user.referral_link = data.referral_link;
            user.is_chatter = data.is_chatter;
            user.category = data.category;
            user.review_count = data.review_count;
            user.has_reviews = data.has_reviews;
            user.reviews = data.reviews;
            user.time_settings = data.time_settings;
            user.is_suspended = data.is_suspended;
            user.is_squelched = data.is_squelched;
            user.is_cancelled = data.is_cancelled;
            user.is_deactivated = data.is_deactivated;
            return user
        },
        restore: function(obj) {  // this is needed to restore the user from session (localStorage)
            user.user_id = obj.user_id
            user.username = obj.username
            user.password = obj.password
            user.xmpp_pass = obj.xmpp_pass
            user.email = obj.email
            user.vote = obj.vote
            user.num_voted = obj.num_voted
            user.num_voted_up = obj.num_voted_up
            user.rated = obj.rated
            user.status = obj.status
            user.status_message = obj.status_message
            user.chat_intro = obj.chat_intro
            user.avatar_uploaded = obj.avatar_uploaded
            user.profile.avatar = obj.profile.avatar
            user.profile.avatar_big = obj.profile.avatar_big
            user.profile.profile_image = obj.profile.profile_image
            user.profile.age = obj.profile.age
            user.profile.date_of_birth = obj.profile.date_of_birth ? new Date(obj.profile.date_of_birth) : ''
            user.profile.gender = obj.profile.gender
            user.profile.about_me = obj.profile.about_me
            user.profile.city = obj.profile.city
            user.profile.state = obj.profile.state
            user.profile.country = obj.profile.country
            user.profile.location = obj.profile.location
            user.profile.lat = obj.profile.lat
            user.profile.lng = obj.profile.lng
            user.seeking_tags = obj.seeking_tags
            user.offering_tags = obj.offering_tags
            user.profile_filled = obj.profile_filled
            if( !user.profile_filled)
                user.profile_not_filled_text = get_random_not_filled_text()
            user.num_followers = obj.num_followers
            user.num_followees = obj.num_followees
            user.is_followed = obj.is_followed
            user.avatar_abuse_reported = obj.avatar_abuse_reported
            user.avatar_abuse_action_pending = obj.avatar_abuse_action_pending
            user.last_visit = obj.last_visit
            user.is_important = obj.is_important
            user.is_closed = obj.is_closed
            user.available_credit = obj.available_credit || 0
            user.available_balance_usd = obj.available_balance_usd || 0
            user.message_cost = obj.message_cost || 0
            user.in_free_list = obj.in_free_list
            user.free_to_write = obj.free_to_write
            user.can_earn_money = obj.can_earn_money
            user.docs_status = obj.docs_status
            user.is_blocked = obj.is_blocked
            user.in_block_list = obj.in_block_list
            user.message_commission = obj.message_commission  // %
            user.credit_to_usd_ratio = obj.credit_to_usd_ratio
            user.referrer = obj.referrer
            user.referral_link = obj.referral_link
            user.is_chatter = obj.is_chatter
            user.category = obj.category
            user.review_count = obj.review_count
            user.has_reviews = obj.has_reviews
            user.reviews = obj.reviews
            user.time_settings = obj.time_settings
        },
        isAdmin: function() {
            return user.username == 'admin'
        },
        commissionCredits: function() {
            return (user.message_cost * user.message_commission).toFixed(2)
        },
        commissionUsd: function() {
            return (user.commissionCredits() * user.credit_to_usd_ratio).toFixed(2)
        },
        location: function() {
            var location = '';
            if ( user.profile.city )
                location += user.profile.city
            if ( user.profile.country )
                location +=  ' ' + user.profile.country
            return location
        },
        asl: function() {
            var asl = ''
            var sex = user.profile.sex()
            var location = '';
            if ( user.profile.city )
                location += user.profile.city
            if ( user.profile.country )
                location +=  ' ' + user.profile.country

            if (user.profile.age)
                asl += user.profile.age
            if (sex)
                asl += (asl?' / ':'') + sex
            if (location)
                asl += (asl?' / ':'') + location
            return asl
        }
    }
    return user
}

/**
 * User profile class
 * @returns {{sex: string, age: string, city: string, state: string, country: string, avatar: string, aboutme: string}}
 */

// TODO: LET'S PUT EVERYTHING INTO USER
var $userProfile = function(){
    var profile = {
        gender: '',
        age: '',
        city: '',
        state: '',
        country: '',
        location: '',
        lat: '',
        lng: '',
        avatar: '',
        profile_image: '',
        about_me: '',
        sex: function() {
            var sex = '';
            if (profile.gender)
                sex = profile.gender == 'male' ? 'M' : 'F'
            return sex;
        }
    }
    return profile
}

/**
 *  Message class
 * @returns {{from: null, to: null, message: null, fromData: Function, fromXmppMsg: Function}}
 */
var $message = function(){
    var ret = {
        id: null,
        from: null,
        to: null,
        message: null,
        date: null,
        attachment: null,
        attachment_cropped: null,
        attachment_size: null,
        txn_cancelled: null,  // indicates that the recipient missed out on the credits -- only for paid messages
        unread: false,
        is_delivered: false,
        fromData: function(from, to, content, msg_data) {
            ret.from = from
            ret.to = to
            ret.message = content
            if( msg_data != undefined ) {
                ret.id = msg_data.id
                ret.attachment = msg_data.attachment
                ret.attachment_cropped = msg_data.attachment_cropped
                ret.attachment_size = msg_data.attachment_size
                ret.txn_cancelled = msg_data.txn_cancelled
                ret.unread = msg_data.unread
                ret.is_delivered = msg_data.is_delivered
                ret.date = new Date(msg_data.year, msg_data.month-1, msg_data.day, msg_data.hours, msg_data.minutes)
            } else {
                ret.date = new Date()
            }
            return ret
        },
        fromXmppMsg: function(msg) {
            ret.from = from
            ret.to = to
            ret.message = message
            ret.date = new Date();
            return ret
        }

    }
    return ret
}

/**
 * ChatLog instance. Maintains message list for a chat room, organized in groups by sender
 */
var $chatlog = function() {
    var res = {
        message_groups: [],
        addMessage: function(message) {
            if (!res.message_groups.length) {
                var group = res._addMessageGroup(message.from)
                group.messages.push(message)
                group.date = message.date
                return
            }
            var last_group = res.message_groups[res.message_groups.length-1]
            if (last_group.from.username == message.from.username) {
                last_group.messages.push(message)
            } else {
                var group = res._addMessageGroup(message.from)
                group.messages.push(message)
                group.date = message.date
            }
        },
        _addMessageGroup: function(from) {
            var group = {
                from: from,
                messages: [],
                date: null
            };
            res.message_groups.push(group)
            return group;
        },
        reset: function() {
            res.message_groups = []
        }
    }
    return res;
}

/**
 * ChatRoom instance. Mainly it collects messages
 * There is a ChatRoom for each conversation
 * @param from
 * @param to
 * @returns {{statuses: {UNREAD: number, READ: number}, status: number, from: *, to: *, messages: Array, listeners: {}, getListeners: Function, addListener: Function, addMessage: Function}}
 */
var $chatroom = function(to_user){
    var res = $.extend($dispatcher(),{
        statuses: {
            UNREAD: 0,
            READ: 1
        },
        status: 1,
        to: to_user,
        messages: [],
        unread_count: 0,
        chatlog: $chatlog(),
        addMessage: function(message) {
            res.messages.push(message)
            res.chatlog.addMessage(message)
            res.dispatch('onMessage', message)
            res.to.is_closed = false
        },
        markRead: function() {
            res.status = res.statuses.READ
            res.unread_count = 0
        },
        hasUnread: function() {
            return res.status == res.statuses.UNREAD
        },
        markUnread: function() {
            res.status = res.statuses.UNREAD
        },
        lastMessage: function() {
            return res.messages[res.messages.length - 1]
        },
        lastOwnMessage: function() {
            for(var i=res.messages.length - 1; i>=0;i--) {
                var msg = res.messages[i]
                if( msg.to.user_id == res.to.user_id )
                    return msg
            }
        },
        getMessageGroups: function() {
            // in the future we might want to get rid of $chatlog, since message groups can be generated dynamically
        },
        reset: function() {
            res.messages = []
            res.chatlog.reset()
            res.markRead()
        },
        is_dirty: function() {
            return res.messages.length > 0
        }
    })
    return res
}

/**
 * Provides chatroomslist functionality
 * @type {{user: null, roomslist: {}, init: Function, getRoom: Function, addMessage: Function}}
 */
var $chatlist = $.extend($dispatcher(),{
    user: null,  // the AuthService.user
    token: null, // AuthService.token
    initialized: false,
    roomslist: {},
    active_room: null,
    activeTab: 'all', // or 'important', or 'premium'
    init: function(settings) {
        $chatlist.user = settings.user
    },
    reset: function() {
        // reset to defaults
        console.log("Reset called")
        $chatlist.user = null
        $chatlist.token = null
        $chatlist.roomslist = {}
        $chatlist.active_room = null
        $chatlist.activeTab = 'all'
        $chatlist.initialized = false
    },
    unread_message_count: function() {
        var count = 0;
        for(var uname in $chatlist.roomslist) {
            count += $chatlist.roomslist[uname].unread_count
        }
        return count
    },
    length: function() {
        var l = 0;
        for(var username in $chatlist.roomslist) {
            if($chatlist.activeTab == 'important' && $chatlist.roomslist[username].to.is_important) l++;
            if($chatlist.activeTab == 'new' && $chatlist.roomslist[username].unread_count > 0) l++;
            if($chatlist.activeTab == 'all' && $chatlist.roomslist[username]) l++;
        }
        return l
    },
    allRooms: function() {
        $chatlist.activeTab = 'all'
    },
    importantRooms: function() {
        $chatlist.activeTab = 'important'
    },
    getRoom: function(dest) {
        var uname_lower = dest.username.toLowerCase()
        if(!$chatlist.hasRoom(dest)) {
            $chatlist.roomslist[uname_lower] = $chatroom(dest)
            $chatlist.dispatch('roomAdded', $chatlist.roomslist[uname_lower])
        }
        return $chatlist.roomslist[uname_lower]
    },
    hasRoom: function(dest) {
        var uname_lower = dest.username.toLowerCase()
        return ($chatlist.roomslist[uname_lower] != undefined)
    },
    closeRoom: function(dest) {
        if($chatlist.hasRoom(dest)) {
            if( !dest.is_important ) {
                $chatlist.dispatch('roomDeleted', $chatlist.roomslist[dest.username.toLowerCase()])
                delete $chatlist.roomslist[dest.username.toLowerCase()]
            }
        }
    },
    setActiveRoom: function(room) {
        $chatlist.active_room = room
        room.markRead()
    },
    resetActiveRoom: function() {
        $chatlist.active_room = null
    },
    idCheck: function(message) {
        // check by message.id if this message is already present
        // at the moment when messages comes from XMPP (or polling), it could already be at the client,
        // we deny such messages
        var roomMessages = $chatlist.getRoom(message.from).messages
        for(var i in roomMessages) {
            if (parseInt(message.id) == parseInt(roomMessages[i].id)){
                console.log("Not Inserting Message", message.id)
                return false;
            }
        }
        return true
    },
    postAddStuff: function(room, opts) {
        console.log("Active room", $chatlist.active_room)
        if (room != $chatlist.active_room && opts.unread) {
            room.markUnread()
            room.unread_count += 1
            console.log("Incremented unread count", $chatlist.unread_message_count())
        }
        // play sound :)
        var audioElement = document.createElement('audio');
        audioElement.setAttribute('autoplay', 'autoplay');
        audioElement.setAttribute('src', '/audio/msg_received.mp3');
        audioElement.play();
    },
    addMessage: function(message, opts) {
        message.id = parseInt(message.id) // convert to Int to avoid comparing ints to strings
        // returns the room where the message was added
        opts = opts || {}
        opts.unread = opts.unread || true
        var room;
        if($chatlist.user.username == message.from.username) {
            // own message - just add it
            $chatlist.parseMessage(message)  // parse for image_upload stuff
            room = $chatlist.getRoom(message.to)
            room.addMessage(message)
        } else if (opts.direct || opts.polling ) { // used when loading chatlist and polling
            $chatlist.parseMessage(message)
            room = $chatlist.getRoom(message.from)
            // id check - for polling
            if( opts.polling && !$chatlist.idCheck(message) )
                return false;
            room.addMessage(message)
            if( !opts.in_chatlist ) {
                $chatlist.postAddStuff(room, opts)
            }
        } else { // received message from XMPP
            var res = $chatlist.parseMessage(message)
            if( !res.proceed ) {
                console.log("NO PROCEED", message)
                return
            }
            // at the moment when messages comes from XMPP, it could already be at the client, while message will be duplicated. we deny that.
            if( !$chatlist.idCheck(message) )
                return false

            console.log("ID test passed")

            if( res.sendObj && res.sendObj.action == 'own_message') {
                // process self sent message - in order to show it in all currently logged in clients/browsers
                var sendObj = res.sendObj
                if( sendObj.session_id != $chatlist.token ) {
                    // only add it to chatroom if not sent from the same client/browser
                    var msg = angular.copy(message)
                    msg.to = message.from
                    msg.from = $chatlist.user
                    msg.id = sendObj.id
                    if( sendObj.attachment ) {
                        msg.unread = sendObj.unread
                        msg.is_delivered = sendObj.is_delivered
                        msg.attachment = sendObj.attachment
                        msg.attachment_cropped = sendObj.attachment_cropped
                        msg.attachment_size = sendObj.attachment_size
                        msg.message = ''
                    } else {
                        msg.message = sendObj.message
                    }
                    room = $chatlist.getRoom(msg.to)
                    room.addMessage(msg)
                } else {
                    return // don't do anything
                }
            } else if( res.sendObj && (res.sendObj.action == 'message' || res.sendObj.action == 'image_upload')) {
                // process "real" received message or image upload
                room = $chatlist.getRoom(message.from)
                room.addMessage(message)
                $chatlist.postAddStuff(room, opts)
            } else {
                // something is wrong
                console.log("something is wrong", message)
                return
            }
        }
        $chatlist.dispatch('addMessage', message)
        return room
    },
    newRooms: function() {
        var rooms = []
        for(var username in $chatlist.roomslist) {
            if(($chatlist.activeTab == 'important' && !$chatlist.roomslist[username].to.is_important) || ($chatlist.activeTab == 'new' && !$chatlist.roomslist[username].unread_count > 0))
                continue;
            var room = $chatlist.roomslist[username]
            // ignore closed chats if not on 'important' tab
            if (room.to.is_closed && $chatlist.activeTab != 'important')
                continue;
            // only unread rooms
            if( room.hasUnread() ) {
                rooms.push(room)
            }
        }
        rooms.sort(sortRooms)
        return rooms;
    },
    oldRooms: function() {
        var rooms = []
        for(var username in $chatlist.roomslist) {
            if(($chatlist.activeTab == 'important' && !$chatlist.roomslist[username].to.is_important) || ($chatlist.activeTab == 'new' && !$chatlist.roomslist[username].unread_count > 0))
                continue;
            var room = $chatlist.roomslist[username]
            // ignore closed chats if not on 'important' tab
            if (room.to.is_closed && $chatlist.activeTab != 'important')
                continue;
            // only read rooms
            if( !room.hasUnread() ) {
                rooms.push(room)
            }
        }
        rooms.sort(sortRooms)
        return rooms;
    },
    parseMessage: function(messageObj) {
        var re = /serialized_message/i
        var messageStr = messageObj.message
        if (re.test(messageStr)){
            var pattern = /\{(.*)\}/i
            sendObj = JSON.parse(messageStr.match(pattern)[0].replace(/&quot;/gi,'"'))
            if(sendObj.action && sendObj.action == 'chat_enter') {
                if (sendObj.id) {
                    // mark just this message read
                    for (var i=0; i<$chatlist.roomslist[sendObj.username.toLowerCase()].messages.length; i++){
                        var msg = $chatlist.roomslist[sendObj.username.toLowerCase()].messages[i]
                        if( msg.id == sendObj.id ) {
                            $chatlist.roomslist[sendObj.username.toLowerCase()].messages[i].unread = false
                            break;
                        }
                    }
                } else {
                    // mark all messages read
                    for (var i=0; i<$chatlist.roomslist[sendObj.username.toLowerCase()].messages.length; i++){
                        $chatlist.roomslist[sendObj.username.toLowerCase()].messages[i].unread = false
                    }
                }
                return {proceed: false}
            }
            if(sendObj.action && (sendObj.action == 'message' || sendObj.action == 'own_message' ) && sendObj.message) {
                // base64-decode the message
                sendObj.message = Base64.decode(sendObj.message)
            }
            if(sendObj.action && (sendObj.action == 'image_upload' || sendObj.action == 'own_message') && sendObj.attachment) {
                messageObj.unread = sendObj.unread
                messageObj.is_delivered = sendObj.is_delivered
                messageObj.attachment = sendObj.attachment
                messageObj.attachment_cropped = sendObj.attachment_cropped
                messageObj.attachment_size = sendObj.attachment_size
                messageObj.id = sendObj.id
                messageObj.message = ''
                return {proceed: true, sendObj: sendObj};
            }
            if(sendObj.action && sendObj.action == 'own_message') {
                messageObj.id = sendObj.id
                return {proceed: true, sendObj: sendObj}
            }
            if(sendObj.action && sendObj.action == 'message') {
                messageObj.message = sendObj.message
                messageObj.id = sendObj.id
                return {proceed: true, sendObj: sendObj}
            }
        }
        // deny unknown messages
        return {proceed: false};
    }
})

function sortRooms(r1, r2) {
    var m1 = r1.lastMessage(),
        m2 = r2.lastMessage();
    if (typeof(m1) == 'undefined') return -1;
    if (typeof(m2) == 'undefined') return 1;
    return m2.date.getTime() - m1.date.getTime()
}

// TODO: correct the reasons, match with backend (abuse.AbuseType)
var $abuseReasons = [
    {code:'nudity', name:'Nudity'},
    {code:'whatever', name:'Whatever'}
]