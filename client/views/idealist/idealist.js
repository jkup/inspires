define('ideaListView', ['_Idea'], function(Idea) {
    String.prototype.repeat = function(num) {
        return new Array(num + 1).join(this);
    }

    // Setup listeners
    jQuery(document).on('click', '[data-behavior~=add-idea]', function() {
        var idea_title = prompt('Idea title:')
            , $this = jQuery(this)
            , objectId = $this.data('id')
            ;

        // See if we are adding a root idea or child idea
        if (0 === objectId) {
            ideaListView.add_root(idea_title);
        } else {
            ideaListView.add_child(objectId, idea_title);
        }
    });

    var ideaListView = (function() {
        // This is here until this happens: https://jira.mongodb.org/browse/SERVER-831
        var paths = {};

        return {
            get_root_ideas: function() {
                return Ideas.find({}, {fields: {title: 1}});
            },

            get_root_idea: function(objectId) {
                return Ideas.findOne({_id: objectId});
            },

            get_path_to_object: function(objectId) {
                // If path to object isn't set then build from db
                if (!paths[objectId]) {
                    var root = this.get_root_idea(objectId);

                    // Add root path
                    paths[root._id] = {
                        depth: 0,
                        find_path: '_id',
                        push_path: 'children'
                    };
                }

                return paths[objectId];
            },

            add_root: function(idea_title) {
                Ideas.insert(new Idea({title: idea_title}));
            },

            add_child: function(objectId, idea_title) {
                var path = this.get_path_to_object(objectId)
                    , find = {}
                    , push = {}
                    ;

                if (!path) throw 'ObjectId not found.';

                find[path.find_path] = new Meteor.Collection.ObjectID(objectId).toHexString();
                push[path.push_path] = new Idea({title: idea_title});

                Ideas.update(find, {$push: push});
            },

            initialize: function() {}
        };
    }());

    Template.ideaList.helpers({
        root_ideas: ideaListView.get_root_ideas.bind(ideaListView)
        , root_id: function(){
            return _.extend({root_id: this.root_id || this._id}, this);
        }
    });
});













































    // To allow content editable shiz in the future...
    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != 'undefined' && typeof document.createRange != 'undefined') {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != 'undefined') {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }
