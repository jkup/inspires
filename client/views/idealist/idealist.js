define('ideaListView', function() {
    var ideaListView = (function() {
        return {
            root_ideas: function() {
                return Ideas.find({}, {fields: {name: 1}});
            },

            // Basically displays all root ideas
            initialize: function() {
                // Ideas.insert({"_id": new Meteor.Collection.ObjectID().toHexString(), name: 'level one', children: [{"_id": new Meteor.Collection.ObjectID().toHexString(), name: 'level two', children: [{name: 'level three', children: {}}]}]});
            }
        }
    }());

    Template.ideaList.rendered = ideaListView.initialize.bind(ideaListView);
});
