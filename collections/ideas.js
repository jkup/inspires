Ideas = new Meteor.SmartCollection('ideas');

Ideas.allow({
    // insert: function(){return false;}, // maybe do this in the future...
    update: function(){
    	if (arguments[2].length == 1 && arguments[2][0] == 'children' && Object.size(arguments[3]) && arguments[3]['$push']) {
    		return true;
    	} else {
    		return false;
    	}
    },
    remove: function(){return false;}
});