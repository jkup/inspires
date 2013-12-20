'use strict';

Ideas = new Meteor.SmartCollection('ideas');

Ideas.allow({
    insert: function() {
        if (Meteor.user()) {
            return true;
        } else {
            return false;
        }
    },
    update: function() {
        // Only allow if we are adding something to the children array
        if (Meteor.user() && arguments[2].length === 1 && arguments[2][0] === 'children' && Object.size(arguments[3]) && arguments[3].$push) {
            return true;
        } else {
            return false;
        }
    },
    remove: function(){return false;}
});