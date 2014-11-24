
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
	Twitter = require('twit'),
	config 	= require('./config.json'),
	twitter = new Twitter(config),
	Kinvey = require('kinvey');
var fs = require('fs');


var init_promise = Kinvey.init({
	appKey :'kid_-J6daSylv',
	appSecret : 'ae20011eed2f46938b92bcd7ca6fb922'
});

init_promise.then(function(activeUser){
	console.log("Kinvey successfully initialize");

	var ping_promise = Kinvey.ping();

	ping_promise.then(function(response){
		console.log("Kiney Ping Success. Kinvery service is alive, version: " + response.version + ", response: " + response.kinvey);
	}, function(error){
		console.log("Kinvey Ping Failed. Response: " + error.description);
	});

}, function(error) {
	console.log("Kinvery failed to initialize");
});

//var ping_promise = Kinvey.ping();


app.use('/', express.static(__dirname + '/'));

app.get('/*', function(req, res) {
	res.sendFile(__dirname + '/index.html')
});

env.port = process.env.PORT || env.port;

// https://github.com/ttezel/twit
//var stream = twitter.stream('statuses/sample', {language: 'en'});
var stream = twitter.stream('statuses/filter',{track:['#'],language:'en'})
io.on('connection', function(socket){
	console.log('User connected ... Starting Stream connection');

	//In order to minimise API usage, we only start stream from twitter when user connected
	stream.on('tweet', function(tweet){
		//When Stream is received from twitter
		io.emit('new tweet' ,tweet); //Send to client via a push
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

function setUpListeners(socket){

}

http.listen(env.port, function(){
	console.log("App running for the '%s' environment on port %s", envKey, env.port);
});

