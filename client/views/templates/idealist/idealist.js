define('ideaListView', ['notificationsHelper', 'ideasHelper'], function(nHelper, ideasHelper) {
    'use strict'

    // Outer most selector
    jQuery(document)

        // Setup custom events
        .on('add_idea.idea_list', function(e, objectId, idea_title) {
            // If no input from user
            if (!idea_title) return;

            // See if we are adding a root idea or child idea
            if (0 === objectId) {
                ideasHelper.add_root(idea_title);
            } else {
                // Add child
                ideasHelper.add_child(objectId, idea_title);

                // Auto open children
                jQuery(this).trigger('expand_idea', objectId);
            }
            ideaListView.close_popups();
            nHelper.notify('Idea added', {type: nHelper.SUCCESS, auto_dismiss: true});
        })
        .on('hide_idea.idea_list', function(e, objectId, idea_title) {
            var open_popups = ideaListView.get_popups();
                jQuery.each(open_popups, function(key, popup) {
                    if(jQuery(popup.input).val().length === 0) {
                        open_popups.splice(key, 1);
                        popup.button.popover('hide');
                    }
                });
        })
        .on('delete_idea.idea_list', function(e, objectId) {
            ideasHelper.remove_idea(objectId);
        })
        .on('expand_idea.idea_list', function(e, objectId) {
            if (!Meteor.user()) {
                var $target = jQuery(e.target);
                $target.find('button span').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
                return jQuery('[data-children-for-id=' +$target.data('id')+ ']').slideDown();
            }

            Meteor.call('userRecordOpenedIdea', objectId);

            // Push the item into the cache
            ideasHelper.opened_cache.push(objectId);
        })
        .on('collapse_idea.idea_list', function(e, objectId) {
            if (!Meteor.user()) {
                var $target = jQuery(e.target);
                $target.find('button span').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
                return jQuery('[data-children-for-id=' +$target.data('id')+ ']').slideUp();
            }

            Meteor.call('userPluckOpenedIdea', objectId);

            // Pluck the item out of the cache
            ideasHelper.opened_cache.splice(ideasHelper.opened_cache.indexOf(objectId), 1);
        })
        .on('vote.idea_list', function(e, vote, objectId) {
            if (!Meteor.user()) {
                nHelper.notify('Please login to vote.', {type: nHelper.WARNING, auto_dismiss: true});
            } else {
                var path = ideasHelper.get_path_to_object(objectId);
                Meteor.call('ideaVote', vote, objectId, path);
            }
        })
        ;

    var ideaListView = (function() {
        var open_popups = [];

        return {
            get_popups: function() {
                return open_popups;
            }

            ,close_popups: function() {
                this.$new_idea_btns.popover('hide');
                open_popups = [];
            }

            /**
             * Sorting ideas algorithm
             */
            ,sort_ideas: function() {
                jQuery('[data-sortable]').each(function() {
                    var $this = jQuery(this)
                        ,sortable_tag = $this.data('sortable')
                        ,children = $this.children().toArray()
                        ,$current, $sibling, move_before
                        ;

                    // Loop through all children
                    for ( var i = 1; i < children.length; i++ ) {
                        if (i === 0) continue;
                        move_before = null;
                        $current = jQuery(children[i]);

                        // Go through it's previous siblings and find where this element goes in the tree
                        for (var j = i - 1; j >= 0; j--) {
                            $sibling = jQuery(children[j]);

                            if ($current.data(sortable_tag) > $sibling.data(sortable_tag)) {
                                move_before = {
                                    key: j
                                    ,el: $sibling
                                };
                            }
                        };

                        // Move element to the correct position
                        if (move_before) {
                            // Reorganize children array
                            children.splice(move_before.key, 0, children.splice(i, 1)[0]);
                            // Move element
                            move_before.el.before($current);
                        };
                    }
                });
            }

            // Initialize
            ,initialize: function() {
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
                        var $el = jQuery('.form[data-id~=' + objectId + ']:visible').find('input');
                        $el.focus();
                        open_popups.push({
                            button: jQuery(this),
                            input: $($el[0])
                        });
                    })
                    ;
                });

                // Trigger sort
                this.sort_ideas();
            }
        };
    }());

    // Template helpers

    Template.ideaList.rendered = ideaListView.initialize.bind(ideaListView);

    Template.ideaList.helpers({
        root_ideas: ideasHelper.get_root_ideas.bind(ideasHelper)
    });

    Template.ideaItem.helpers({
        show_children: ideasHelper.is_idea_opened.bind(ideasHelper)
        ,votes_average: function() {
            return this.votes.up - this.votes.down;
        }
    });

    Template.options.helpers({
        ownsIdea: function() {
            return ideasHelper.is_my_idea(this.owner);
        }
        ,votes_average: function() {
            return this.votes.up - this.votes.down;
        }
        ,up_vote_active: function() {
            return ideasHelper.vote_type_for_objectID_selected(this._id, 'up');
        }
        ,down_vote_active: function() {
            return ideasHelper.vote_type_for_objectID_selected(this._id, 'down');
        }
    });

    return ideaListView;
});