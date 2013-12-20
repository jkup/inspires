'use strict';

// Outer most selector
jQuery(document)

    // Setup DOM listeners
    .on('click', '[data-behavior~=close]', function() {
        jQuery(jQuery(this).attr('data-close-element')).slideUp();
    })
    .on('submit', '[data-behavior~=add-idea]', function(e) {
        var $this = jQuery(this);
        e.preventDefault();

        $this.trigger('add_idea', [$this.data('id'), $this.find('input:first').val()]);
    })
    .on('blur', '[data-behavior~=add-idea]', function() {
        var $this = jQuery(this);

        $this.trigger('hide_idea', [$this.data('id'), $this.find('input:first').val()]);
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
    ;