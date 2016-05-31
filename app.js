
//modules
var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

//connect to server
var sequelize = new Sequelize ('babettehoogendoorn', 'babettehoogendoorn', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

//connect to jade
app.set('views', './src/views');
app.set('view engine', 'jade');

//set table in database
var User = sequelize.define('user', {
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING,
  primaryKey: true
});

app.use(session({
	secret: 'oh wow very secret much security',
	resave: true,
	saveUninitialized: false
}));

app.get('/', function (request, response) {
	response.render('index', {
		//message: request.query.message,
		//user: request.session.user
	});
});

 /* app.get('/profile', function (request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		response.render('profile', {
			user: user
		});
	}
}); */

app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		if (user !== null && request.body.password === user.password) {
			request.session.user = user;
			response.redirect('/profile');
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});

app.get('/logout', function (request, response) {
	request.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

/* sequelize.sync({force: true}).then(function () {
	User.create({
		name: "stabbins",
		email: "yes@no",
		password: "not_password"
	})
	User.create({
		name: "Babette",
		email: "babettehoogendoorn@hotmail.com",
		password: "babje"
	})
	User.create({
		name: "Sharonita",
		email: "sharon@guapa.nl",
		password: "rubia"
	})
	.then(function () { */

	//});
/*}, function (error) {
	console.log('sync failed: ');
	console.log(error);
}); */

var server = app.listen(7000, function () {
	console.log('Example app listening on port: ' + server.address().port);
});
