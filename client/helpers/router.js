Router.configure({
    layoutTemplate: 'layout'
});

Router.map(function() {
    this.route('home', {
        path: '/'
        ,controller: 'HomeController'
        ,action: 'show'
    });

    this.route('notFound', {
        path: '*'
        ,layoutTemplate: 'error_404'
    });
});