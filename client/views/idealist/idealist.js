// Judgement free zone...wrote this while drinking wine
define('ideaListView', ['_Idea'], function(Idea) {
    String.prototype.repeat = function(num) {
        return new Array(num + 1).join(this);
    }

    // Outer most selector
    jQuery(document)

        // Setup DOM listeners
        .on('click', '[data-behavior~=add-idea]', function() {
            jQuery(this).trigger('add_idea');
        })
        .on('click', '[data-behavior~=expand-idea]', function() {
            jQuery(this).trigger('expand_idea');
        })

        // Setup custom events
        .on('add_idea.idea_list', function(e) {
            var idea_title = prompt('Idea title:')
                ,$this = jQuery(e.target)
                ,objectId = $this.data('id')
                ;

            // See if we are adding a root idea or child idea
            if (0 === objectId) {
                ideaListView.add_root(idea_title);
            } else {
                ideaListView.add_child(objectId, idea_title);
            }
        })
        .on('expand_idea.idea_list', function(e) {
            jQuery(e.target).siblings('ul').slideDown();
        })
        ;

    var ideaListView = (function() {
        // This is here until this happens: https://jira.mongodb.org/browse/SERVER-831
        var paths = {};

        return {
            get_root_ideas: function() {
                var _ideas = Ideas.find()
                    ,that = this
                    ;

                // Run in background
                setTimeout(function() {
                    var ideas = _ideas.fetch();
                    for (var i = 0; i < ideas.length; i++) {
                        that.build_paths_recursively(ideas[i], ideas[i]._id);
                    };
                });

                return _ideas;
            },

            get_root_idea: function(objectId) {
                return Ideas.findOne({_id: objectId});
            },

            build_paths_recursively: function() {
                var args = _.extend([
                    null, // idea
                    null, // root_id
                    0, // depth
                    'children' // push_path
                    ], arguments);

                // Add root path
                paths[args[0]._id] = {
                    depth: args[2]
                    ,root_id: args[1]
                    ,push_path: args[3]
                };

                for (var i = 0; i < args[0].children.length; i++) {
                    this.build_paths_recursively(args[0].children[i], args[1], args[2] + 1, args[3] + '.' + i + '.children');
                };
            },

            get_path_to_object: function(objectId) {
                // If path to object isn't set then build from db
                if (!paths[objectId]) {
                    this.build_paths_recursively(this.get_root_idea(objectId), objectId);
                }

                return paths[objectId];
            },

            add_root: function(idea_title) {
                Ideas.insert(new Idea({title: idea_title}));
            },

            add_child: function(objectId, idea_title) {
                var path = this.get_path_to_object(objectId)
                    ,find = {}
                    ,push = {}
                    ;

                if (!path) throw 'ObjectId not found.';

                // find[path.find_path] = new Meteor.Collection.ObjectID(objectId).toHexString();
                push[path.push_path] = new Idea({title: idea_title});

                Ideas.update({'_id': new Meteor.Collection.ObjectID(path.root_id).toHexString()}, {$push: push});
            },

            get_paths: function() {
                return paths;
            },

            initialize: function() {}
        };
    }());
window.ideaListView = ideaListView;
    Template.ideaList.helpers({
        root_ideas: ideaListView.get_root_ideas.bind(ideaListView)
        ,root_id: function(){
            return _.extend({root_id: this.root_id || this._id}, this);
        }
    });
});
