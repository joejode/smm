(function(window){

	$(document).ready(function(){
		var socket = io.connect();
		socket.on('new tweet', function(tweet){
			$('#tweet_logs').append(addTweetToDom(tweet));
		});

		drawPieChartByNegativityScore();

	});

	function deleteFromDB(){
		console.log("DELETED! :D");
	}

	function addTweetToDom(tweet){
			var tweetTemplate='<div class="col-md-12 col-sm-12">'+
						          '<div class="well"> ' +
						               '<form class="form-horizontal" role="form">'+
						                '<div class="form-group" style="padding:14px;">'+
						                  '<div class="form-control height-auto">'+tweet.text+'</div>'+
						                '</div>'+

						                '<button class="btn btn-danger float-right" type="button">Bad</button>'+
						                '<button class="btn btn-success margin-right-5" type="button">Good</button>'+
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

// This is used to check if the user has an active session
$.get("/api/authenticate")
	.done(function(data){
		console.log(data);

		if(data != null && data != ""){
			user.profile=data;

			$('.media-heading #name').text(user.profile.fname + ' ' + user.profile.lname);
			$('#username').text('@' + user.profile.username);
		}
	})
	.fail(function(err){
		console.log(err);
	});

//Takes array of tweets and sorts it by negativity - most negative first.
function sortByNegativity(tweets){
	tweets.sort(function(a,b){
		return a.score-b.score;
	});
}

function login()
{

	user.profile.username = $("#inputEmail").val();
	user.profile.password = $("#inputPassword").val();
console.log(user);
	$.post("/api/login", user.profile)
	.done(function(data) {
		window.location.href ="http://localhost:8888/main.html";
	 })
	.fail(function(err) {
	    console.log("Something went wrong");
		console.log(err);
	});
}

function logout (){
	$.post("/api/logout")
	.done(function(){
		window.location.href ="http://localhost:8888/login.html";
	});
}

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

var newUser ={
	"profile" : {
		"username": null,
		"password": null,
		"fname": null,
		"lname":null
	}
};


function loadAllTweets(callback)
{
	$.get("/api/tweets", function(data){
		console.log(data.length);
			callback(data);
		});
}

function drawPieChartByNegativityScore(){
		loadAllTweets(function(tweets){

			var chartid = "chartSec";

			var count = {};
			console.log(tweets[0]);
			//Extract the values
			tweets.forEach(function(el){
				if (count[el.negativity_score] === undefined){
					count[el.negativity_score] = 0;
				}

				count[el.negativity_score] += 1;
			});


			// Format the data in the way the library expects
			var recs = [];
			for (var score in count){
				console.log(score + count[score]);
				recs.push([ score, count[score]]);
			}

			console.log ("sending to chart now");
			$("#"+chartid).highcharts({
				title:{
					text: "Negativity Score distribution"
				},
				series:[{
					type: 'pie',
					name: 'score',
					data: recs
				}]
			})
		});
	}
		

var hashtag = {
		"hash" : null
	};

function addHashToKinvey()
{
	console.log("Adding Hash to Kinvey:");

	hashtag.hash = $("#hash").val();
	console.log(hashtag.hash);
	$.post("/api/storeHash/", hashtag)
	.done(function(){
		console.log("Successfully added hash to kinvey");
	})
	.fail(function(err){
		console.log("Something went wrong");
	});
}

function signup()
{
	newUser.profile.fname = $("#inputSignUpFname").val();
	newUser.profile.lname = $("#inputSignUpLname").val();
	newUser.profile.username = $("#inputSignUpEmail").val();
	newUser.profile.password = $("#inputSignUpPassword").val();

	$.post("/api/signup",newUser.profile)
	.done(function(data){
		window.location.href ="http://localhost:8888/main.html";
	})
	.fail(function(err){
		console.log(err);
	});
}


// call the /api/authenticate endpt and check for active user
// if authenticated then assign values to user object
// else send the user to login page

