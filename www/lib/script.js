(function(window) {
    $(document).ready(function() {
        var socket = io.connect();
        socket.on("new tweet", function(tweet) {
            console.log(tweet);
            $("#tweet_logs").append(addTweetToDom(tweet));
        });
    });
    function addTweetToDom(tweet) {
        var tweetTemplate = '<div class="col-md-12 col-sm-12">' + '<div class="well"> ' + '<form class="form-horizontal" role="form">' + '<div class="form-group" style="padding:14px;">' + '<textarea class="form-control">' + tweet.text + "</textarea>" + "</div>" + '<button class="btn btn-success pull-right" type="button">Post</button><ul class="list-inline"><li><a href="#"><i class="glyphicon glyphicon-align-left"></i></a></li><li><a href="#"><i class="glyphicon glyphicon-align-center"></i></a></li><li><a href="#"><i class="glyphicon glyphicon-align-right"></i></a></li></ul>' + "</form>" + "</div> " + "</div>";
        return tweetTemplate;
    }
})(this);