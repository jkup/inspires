'use strict';

Router.configure({
    layoutTemplate: 'layout'
});

Router.map(function() {
    this.route('home', {
        path: '/'
        ,controller: 'HomeController'
        ,action: 'show'
        ,waitOn: function() {
            return Meteor.subscribe('userData');
        }
    });

    this.route('private_idea', {
        path: '/[a-zA-Z0-9]{12,}/[a-zA-Z0-9]{24}/?'
        ,controller: 'HomeController'
        ,action: 'show'
        ,waitOn: function() {
            return Meteor.subscribe('userData');
        }
    });

    this.route('about', {
        path: '/about'
        ,layout: 'about'
    });

    this.route('notFound', {
        path: '*'
        ,layoutTemplate: 'error_404'
    });
});