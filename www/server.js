
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
	console.log("Kinvey successfully initialized");

	//verify communication with kinvey
	pingKinvey();

}, function(error) {
	console.log("Kinvey failed to initialize");
});

function pingKinvey()
{
	
	var ping_promise = Kinvey.ping(); 

	ping_promise.then(function(response){
		console.log("Kiney Ping Success. Kinvery service is alive, version: " + response.version + ", response: " + response.kinvey);
	}, function(error){
		console.log("Kinvey Ping Failed. Response: " + error.description);
	});	
}

function signUp(res,username,password, fname, lname)
{
	password = crypto.createHash('sha1').update(password + "salt").digest('hex');

	var promise = Kinvey.User.signup({
	    username : username,
	    password : password,
	    fname : fname,
	    lname : lname
	}, {
	    success: function(response) {
	        if(response != null){
				getUserHashTags(res, response);
			}
			else{
				res.status(200).send(userProfile);
			}
	    },
	    error: function(err){
	    	res.status(400).send(err);
	    }
	});
}

function login(res, username, password)
{
	password = crypto.createHash('sha1').update(password + "salt").digest('hex');

	var promise = Kinvey.User.login(username, password, {
	    success: function(response) {
	    	if(response != null){
				getUserHashTags(res, response);
			}
			else{
				res.status(200).send(userProfile);
			}
	    },
	    error: function(err){
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
	            res.status(200).send(response);
	        },
	        error: function(err) {
	        	res.status(500).send(err);
	        }
	    });
	}
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

app.get('/api/hashtag/:word',function(req,res){
	var hashtag = req.param("word");
	
	res.send(storeHashPhrase(hashtag));
});

app.delete('/api/hashtag',function(req,res){
	console.log("DELETE");
	var hash_id = req.param("id");
	
	var promise = Kinvey.DataStore.destroy('Hashes', hash_id, {
	    success: function(response) {
	        res.status(200).send(response);
	    },
	    error: function(err) {
	    	res.send(err);
	    }
	});
});

app.post('/api/negativity/',function(req,res){
	var phrase = req.body.phrase;
	var scoreObj = negativity(phrase);

	res.send(scoreObj);
});

app.post('/api/login/',function(req,res)
{
	var username = req.body.username;
	var password = req.body.password;

	login(res, username,password);
});

app.post('/api/logout/',function(req,res){
	logout(res);
});

app.post('/api/signUp/',function(req,res){

	var username = req.body.username;
	var password = req.body.password;
	var fname = req.body.fname;
	var lname = req.body.lname;

	signUp(res,username,password,fname,lname);
});


app.post('/api/storeHash/',function(req,res){
	var hash = req.body.hash;

	res.send(storeHashPhrase(hash));

});

app.get('/api/authenticate', function(req,res){
	// check with Kinvey if there is an active user
	var userProfile = Kinvey.getActiveUser();
	
	if(userProfile != null){
		getUserHashTags(res, userProfile);
	}
	else{
		res.status(200).send(userProfile);
	}
	
});

app.get('/api/tweets/',function(req,res){
	console.log("Requesting tweets from DB:");
	var promise = Kinvey.DataStore.find('Tweets',null,
				{
					success: function(response){
						res.status(200).send(response);
						return response;
				},
					error: function(err){
						console.log(err);
						return err;
					}
				});
});

function getUserHashTags(res, userProfile){
	var query = new Kinvey.Query();
	query.equalTo('user_id', userProfile._id);
	
	var promise = Kinvey.DataStore.find('Hashes', query, {
    success: function(response) {
    		userProfile.hashes=response;
	        
	        var hashtags = [];
	        for (var i = userProfile.hashes.length - 1; i >= 0; i--) {
				hashtags.push('#'+userProfile.hashes[i].hashtag);
			};

			console.log(hashtags);

	        streamTweets(hashtags);

	        res.status(200).send(userProfile);
	    }
	});
}

function storeHashPhrase(hash)
{
	var obj = {
				hashtag: hash,
				user_id : Kinvey.getActiveUser()._id,
			  };
	return saveToKinvey('Hashes',obj);
}

function saveToKinvey(table,obj)
{
	var promise = Kinvey.DataStore.save(table,obj,
				{
					success: function(response){
						//console.log("Saved successfully to "+table);
						return response;
				},
					error:function(err){
						//console.log("Saved to "+table+" Failed");
						return err;
				}
			});
}

function streamTweets(hashtags) {
	var stream = twitter.stream('statuses/filter',{track:hashtags,language:'en'})
	io.on('connection', function(socket){
		console.log('User connected ... Starting Stream connection');

		//In order to minimise API usage, we only start stream from twitter when user connected
		stream.on('tweet', function(tweet){
			//When Stream is received from twitter
			
			var negativeObj = negativity(tweet.text);

			var tweetObj = {
				_id : tweet.id,
				user_id : Kinvey.getActiveUser()._id,
				//user_id:tweet.user.id,
				created_at: tweet.created_at,
				text: tweet.text,
				negativity_score: negativity(tweet.text).score


			};

			io.emit('new tweet' ,tweetObj); //Send to client via a push

			saveToKinvey('Tweets',tweetObj);
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
	},
	function(err){
		console.log(err);
	});

}

function setUpListeners(socket){

}

http.listen(env.port, function(){
	console.log("App running for the '%s' environment on port %s", envKey, env.port);
});