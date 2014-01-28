'use strict';

Meteor.subscribe('userData');
Meteor.subscribe('ideas', window.location.pathname);

window.onerror = function(error) {
    error = error.replace('uncaught exception: ', '');
    if (error) {
        using(['notificationsHelper'], function(nHelper) {
            nHelper.notify(error, {type: nHelper.DANGER, auto_dismiss: true, dismiss_after: 8000});
        });
    }
};

String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
};