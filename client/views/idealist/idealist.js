define('ideaListView', ['notificationsHelper', '_Idea'], function(nHelper, Idea) {
    String.prototype.repeat = function(num) {
        return new Array(num + 1).join(this);
    }

    // Outer most selector
    jQuery(document)

        // Setup DOM listeners
        .on('submit', '[data-behavior~=add-idea]', function(e) {
            var $this = jQuery(this);
            e.preventDefault();

            $this.trigger('add_idea', [$this.data('id'), $this.find('input:first').val()]);
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
        .on('click', '[data-behavior~=vote-up]', function() {
            var $this = jQuery(this);
            $this.trigger('vote', ['up', $this.data('id')]);
        })
        .on('click', '[data-behavior~=vote-down]', function() {
            var $this = jQuery(this);
            $this.trigger('vote', ['down', $this.data('id')]);
        })

        // Setup custom events
        .on('add_idea.idea_list', function(e, objectId, idea_title) {
            // If no input from user
            if (!idea_title) return;

            // See if we are adding a root idea or child idea
            if (0 === objectId) {
                ideaListView.add_root(idea_title);
            } else {
                // Auto open children
                jQuery(this).trigger('expand_idea', objectId);

                // Add child
                ideaListView.add_child(objectId, idea_title);
            }

            this.$new_idea_btns.popover('hide');
            nHelper.notify('Idea added', {type: nHelper.SUCCESS, auto_dismiss: true});
        })
        .on('expand_idea.idea_list', function(e, objectId) {
            Meteor.call('userRecordOpenedIdea', objectId);

            // Push the item into the cache
            ideaListView.opened_cache.push(objectId);
        })
        .on('collapse_idea.idea_list', function(e, objectId) {
            Meteor.call('userPluckOpenedIdea', objectId);

            // Pluck the item out of the cache
            ideaListView.opened_cache.splice(ideaListView.opened_cache.indexOf(objectId), 1);
        })
        .on('delete_idea.idea_list', function(e, objectId) {
            ideaListView.remove_idea(objectId);
        })
        .on('vote.idea_list', function(e, vote, objectId) {
            var path = ideaListView.get_path_to_object(objectId);
            Meteor.call('ideaVote', vote, objectId, path);
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
                // Parse arguments
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

                // Add to paths cache
                paths[args[0]._id] = {
                    depth: args[2]
                    ,root_id: args[1]
                    ,select_path: args[5]
                    ,push_path: args[3]
                    ,remove_path: args[4]
                };

                // Go through its children
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

            initialize: function() {
                this.$new_idea_btns = jQuery('[data-behavior~=show-add-idea-form]');
                this.$new_idea_btns.each(function(){
                    var $this = jQuery(this)
                        ,objectId = $this.data('id')
                        ;

                    $this.popover({
                        placement: 'auto top'
                        ,container: objectId ? '.name-options-wrapper[data-id~=' + objectId + ']' : false
                        ,html: true
                        ,content: Template.newIdea({
                            object_id: $this.data('id')
                        })
                    })
                    .on('shown.bs.popover', function() {
                        jQuery('.form[data-id~=' + objectId + ']:visible input').focus();
                    })
                    ;
                });
            }
        };
    }());

    // Template helpers

    Template.ideaList.rendered = ideaListView.initialize.bind(ideaListView);

    Template.ideaList.helpers({
        root_ideas: ideaListView.get_root_ideas.bind(ideaListView)
    });

    Template.ideaItem.helpers({
        show_children: ideaListView.is_idea_opened.bind(ideaListView)
    });

    Template.options.helpers({
        ownsIdea: function() {
            return ideaListView.is_my_idea(this.owner)
        }
        ,votes_average: function() {
            return this.votes.up - this.votes.down;
        }
        ,up_vote_active: function() {
            var voted = Meteor.user().ideas.voted[this._id];
            if (voted && voted === 'up') {
                return 'active'
            }
        }
        ,down_vote_active: function() {
            var voted = Meteor.user().ideas.voted[this._id];
            if (voted && voted === 'down') {
                return 'active'
            }
        }
    });

    return ideaListView;
});
