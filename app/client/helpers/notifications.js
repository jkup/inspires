'use strict';

define('notificationsHelper', function() {
    var notification_helper = {
        INFO: 'info'
        ,SUCCESS: 'success'
        ,WARNING: 'warning'
        ,DANGER: 'danger'

        ,notify: function(msg, opts) {
            if (typeof opts === 'string') {opts = {type: opts};}

            opts = _.extend({
                message: msg
                ,type: this.INFO
                ,auto_dismiss: false
                ,dismiss_after: 3000
            }, opts);

            Notifications.insert(opts);
        }

        ,throw_error: function(msg) {
            if (Session.get('errorThrown') !== true) {
                this.notify(msg, this.ERROR);
            }
        }

        ,dismiss: function(objectId) {
            Notifications.remove({_id: objectId, seen: true});
        }

        ,clear_notifications: function() {
            Notifications.remove({seen: true});
        }
    };

    window.Notifications = new Meteor.Collection(null);

    return notification_helper;
});