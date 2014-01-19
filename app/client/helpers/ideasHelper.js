define('ideasHelper', ['_Idea'], function(Idea) {
    'use strict';

    var ideasHelper = (function() {
        // This is here until this happens: https://jira.mongodb.org/browse/SERVER-831
        var paths = {};

        return {
            group_ideas: function() {
                var ideas = this.get_root_ideas()
                    ,groups = []
                    ,current_group = {root_ideas: [], date_formatted: false}
                    ;

                for (var i = 0; i < ideas.length; i++) {
                    // Check to see if we need to create a new group
                    if (current_group.date_formatted !== ideas[i].updatedOn.getDate() +'/'+ ideas[i].updatedOn.getMonth() +'/'+ ideas[i].updatedOn.getFullYear()) {
                        if (current_group.root_ideas.length) {
                            groups.push(current_group);
                        }

                        current_group = {
                            root_ideas: []
                            ,date: ideas[i].updatedOn
                            ,date_formatted: ideas[i].updatedOn.getDate() +'/'+ ideas[i].updatedOn.getMonth() +'/'+ ideas[i].updatedOn.getFullYear()
                        };
                    }

                    // Push idea to the current group
                    current_group.root_ideas.push(ideas[i]);
                }

                groups.push(current_group);

                return groups;
            }

            ,get_root_ideas: function() {
                var _ideas = Ideas.find({}, {sort: {updatedOn: -1}}).fetch()
                    ,that = this
                    ;

                // Run in background
                setTimeout(function() {
                    for (var i = 0; i < _ideas.length; i++) {
                        that.build_paths_recursively(_ideas[i]);
                    }
                });

                return _ideas;
            }

            ,get_root_idea: function(objectId) {
                return Ideas.findOne({_id: objectId});
            }

            /**
             * Recursion is ugly...
             */
            ,build_paths_recursively: function() {
                // Parse arguments
                var args = _.extend([
                        null // idea
                        ,(arguments[0] ? arguments[0]._id : null) // root_id
                        ,0 // depth
                        ,'children' // push_path
                        ,'children' // remove_path
                        ,'' // select_path
                        ], arguments)
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
                }
            }

            ,get_path_to_object: function(objectId) {
                // If path to object isn't set then build from db
                if (!paths[objectId]) {
                    this.build_paths_recursively(this.get_root_idea(objectId));
                }

                return paths[objectId];
            }

            ,add_root: function(idea_title) {
                // Let's check first that this idea doesn't already exist
                if (Ideas.find({title: idea_title}).fetch().length) {
                    throw 'This idea already exists!';
                }

                var ObjectId = Ideas.insert(new Idea({title: idea_title, is_root: true}));
                this.build_paths_recursively(this.get_root_idea(ObjectId));
            }

            ,add_child: function(objectId, idea_title) {
                var path = this.get_path_to_object(objectId)
                    ,find = {}
                    ,push = {}
                    ;

                if (!path) {throw 'Invalid parent idea.';}

                find[path.select_path + 'children.title'] = idea_title;
                find._id = path.root_id;
                if (Ideas.find(find).fetch().length) {
                    throw 'This idea already exists!';
                }

                push[path.push_path] = new Idea({title: idea_title});
                Ideas.update({'_id': new Meteor.Collection.ObjectID(path.root_id).toHexString()}, {$push: push, $set: {updatedOn: new Date()}});

                // Update paths
                this.build_paths_recursively(this.get_root_idea(path.root_id));
            }

            ,remove_idea: function(objectId) {
                // Delete
                Meteor.call('ideaDelete', objectId, this.get_path_to_object(objectId));
            }

            ,get_paths: function() {
                return paths;
            }

            // User

            ,is_idea_opened: function(objectId) {
                var user = Meteor.user();

                if (!user) {return false;}

                if (!this.opened_cache) {
                    this.opened_cache = user.ideas.opened;
                }

                // TODO: The second part of this if shouldn't be here, but for some reason grabbing the user after a child was added wasn't pulling the latest data
                return (this.opened_cache.indexOf(objectId) !== -1 || this.should_open === objectId) && this.should_not_open !== objectId;
            }

            ,is_my_idea: function(owner) {
                var user = Meteor.user();
                return user && user._id === owner;
            }

            ,vote_type_for_objectID_selected: function(objectId, type) {
                var user = Meteor.user(), voted;
                if (!user || !user.ideas || !user.ideas.voted) {return false;}

                voted = user.ideas.voted[objectId];
                if (voted && voted === type) {
                    return 'active';
                }
            }
        };
    }());

    return ideasHelper;
});
