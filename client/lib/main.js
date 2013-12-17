Meteor.subscribe('userData');
Meteor.subscribe('ideas');

window.onerror = function(error) {
    error = error.replace('uncaught exception: ', '');
    if (error) {
        using(['notificationsHelper'], function(nHelper) {
            nHelper.notify(error, {type: nHelper.DANGER, auto_dismiss: true, dismiss_after: 8000});
        });
    }
}
