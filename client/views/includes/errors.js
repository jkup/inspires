Template.errors.helpers({
    errors: function() {
    }
});

Template.error.rendered = function() {
    var error = this.data;
    Meteor.defer(function() {
    });
}

Template.error.events({
    'click span.close': function(e, tmpl) {
    }
});
