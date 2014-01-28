'use strict';

Template.header.helpers({
	about_page: function() {
		return Router.current().template === 'about';
	}
});

Template._loginButtonsLoggedOutAllServices.helpers({
	services: function() {
		var services = Accounts.oauth.serviceNames()
			,_return = []
			,capitalized = ''
			;

		for (var i = services.length - 1; i >= 0; i--) {
			capitalized = services[i].substr(1);

			_return.push({
				configured: true
				,name: services[i]
				,capitalizedName: services[i][0].toUpperCase() + capitalized
			});
		}

		return _return;
	}
});

Template._loginButtonsLoggedIn.helpers({
	dropdown: false
});

Template._loginButtonsLoggedInSingleLogoutButton.rendered = function() {
	jQuery('#login-buttons-logout').html('Logout');
};