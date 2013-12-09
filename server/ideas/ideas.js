Meteor.publish('ideas', function() {
    return Ideas.find();
});
Meteor.methods({
    ideaDeleteIdea: function (objectId, path) {

    	objectId = new Meteor.Collection.ObjectID(objectId).toHexString();

    	var opened = Meteor.user().ideas.opened;

console.log(path);
    	var idea = {};
    	var selector = {};

    	console.log(objectId);
    	idea[path.remove_path] = { _id: objectId };

    	selector._id = path.root_id;
    	selector[path.select_path] = {$size: 0};

    	if (opened.indexOf(objectId) === -1) {
    		Ideas.update( selector, { $pull: idea } );
    	};
    }
});