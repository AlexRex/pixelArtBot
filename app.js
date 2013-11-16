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
  consumer_key: 'lfmpcxXOOSX268v3almVQ',
  consumer_secret: 'jdzbs9AGkzicxf96Y8fpAyt6vSRxNpDDafOwyxI',
  access_token_key: '2197723268-1DIzWv1KB05tcnR8kx6dXuDA5jgoXxySbCnJeFJ',
  access_token_secret: 'BAca4IL8oErUEyMbakw8EB49IcsOOR6muM8YF9WMXsopT'
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
 
                // Limit 10 top 15
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
                    

                    if(!tweeted[title] && (domain == "imgur.com" || domain=="youtube.com" || domain=="media.indiedb.com") && created>load_time){
                    // Send tweet
                    console.log([title, ' Url: ', url, ' '].join(''));
                    twit.updateStatus([title, ' ', url, ' '].join(''), function(err) {
                    if(err) console.log('Twit err: ' + err);
                    });

                    tweeted[title] = true;
                }
    
                    if(score >= score_threshold && !tweeted[title] && created > load_time) {
 
                    /*
                     * Because this next block contains asynchronous requests (bitly....), we need to wrap
                     * it in an anonomous function, otherwise the article we are pointing to gets out of
                     * sync.  I.e. by the time we got to the updateStatus line, 'art' would might well be
                     * pointing to the next article as the asynchronous code is not going to wait for the
                     * bitly request to complete and will just continue looping through the results from
                     * the reddit API request.
                     *
                     * The following function will always output '10'
                     *
                     * for(var i=0; i<10; i++) {
                     *  someAsyncFunction(function() {
                     *   console.log(i);
                     *  });
                     * }
                     *
                     * To achieve the desired output (1, 2, 3 .... 10), we need to wrap the asyncFunction
                     * in an anonymous function
                     *
                     *
                     * for(var i=0; i<10; i++) {
                     *  (function(j) {
                     *    someAsyncFunction(function() {
                     *    console.log(j);
                     *   });
                     *  })(i);
                     * }
                     */



                    (function(art) {
                            var url = art.url,
                                comments = 'http://www.reddit.com' + art.permalink,
                                title = art.title,
                                title_sh = shortenTweet(art.title),
                                short_url, short_comments;

 
 
                            tweeted[title] = true;
 
                            // Shorten main url using bitly api
                           /* b.shorten(url, function(err, sh) {
                                if(err) console.log('Error: ' + err);
 
                                short_url = sh.data.url;
 
                                // Shorten comment url using bitly api
                                b.shorten(comments, function(err, shc) {
                                    if(err) console.log('Error: ' + err);
 
                                    short_comments = shc.data.url;
 
                                    // Send tweet
                                    console.log([title_sh, ' ', short_url, ' Comments: ' + short_comments].join(''));
                                    twit.updateStatus([title_sh, ' ', short_url, ' Comments: ' + short_comments].join(''), function(err) {
                                        if(err) console.log('Twit err: ' + err);
                                    });
                                });
                            });*/
                    })(ar);
                    }
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
 
 
setInterval(function() {gogo();}, 1000*60*3);
 
gogo();