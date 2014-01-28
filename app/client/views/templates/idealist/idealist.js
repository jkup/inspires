define('ideaListView', ['notificationsHelper', 'ideasHelper'], function(nHelper, ideasHelper) {
    'use strict';

    var date = new Date()
        ,now_unix = Math.floor(date.getTime() / 1000)
        ,midnigh_today_unix = Math.floor(new Date((date.getMonth() + 1) +'/'+ date.getDate() +'/'+ date.getFullYear()).getTime() / 1000)
        ;

    // Outer most selector
    jQuery(document)

        // Setup custom events
        .on('show_idea_form', function(e, el, id) {
            var $el = jQuery(el);

            // If has class then remove
            if ($el.hasClass('adding-idea')) {
                $el.removeClass('adding-idea').find('div.form-wrapper').remove();
            } else {
                // Remove old form
                jQuery('.idea-group div.form-wrapper').parent().removeClass('adding-idea').end().remove();
                // Add new form
                $el.addClass('adding-idea').append(Template.newIdea({
                    object_id: id
                })).find('div.form-wrapper input').focus();
            }
        })
        .on('add_idea.idea_list', function(e, objectId, idea_title, is_private) {
            var newObjectId;

            // If no input from user
            if (!idea_title) {return;}

            // See if we are adding a root idea or child idea
            if (0 === objectId) {
                newObjectId = ideasHelper.add_root(idea_title, is_private);

                if (is_private) {
                    nHelper.notify('Share your idea, copy this link: ' + ideasHelper.get_share_url(newObjectId), {type: nHelper.SUCCESS});
                }
            } else {
                // Add child
                ideasHelper.add_child(objectId, idea_title);

                // Auto open children
                jQuery(this).trigger('expand_idea', objectId);
            }
            nHelper.notify('Idea added', {type: nHelper.SUCCESS, auto_dismiss: true});
        })
        .on('root_idea_focus.idea_list', function(e) {
            jQuery(e.target).find('[data-toggle=true]').slideDown();
        })
        .on('root_idea_blur.idea_list', function(e) {
            var $this = jQuery(e.target)
                ,$input = $this.find('input:first')
                ;

            // Hide if there's no value
            if (!$input.val()) {
                $this.find('[data-toggle=true]').slideUp();
            }
        })
        .on('share_idea.idea_list', function(e, share_link) {
            if (!share_link) {return;}

            // Display link for copy
            ideaListView.modal({
                header: 'Copy share link'
                ,body: '<input type="text" class="share-link" value="' + share_link + '" />'
            });
        })
        .on('delete_idea.idea_list', function(e, objectId) {
            if (confirm('Are you sure?')) {
                ideasHelper.remove_idea(objectId);
            }
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
                nHelper.notify('Please login to vote.', {type: nHelper.WARNING, auto_dismiss: true, dismiss_after: 1500});
            } else {
                var path = ideasHelper.get_path_to_object(objectId);
                Meteor.call('ideaVote', vote, objectId, path);
            }
        })
        ;

    var ideaListView = (function() {
        return {
            /**
             * Sorting ideas algorithm
             */
            sort_ideas: function() {
                jQuery('[data-sortable]').each(function() {
                    var $this = jQuery(this)
                        ,sortable_tag = $this.data('sortable')
                        ,children = $this.children().toArray()
                        ,$current, $sibling, move_before
                        ;

                    // Loop through all children
                    for ( var i = 1; i < children.length; i++ ) {
                        if (i === 0) {continue;}
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
                        }

                        // Move element to the correct position
                        if (move_before) {
                            // Reorganize children array
                            children.splice(move_before.key, 0, children.splice(i, 1)[0]);
                            // Move element
                            move_before.el.before($current);
                        }
                    }
                });
            }

            ,modal: function(data) {
                var html = '';

                if (typeof data === 'string') {
                    data = {body: data};
                }

                if (data.header) {
                    html += '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 id="modal-label" class="modal-title">' + data.header + '</h4></div>';
                }

                if (data.body) {
                    html += '<div class="modal-body">' + data.body + '</div>';
                }

                if (data.footer) {
                    html += '<div class="modal-footer">' + data.footer + '</div>';
                }

                this.modal_container.find('.modal-content:first').html(html);
                this.modal_container.modal();
                setTimeout(function(){
                    var $el = ideaListView.modal_container.find('input[type="text"]:first');
                    if ($el[0]) {
                        $el.focus().select();
                    }
                }, 500);
            }

            // Initialize
            ,initialize: function() {
                // Trigger sort
                this.sort_ideas();

                // Keep track of modal
                this.modal_container = jQuery('[data-modal=small]');
            }
        };
    }());

    // Template helpers

    Template.ideaGroups.helpers({
        idea_groups: ideasHelper.group_ideas.bind(ideasHelper)
    });

    Template.ideaList.rendered = ideaListView.initialize.bind(ideaListView);

    Template.ideaList.helpers({
        idea_count: function() {
            var length = this.root_ideas.length;
            return length + ' Idea' + (length === 1 ? '': 's');
        }
        ,date_display: function() {
            var unix_date;

            if (!this.date) {return;}

            unix_date = Math.floor(this.date.getTime() / 1000);
            // Check if ideas were submitted today
            if (midnigh_today_unix <= unix_date) {
                return 'Today';
            // If this group was submitted within the last week. 604800 === 1 week
            } else if (now_unix - unix_date <= 604800) {
                return moment(this.date).fromNow();
            } else {
                return 'on ' + moment(this.date).format('MMM Do, YYYY');
            }
        }
    });

    function escapeChar(chr) {
        var escape = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
          "`": "&#x60;"
        };

        return escape[chr] || '&amp;';
    }

    Template.ideaItem.helpers({
        title: function() {
            var urlregex = new RegExp("^(http|https|ftp)://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*$")
                ,string_parts = this.title.split(' ')
                ,matches
                ;

            for (var i = 0; i < string_parts.length; i++) {
                matches = string_parts[i].match(urlregex);
                if (!matches) {
                    // Escape to prevent xss
                    string_parts[i] = string_parts[i].replace(/[&<>"'`]/g, escapeChar);
                } else {
                    string_parts[i] = '<a href="' + matches[0] + '" rel="nofollow">' + matches[0] + '</a>';
                }
            }

            return string_parts.join(' ');
        }
        ,share_link: function() {
            return ideasHelper.get_share_url(this._id);
        }
        ,class: function() {
            var user = Meteor.user();
            return (user && this.owner === user._id) ? ' idea-owner' : '';
        }
        ,show_children: ideasHelper.is_idea_opened.bind(ideasHelper)
        ,votes_average: function() {
            return this.votes.up - this.votes.down;
        }
        ,sub_idea_count: function() {
            var length = this.children.length;
            return length + ' sub idea' + (length === 1 ? '': 's');
        }
    });

    Template.newIdea.helpers({
        object_id: function() {
            return this.object_id || 0;
        }
        ,is_root: function() {
            return typeof this.object_id === 'undefined';
        }
        ,add_idea_text: function() {
            if (this.object_id) {
                return 'Your sub idea...';
            } else {
                return 'Your idea...';
            }
        }
        ,add_btn_text: function() {
            if (this.object_id) {
                return 'Add sub idea';
            } else {
                return 'Add idea';
            }
        }
        ,class: function() {
            if (this.object_id) {
                return ' sub-idea';
            }
        }
    });

    Template.options.helpers({
        canDelete: function() {
            var user = Meteor.user();
            return (ideasHelper.is_my_idea(this.owner) && !this.children) || (user.permissions && user.permissions.indexOf('admin') !== -1);
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