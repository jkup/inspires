// Taken from: http://ondrej-kvasnovsky.blogspot.com/2013/07/meteor-how-to-login-with-github-account.html

isProdEnv = function() {
	if (process.env.ROOT_URL == "http://localhost:3000") {
		return false;
	} else {
		return true;
	}
}

Accounts.loginServiceConfiguration.remove({
	service: 'google'
});

Accounts.loginServiceConfiguration.remove({
	service: 'facebook'
});

Accounts.loginServiceConfiguration.remove({
	service: 'twitter'
});

Accounts.loginServiceConfiguration.remove({
	service: 'github'
});

if (isProdEnv()) {
	Accounts.loginServiceConfiguration.insert({
		service: 'github',
		clientId: '00000',
		secret: '00000'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'twitter',
		consumerKey: 'OCWQN0X5drF7USLaJKdvpg',
		secret: 'ZgB6UEB5JzcILiQ9vkUZiet3TEQshNIwxwIublenm8'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'google',
		clientId: '00000',
		secret: '00000'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'facebook',
		appId: '600319020034141',
		secret: '0fff37f9e9ca6ecde580cdf37b3e4b84'
	});
} else {
	// dev environment
	Accounts.loginServiceConfiguration.insert({
		service: 'github',
		clientId: '11111',
		secret: '11111'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'twitter',
		consumerKey: 'OCWQN0X5drF7USLaJKdvpg',
		secret: 'ZgB6UEB5JzcILiQ9vkUZiet3TEQshNIwxwIublenm8'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'google',
		clientId: '11111',
		secret: '11111'
	});
	Accounts.loginServiceConfiguration.insert({
		service: 'facebook',
		appId: '600319020034141',
		secret: '0fff37f9e9ca6ecde580cdf37b3e4b84'
	});
}

var userDefaults = function(name, email) {
    this.ideas = {
        opened: []
        ,voted: {}
    };
};

Accounts.onCreateUser(function(options, user) {
	if (user.services) {
		if (options.profile) {
			user.profile = options.profile
		}

		_.extend(user, new userDefaults(options.name, options.email));

		var service = _.keys(user.services)[0];
		var email = user.services[service].email;
		if (!email) {
			if (user.emails) {
				email = user.emails.address;
			}
		}
		if (!email) {
			email = options.email;
		}
		if (!email) {
			// if email is not set, there is no way to link it with other accounts
			return user;
		}
		// see if any existing user has this email address, otherwise create new
		var existingUser = Meteor.users.findOne({
			'emails.address': email
		});
		if (!existingUser) {
			// check for email also in other services
			var existingGitHubUser = Meteor.users.findOne({
				'services.github.email': email
			});
			var existingGoogleUser = Meteor.users.findOne({
				'services.google.email': email
			});
			var existingTwitterUser = Meteor.users.findOne({
				'services.twitter.email': email
			});
			var existingFacebookUser = Meteor.users.findOne({
				'services.facebook.email': email
			});
			var doesntExist = !existingGitHubUser && !existingGoogleUser && !existingTwitterUser && !existingFacebookUser;
			if (doesntExist) {
				// return the user as it came, because there he doesn't exist in the DB yet
				return user;
			} else {
				existingUser = existingGitHubUser || existingGoogleUser || existingTwitterUser || existingFacebookUser;
				if (existingUser) {
					if (user.emails) {
						// user is signing in by email, we need to set it to the existing user
						existingUser.emails = user.emails;
					}
				}
			}
		}

		// precaution, these will exist from accounts-password if used
		if (!existingUser.services) {
			existingUser.services = {
				resume: {
					loginTokens: []
				}
			};
		}

		// copy accross new service info
		existingUser.services[service] = user.services[service];
		existingUser.services.resume.loginTokens.push(
			user.services.resume.loginTokens[0]
		);

		// even worse hackery
		Meteor.users.remove({
			_id: existingUser._id
		}); // remove existing record
		return existingUser; // record is re-inserted
	}
});