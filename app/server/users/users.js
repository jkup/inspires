Meteor.publish('userData', function() {
    return Meteor.users.find({_id: this.userId}, {
        fields: {
            ideas: 1
        }
    });
});

Meteor.methods({
    userRecordOpenedIdea: function(objectId) {
    	objectId = new Meteor.Collection.ObjectID(objectId).toHexString();
    	var opened = Meteor.user().ideas.opened;

    	if (opened.indexOf(objectId) === -1) {
    		Meteor.users.update({_id: this.userId}, {$push: {'ideas.opened': objectId}});
    	};
    }

    ,userPluckOpenedIdea: function(objectId) {
        objectId = new Meteor.Collection.ObjectID(objectId).toHexString();
        Meteor.users.update({_id: this.userId, 'ideas.opened': objectId}, {$pull: {'ideas.opened': objectId}});
    }
});