define('_Idea', function() {
    'use strict';

    var _Idea = function(options) {
        options = options || {};
        this._id = new Meteor.Collection.ObjectID().toHexString();
        this.title = options.title;
        this.children = [];
        this.votes = {up: 0, down: 0};
        this.order = 0;
        this.owner = Meteor.user()._id;
        this.createdOn = new Date();
    };

    _Idea.prototype = {
        constructor: _Idea
        ,isPublic: function() {
            // if(some_logic)
                // return true;
            return false;
        }
    };

    return _Idea;
});