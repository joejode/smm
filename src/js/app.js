(function(window){

	$(document).ready(function(){
		var socket = io.connect();
		socket.on('new tweet', function(tweet){
		    console.log(tweet)
			$('#tweet_logs').append(addTweetToDom(tweet));
		});
	});

	function deleteFromDB(){
		console.log("DELETED! :D");
	}

	function addTweetToDom(tweet){
			var tweetTemplate='<div class="col-md-12 col-sm-12">'+
						          '<div class="well"> ' +
						               '<form class="form-horizontal" role="form">'+
						                '<div class="form-group" style="padding:14px;">'+
						                  '<textarea class="form-control">'+tweet.text+'</textarea>'+
						                '</div>'+
						                '<button class="btn btn-danger pull-right" type="button">Bad</button>
						                <button class="btn btn-success pull-right" type="button">Good</button><ul class="list-inline"><li><a href="#"><i class="glyphicon glyphicon-align-left"></i></a></li><li><a href="#"><i class="glyphicon glyphicon-align-center"></i></a></li><li><a href="#"><i class="glyphicon glyphicon-align-right"></i></a></li></ul>'+
						              '</form>'+
						          '</div> '+
						     '</div>';

			return tweetTemplate;
	}
	
	$("form").submit(function(e)
	{
		e.preventDefault();
	});

	
}(this));

var user = {
	"profile": {
		"username": null,
		"password": null
	}
};


//Takes array of tweets and sorts it by negativity - most negative first.
function sortByNegativity(tweets){
	tweets.sort(function(a,b){
		return a.score-b.score;
	});
}

function login()
{
	console.log("Log in function!");
	user.profile.username = $("#inputEmail").val();
	user.profile.password = $("#inputPassword").val();

	$.post("/api/login", user.profile)
	.done(function(data) {
	    console.log("Successfully logged in");
		console.log(data);
		window.location.href ="http://localhost:8888/main.html";
	 })
	.fail(function(err) {
	    console.log("Something went wrong");
		console.log(err);
	});
}

<<<<<<< HEAD
function logout (){
	$.post("/api/logout")
	.done(function(){
		console.log("Successfully logged out");
		window.location.href ="http://localhost:8888/login.html";
	});
}

=======
//Simple hash function for passwords.
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}


>>>>>>> bf4dec5a9be0abf838c822c05153f9b8405b251c
var newUser ={
	"profile" : {
		"username": null,
		"password": null
	}
};

function signup()
{
	console.log("Sign-up function");
	newUser.profile.username = $("#inputSignUpEmail").val();
	newUser.profile.password = $("#inputSignUpPassword").val();

	$.post("/api/signup",newUser.profile)
	.done(function(data){
		console.log("Successfully signed up");
		console.log(data);
		window.location.href ="http://localhost:8888/main.html";
	})
	.fail(function(err){
		console.log("Something went wrong");
		console.log(err);
	});
	console.log(newUser);
}
// call the /api/authenticate endpt and check for active user
// if authenticated then assign values to user object
// else send the user to login page

