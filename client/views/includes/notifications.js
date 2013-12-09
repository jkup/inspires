define('notificationsView', ['notificationsHelper'], function(nHelper) {
    // Outer most selector
    jQuery(document)

        // Setup DOM listeners
        .on('click', '[data-behavior~=dismiss-notification]', function() {
            jQuery(this).trigger('dismiss_notification');
        })

        // Setup custom events
        .on('dismiss_notification.notification', function(e) {
            nHelper.dismiss(jQuery(e.target).data('id'));
        })
        ;

    Template.notifications.helpers({
        notifications: function() {
            return Notifications.find();
        }
    });

    // Mark notifications as seen after render
    Template.notification.rendered = function() {
        var notification = this.data;
        Meteor.defer(function() {
            Notifications.update(notification._id, {$set: {seen: true}});
        });

        if (notification.auto_dismiss) {
            setTimeout(function(){
                jQuery('[data-id~=' + notification._id + ']').trigger('click');
            }, notification.dismiss_after);
        };
    }
});