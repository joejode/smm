
var envKey = process.env.NODE_ENV || "local";
var environments = {
	local: {
		port: 8888
	},
	heroku: {
		port: 80
	}
};
environments.development = environments.local; 

var env = environments[envKey];
var express = require('express');
var app = express();
var http 	= require('http').Server(app),
	io 		= require('socket.io')(http),
	bodyParser = require('body-parser'),
	Twitter = require('twit'),
	config 	= require('./config.json'),
	twitter = new Twitter(config),
	Kinvey = require('kinvey'),
	crypto = require('crypto');
var fs = require('fs');

var negativity = require('Sentimental').negativity;

app.use('/', express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/login.html')
});

env.port = process.env.PORT || env.port;

/************** KINVEY***************/

//http://devcenter.kinvey.com/nodejs/guides/getting-started
var init_promise = Kinvey.init({
	appKey :'kid_-J6daSylv',
	appSecret : 'ae20011eed2f46938b92bcd7ca6fb922'
});

init_promise.then(function(activeUser){
	console.log("Kinvey successfully initialize");

	//verify communication with kinvey
	pingKinvey();

}, function(error) {
	console.log("Kinvery failed to initialize");
});

function signUp(res,username,password)
{
	password = crypto.createHash('sha1').update(password + "salt").digest('hex');
	
	var promise = Kinvey.User.signup({
	    username : username,
	    password : password
	}, {
	    success: function(response) {
	        console.log("Successfully signed up");
	        res.status(200).send(response);
	    },
	    error: function(err){
	    	console.log(err);
	    	res.status(400).send(err);
	    }
	});
}

function login(res, username, password)
{
	password = crypto.createHash('sha1').update(password + "salt").digest('hex');

	console.log(password);
	var promise = Kinvey.User.login(username, password, {
	    success: function(response) {
	        console.log("Successfully logged in");
	        //streamTweets();
	        console.log(response);
	        res.status(200).send(response)
	    },
	    error: function(err){
	    	console.log(err);
	    	res.status(401).send(err);
	    }
	});
}

function logout(res)
{
	var user = Kinvey.getActiveUser();
	if(null !== user) {
	    var promise = Kinvey.User.logout({
	        success: function(response) {
	            console.log("Successfully logged out");
	            res.status(200).send(response);
	        },
	        error: function(err) {
	        	console.log(err);
	        	res.status(500).send(err);
	        }
	    });
	}
}

function pingKinvey()
{
	
	var ping_promise = Kinvey.ping(); 

	ping_promise.then(function(response){
		console.log("Kiney Ping Success. Kinvery service is alive, version: " + response.version + ", response: " + response.kinvey);
	}, function(error){
		console.log("Kinvey Ping Failed. Response: " + error.description);
	});	
}

// https://github.com/ttezel/twit
//var stream = twitter.stream('statuses/sample', {language: 'en'});
/*app.get('/api/user',function(req,res){
	var promise = Kinvey.DataStore.find('Users',null,{
		success: function(users){
			res.send(users);
		}
	});
});*/

app.get('/api/hash/:word',function(req,res){
	var hash = req.param("word");
	console.log(hash);
	console.log("Request for hashtag");
	
	res.send(storeHashPhrase(hash));
});

app.post('/api/negativity/',function(req,res){
	var phrase = req.body.phrase;
	console.log(phrase);
	console.log("Request for negativity score");
	var scoreObj = negativity(phrase);
	console.log(scoreObj);

	res.send(scoreObj);
});

app.post('/api/login/',function(req,res)
{
	var username = req.body.username;
	var password = req.body.password;

	console.log("Request for login");
	console.log(username);
	console.log(password);
	
	login(res, username,password);
});

app.post('/api/logout/',function(req,res){
	console.log("Request for logout");
	
	logout(res);

});
app.post('/api/signUp/',function(req,res){

	var username = req.body.username;
	var password = req.body.password;

	console.log("Request to sign up");

	signUp(res,username,password);
});

app.get('api/authenticate', function(req,res){
	// check with Kinvey if there is an active user
});

function storeHashPhrase(hash)
{
	console.log(Kinvey.getActiveUser()._id);
	var obj = {
				hashtag: hash,
				user_id : Kinvey.getActiveUser()._id,
			  };
	saveToKinvey('Hashes',obj);
}

function saveToKinvey(table,obj)
{
	var promise = Kinvey.DataStore.save(table,obj,
				{
					success: function(response){
						console.log("Saved successfully to "+table);
				},
					error:function(err){
						console.log("Saved to "+table+" Failed");
						console.log(err);
				}
			});
}

function streamTweets() {
	var stream = twitter.stream('statuses/filter',{track:['#'],language:'en'})
	io.on('connection', function(socket){
		console.log('User connected ... Starting Stream connection');

		//In order to minimise API usage, we only start stream from twitter when user connected
		stream.on('tweet', function(tweet){
			//When Stream is received from twitter
			io.emit('new tweet' ,tweet); //Send to client via a push

			var promise = Kinvey.DataStore.save('Tweets',{
				_id : tweet.id,
				user_id : Kinvey.getActiveUser()._id,
				//user_id:tweet.user.id,
				created_at: tweet.created_at,
				text: tweet.text

			}, {
				success: function(response){
					console.log("Tweet saved successfully");
				},
				error:function(err){
					console.log("Fail");
					console.log(err);
				}
			});
		});

		socket.on('disconnect', function(){
			console.log("User disconnected");
			stream.stop();
		});//disconnects after  page refresh
		// disconnect after 60 seconds from collecting tweets
	/*
		setTimeout(function(){
			stream.stop();
			console.log("disconnected");
		}, 60000);
	*/
	});

}

function setUpListeners(socket){

}

http.listen(env.port, function(){
	console.log("App running for the '%s' environment on port %s", envKey, env.port);
});