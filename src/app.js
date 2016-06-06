
//modules
var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var app = express();

//connect to server
var sequelize = new Sequelize ('blog', 'babettehoogendoorn', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

//connect to jade
app.set('views', './views');
app.set('view engine', 'jade');

//allow to connect to custom.css
// app.use(bodyParser.urlencoded({extended: true}))
// app.use(express.static('./resources/'));

//set table in databse for user, message and comment (in models)
var User = sequelize.define('user', {
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING,
});

var Post = sequelize.define('post', {
	title: Sequelize.STRING,
	body: Sequelize.TEXT
});

var Comment = sequelize.define('comment', {
	body: Sequelize.TEXT
});

//relation between tables
User.hasMany(Post);
User.hasMany(Comment);
Comment.belongsTo(User);
Post.belongsTo(User);
Post.hasMany(Comment);
Comment.belongsTo(Post);

//synching with database + create two users automatically
sequelize.sync({force: true}).then( function() { //after models
	console.log('sync done')
	User.create({
		name: 'bab',
		email: 'bab',
		password: 'bab'
	}).then(function(thebab){
		console.log('bab is alive');
		thebab.createPost({
			title: 'Bab says hello',
			body: 'Hallo, ik ben bab'
		})
	})
	User.create({
		name: 'joep',
		email: 'joep',
		password: 'joep'
	}).then(function(thejoep){
		console.log('joep is alive');
		thejoep.createPost({
			title: 'Joep says hello',
			body: 'Hallo, ik ben joep'
		})
	})
});



//activate session
app.use(session({
	secret: 'oh wow very secret much security',
	resave: true,
	saveUninitialized: false
}));

app.use(logger('Dev'));

//load index page
app.get('/', function (request, response) {
	response.render('index', {
		user: request.session.user
	});
});

//load register page
app.get('/register', function(request, response){
	response.render('register')
});

//stores data in database
app.post('/register', bodyParser.urlencoded({extended: true}), function (request, response) {
	User.create({
		name:request.body.name,
		email: request.body.email,
		password:request.body.password
	}).then (function () {
		response.redirect('/')
	});
});

//load login page
app.get('/login', function (request, response) {
	response.render('login', {
		Message: request.query.message,
		User: request.query.user
	});
});

app.get('/users/:id', function (request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		response.render('users/profile', {
			user: user,
		});
	};
});

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
			response.redirect('/');
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});

//create a logout option
app.get('/logout', function (request, response) {
	request.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

//createpost
app.get('/createpost', function (request, response) {
	response.render('createpost', {
	});
});


app.post('/createpost', bodyParser.urlencoded({extended: true}), function (request, response) {
	User.findOne({
		where: {
			id: request.session.user.id
		}
	}).then(function (theUser){
		theUser.createPost({
			title: request.body.title,
			body: request.body.message
		}).then (function () {
			response.redirect('/posts')
		});
	});
});

//list own posts
app.get('/posts', function (request, response) {

	User.findOne({
		where: {
			id: request.session.user.id
		}
	}).then(function (theUser){
		theUser.getPosts({
			include:[Comment]
		}).then(function (results) {
			// response.send(results)
			response.render('posts', {
				allOwnPosts:results
			});
		});
	});
});


//list of all posts
app.get('/allposts', function (request, response) {

	Post.findAll({
		include: [
			{model: User},
			{model: Comment,
			include: {model: User}}
		]
	}).then(function (posts) {
		response.render('allposts', {
			allPosts: posts
		});
		// response.send(posts)
	});
});

//list comments in all posts
app.post('/comments', bodyParser.urlencoded({extended: true}), function (request, response) {
	Promise.all([
		Post.findOne({ where: { id: request.body.id } }),
		User.findOne({ where: { id: request.session.user.id } })
	]).then(function(theData){
		theData[1].createComment ({ body: request.body.comment }).then(function(theComment){
			theComment.setPost(theData[0]).then(function(){
				response.redirect('/allposts')
			});
		});
	});
});


//look for specific post
app.get('/post/:id', function (request, response) {
	var postid = request.params.id
	Post.findAll({
		where: {
			id:postid
		},
		include: [User, Comment]
	}).then(function(posts) {
		response.render('onepost', {
			posts:posts
		});
	});
});


var server = app.listen(7000, function () {
	console.log('Hallo ik ben b')
	console.log('Example app listening on port: ' + server.address().port);
});
