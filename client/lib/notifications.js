define('notificationsHelper', function() {
    var notification_helper = {
        INFO: 'info'
        ,SUCCESS: 'success'
        ,WARNING: 'warning'
        ,DANGER: 'danger'

        ,notify: function(msg, level) {
            if (!level) level = this.INFO;

            Notifications.insert({message: msg, type: level});
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

    Notifications = new Meteor.Collection(null);

    return notification_helper;
});