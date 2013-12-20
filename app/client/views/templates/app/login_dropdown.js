'use strict';

// This is hideous.. but whatever
jQuery(document)
	.on('click', 'a.login-link-text', function() {
		if (jQuery(this).next()[0]) {
			Accounts._loginButtonsSession.closeDropdown();
		}
	})
	;