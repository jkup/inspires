'use strict';

var _app;

if (typeof window !== 'undefined') {
    _app = window;
} else {
    _app = global;
}

_app.Ideas = new Meteor.SmartCollection('ideas');

Ideas.allow({
    insert: function() {
        if (Meteor.user()) {
            return true;
        } else {
            return false;
        }
    },
    update: function() {
        // Only allow update to children and updatedOn
        if (Meteor.user() && arguments[2][0] === 'children' && arguments[2][1] === 'updatedOn' && Object.size(arguments[3]) === 2 && arguments[3].$push && arguments[3].$set) {
            return true;
        } else {
            return false;
        }
    },
    remove: function(){return false;}
});
