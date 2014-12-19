(function(window){

	$(document).ready(function(){
		$.get("/api/authenticate")
			.done(function(data){
				console.log(data);


			var socket = io.connect();
			socket.on('new tweet', function(tweet){
				var tweetSelector;
				var tweetSelectorId = '#'+tweet._id + ' .btn';

				if(tweet.negativity_score == 0){
					tweetSelector = $('#tweet_logs #good_tweets');
				}
				else{
					tweetSelector = $('#tweet_logs #bad_tweets');
				}

				tweetSelector.append(addTweetToDom(tweet));

				$(tweetSelectorId).click(function(){
					var tweet_id = $(this).parent().parent().attr('id');
					var tweet_score;
					var tweet_status;
					if($(this).hasClass("bad")){
						tweet_score = 50;
						tweet_status = $('#tweet_logs #bad_tweets');
					}
					else{
						tweet_score = 0;
						tweet_status = $('#tweet_logs #good_tweets');
					}

					$.ajax({
					    url: '/api/tweets' + '?' + $.param({"id": tweet_id, "score":tweet_score}),
					    type: 'PUT',
					    success: function(result) {
					        console.log("success");

					        tweet_status.append($('#'+tweet_id).parent());
					        $('#'+tweet_id).remove();
					    }
					});
				})
			});

			drawPieChartByNegativityScore();


		})
		.fail(function(err){
			console.log(err);
		});
	});

	function deleteFromDB(){
		console.log("DELETED! :D");
	}

	function addTweetToDom(tweet){
			var tweetTemplate='<div class="col-md-12 col-sm-12">'+
						          '<div class="well" id = "' + tweet._id +'"> ' +
						               '<form class="form-horizontal" role="form">'+
						                '<div class="form-group" style="padding:14px;">'+
						                  '<div class="form-control height-auto overflow-wrap-break-word">'+tweet.text+'</div>'+
						                '</div>'+

						                '<button class="btn btn-danger bad float-right" type="button">Bad</button>'+
						                '<button class="btn btn-success good margin-right-5" type="button">Good</button>'+
						              '</form>'+
						          '</div> '+
						     '</div>';

			return tweetTemplate;
	}
	
	// This is used to check if the user has an active session
	$.get("/api/authenticate")
	.done(function(data){
		console.log(data);

	})
	.fail(function(err){
		console.log(err);
	});
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

function setUpUi(profile){
	$('.media-heading #name').text(profile.fname + ' ' + profile.lname);
	$('#username').text('@' + profile.username);

	// adds the hashtag if the user is on a page that is to show it
	if(profile.hashes && profile.hashes.length && profile.hashes.length > 0){
		for (var i = profile.hashes.length - 1; i >= 0; i--) {
			var hash ='<li id="'+profile.hashes[i]._id+'" class="list-group-item list-group-item-info"> <span class="badge btn-danger badge-x">X</span> #' + profile.hashes[i].hashtag + '</li>';
			
			$('#hashes').append(hash);

			$('li#' + profile.hashes[i]._id +' .badge-x').click(function(){
				var hash_id = $(this).parent().attr('id');

				$.ajax({
				    url: '/api/hashtag' + '?' + $.param({"id": hash_id}),
				    type: 'DELETE',
				    success: function(result) {
				        console.log("success");
				        $('#'+hash_id).remove();
				    }
				});
			})
		};
	}
}

// This is used to check if the user has an active session
$.get("/api/authenticate")
	.done(function(data){

		if(data != null && data != ""){
			user.profile=data;

			setUpUi(user.profile);
		}
	})
	.fail(function(err){
	});
/*
$(document).ready(function(){
		var socket = io.connect();
		socket.on('new tweet', function(tweet){
			$('#tweet_logs').append(addTweetToDom(tweet));
		});
	});

*/

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

	$.post("/api/login", user.profile)
	.done(function(data) {
		window.location.href ="http://smm-twitter.herokuapp.com/main.html";
	 })
	.fail(function(err) {
	    console.log("Something went wrong");
		console.log(err);
	});
}

function logout (){
	$.post("/api/logout")
	.done(function(){
		window.location.href ="http://smm-twitter.herokuapp.com/login.html";
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
	$.get("/api/authenticate")
	.done(function(data){

		if(data != null && data != ""){
			$.get("/api/tweets", function(data){
				callback(data);
			});
		}
	})
	.fail(function(err){
	});
	
}

function drawPieChartByNegativityScore(){
		loadAllTweets(function(tweets){

			var chartid = "chartSec";

			var count = {};

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
				recs.push([ score, count[score]]);
			}

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

	hashtag.hash = $("#hash").val();
	console.log(hashtag.hash);
	$.post("/api/storeHash/", hashtag)
	.done(function(){
		var hash ='<li class="list-group-item list-group-item-info"> <span class="badge btn-danger badge-x">X</span> #' + $("#hash").val() + '</li>';
		$('#hashes').prepend(hash);

		$('#hash').val(null);
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
		window.location.href ="http://smm-twitter.herokuapp.com/main.html";
	})
	.fail(function(err){
		console.log(err);
	});
}


// call the /api/authenticate endpt and check for active user
// if authenticated then assign values to user object
// else send the user to login page

