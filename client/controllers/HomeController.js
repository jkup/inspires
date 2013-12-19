(function(){
    var called_count = 0;

    HomeController = RouteController.extend({
        show: function() {
            // Haky so that the landing page doesn't flash real quick before the user is loaded
            if (called_count === 0) {
                Meteor.user(); // Ask for the user the first time.. it will be empty because we are loading
                called_count++;
                this.render('empty');
            } else {
                this.render(Meteor.user() ? 'ideaList' : 'landing');
            }
        }
    });
})();