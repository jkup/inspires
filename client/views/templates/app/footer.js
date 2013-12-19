jQuery('footer')
	.on('click', '[data-behavior~=change-route]', function(e) {
		e.preventDefault();
		Router.go(jQuery(this).prop('href'));
		return false;
	});

Template.footer.helpers({
	year: function() {
		return new Date().getFullYear();
	}
});