define('ideaListView', ['notificationsHelper', '_Idea'], function(nHelper, Idea) {
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
            var $this = jQuery(this)
                ,behaviors = $this.data('behavior').split(' ')
                ;

            // Remove expand-idea from behaviors and add collapse-idea
            behaviors.splice(behaviors.indexOf('expand-idea'), 1);
            behaviors.push('collapse-idea');
            $this.attr({'data-behavior': behaviors.join(' ')});

            $this.trigger('expand_idea', $this.data('id'));
        })
        .on('click', '[data-behavior~=collapse-idea]', function() {
            var $this = jQuery(this)
                ,behaviors = $this.data('behavior').split(' ')
                ;

            // Remove collapse-idea from behaviors and add expand-idea
            behaviors.splice(behaviors.indexOf('collapse-idea'), 1);
            behaviors.push('expand-idea');
            $this.attr({'data-behavior': behaviors.join(' ')});

            $this.trigger('collapse_idea', $this.data('id'));
        })
        .on('click', '[data-behavior~=delete-idea]', function() {
            var $this = jQuery(this);
            $this.trigger('delete_idea', $this.data('id'));
        })


        // Setup custom events
        .on('add_idea.idea_list', function(e) {
            var idea_title = prompt('Idea title:')
                ,$this = jQuery(e.target)
                ,objectId = $this.data('id')
                ;

            // If no input from user
            if (!idea_title) return;

            // See if we are adding a root idea or child idea
            if (0 === objectId) {
                ideaListView.add_root(idea_title);
            } else {
                // Auto open children
                $this.trigger('expand_idea', objectId);

                // Add child
                ideaListView.add_child(objectId, idea_title);
            }

            nHelper.notify('Idea added', {type: nHelper.SUCCESS, auto_dismiss: true});
        })
        .on('expand_idea.idea_list', function(e, objectId) {
            jQuery(e.target).siblings('ul').slideDown();

            Meteor.call('userRecordOpenedIdea', objectId);

            // Purge that cache
            delete ideaListView.opened_cache;
            ideaListView.should_open = objectId;
        })
        .on('collapse_idea.idea_list', function(e, objectId) {
            jQuery(e.target).siblings('ul').slideUp();

            Meteor.call('userPluckOpenedIdea', objectId);

            // Purge that cache
            delete ideaListView.opened_cache;
            ideaListView.should_not_open = objectId;
        })
        .on('delete_idea.idea_list', function(e, objectId) {
            ideaListView.remove_idea(objectId);
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
                        that.build_paths_recursively(ideas[i]);
                    };
                });

                return _ideas;
            },

            get_root_idea: function(objectId) {
                return Ideas.findOne({_id: objectId});
            },

            build_paths_recursively: function() {
                var args = _.extend([
                        null // idea
                        ,(arguments[0] ? arguments[0]._id : null) // root_id
                        ,0 // depth
                        ,'children' // push_path
                        ,'children' // remove_path
                        ,'' // select_path
                        ], arguments)
                    ,select_path = 'children.'.repeat(args[2])
                ;

                // Add root path
                paths[args[0]._id] = {
                    depth: args[2]
                    ,root_id: args[1]
                    ,select_path: args[5]
                    ,push_path: args[3]
                    ,remove_path: args[4]
                };

                for (var i = 0; i < args[0].children.length; i++) {
                    this.build_paths_recursively(
                        args[0].children[i] // Idea
                        ,args[1] // root_id
                        ,args[2] + 1 // depth
                        ,args[3] + '.' + i + '.children' // push_path
                        ,args[3] // remove path
                        ,args[3] + '.' + i + '.' // select_path
                    );
                };
            },

            get_path_to_object: function(objectId) {
                // If path to object isn't set then build from db
                if (!paths[objectId]) {
                    this.build_paths_recursively(this.get_root_idea(objectId));
                }

                return paths[objectId];
            },

            add_root: function(idea_title) {
                var ObjectId = Ideas.insert(new Idea({title: idea_title}));
                this.build_paths_recursively(this.get_root_idea(ObjectId));
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

                // Update paths
                this.build_paths_recursively(this.get_root_idea(path.root_id));
            },

            remove_idea: function(objectId) {
                var path = ideaListView.get_path_to_object(objectId);
                // Delete
                Meteor.call('ideaDelete', objectId, path);
                // Update paths
                ideaListView.build_paths_recursively(ideaListView.get_root_idea(path.root_id));
            },

            get_paths: function() {
                return paths;
            },

            // User

            is_idea_opened: function(objectId) {
                if (!this.opened_cache) {
                    this.opened_cache = Meteor.user().ideas.opened;
                }

                // TODO: The second part of this if shouldn't be here, but for some reason grabbing the user after a child was added wasn't pulling the latest data
                return (this.opened_cache.indexOf(objectId) !== -1 || this.should_open == objectId) && this.should_not_open !== objectId;
            },

            is_my_idea: function(owner) {
                return Meteor.user()._id === owner;
            },

            initialize: function() {}
        };
    }());

    // Template helpers

    Template.ideaList.helpers({
        root_ideas: ideaListView.get_root_ideas.bind(ideaListView)
    });

    Template.ideaItem.helpers({
        show_children: ideaListView.is_idea_opened.bind(ideaListView)
        ,ownsIdea: function() { return ideaListView.is_my_idea(this.owner) }
    });
    return ideaListView;
});
