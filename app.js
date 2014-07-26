/*
 * Load external modules and init variables
 */
var twitter = require('ntwitter'),
    http = require('http'),
    //bitly = require('bitly'),
    //b = new bitly('USER', 'API_KEY'),
    tweeted = {},
    load_time = Math.round(new Date().getTime() / 10000),
    score_threshold = 100;
 
/*
 * Setup twitter api
 */
var twit = new twitter({
  consumer_key: '****',
  consumer_secret: '****',
  access_token_key: '****',
  access_token_secret: '****'
});
 
 
 
/*
 * Primary wrapper function
 */
function gogo() {
 
    console.log('Making request');
    var options = {
        host : 'www.reddit.com',
        port : 80,
        path : '/r/pixelart/top/.json?t=week'
        },
        data = [];
 
    /*
     * Send an http request to the reddit API
     */
    http.get(options, function(res) {
        console.log("Got response: " + res.statusCode);
 
        /*
         * Check we have a status 200 response.  If not then do nothing.  Under heavy
         * load reddit returns non 200 responses when it has too many requests to handle
         * so a non 200 code is not that uncommon.
         */
        if(res.statusCode == 200) {
 
            res.on('data', function(d) {
                data.push(d);
            });
 
            res.on('end', function() {
 
                data = data.join('');
 
                var reddit = JSON.parse(data).data.children,
                    len = reddit.length,
                    j;
 
                // Limit top 15
                if(len > 15) {
                    len = 15;
                }
 
 
                // Loop through results and parse
                for(j=0;j<len;j++) {
                    var ar = reddit[j].data,
                        score = ar.score,
                        created = ar.created,
                        title = ar.title,
                        url = ar.url,
                        domain = ar.domain;
                    

                    if(!tweeted[title] && (domain == "imgur.com" || domain=="youtube.com" || domain=="media.indiedb.com" || domain=="pixeljoint.com" || domain=="i.imgur.com") && created>load_time){
                    // Send tweet
                    title = shortenTweet(title);
                    console.log([title, ' Url: ', url, ' '].join(''));
                    twit.updateStatus([title, ' ', url, ' #pixelArt'].join(''), function(err) {
                    if(err) console.log('Twit err: ' + err);
                    });

                    tweeted[title] = true;
                }(ar);
                    
                }
 
            });
        }
 
 
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
 
}
 
 
var shortenTweet = function(tweet) {
    if(tweet.length >= 80) {
        return tweet.substring(0, 77) + '...';
    } else {
        return tweet;
    }
};
 
 
setInterval(function() {gogo();}, 1000*60*5);
 
gogo();