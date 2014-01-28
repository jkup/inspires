'use strict';

jQuery(document)
	.on('click', '[data-behavior~=change-route]', function(e) {
        if (Router.current().template === 'private_idea') {
            window.location.href = jQuery(this).prop('href');
            return true;
        } else {
            e.preventDefault();
            Router.go(jQuery(this).prop('href'));
            return false;
        }
	});

Template.footer.helpers({
	year: function() {
		return new Date().getFullYear();
	}
});