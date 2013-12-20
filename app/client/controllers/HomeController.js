'use strict';

HomeController = RouteController.extend({
    show: function() {
        this.render(Meteor.user() ? 'ideaList' : 'landing');
    }
});