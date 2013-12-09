Meteor.publish('ideas', function() {
    return Ideas.find();
});
Meteor.methods({
    ideaDeleteIdea: function (objectId, path) {
    	objectId = new Meteor.Collection.ObjectID(objectId).toHexString();

        // Declare variables
        var select = {}
            ,update = {}
            ;

        // Build update
        select[path.select_path + '_id'] = objectId;
        select[path.select_path + 'owner'] = this.userId;
        select[path.select_path + 'children'] = {$size: 0};

        // Build select
    	update[path.remove_path] = {_id: objectId};

        // Check if object is root
        if (objectId === path.root_id) {
            // If this isn't here otherwise meteor remove the document from it's cache, but not actually from mongo which is what should happen, but it shouldn't remve it from the cache
            if (Ideas.find(select).fetch().length > 0) {
                Ideas.remove(select);
            }
        } else {
           Ideas.update(select, {$pull: update});
        }
    }
});