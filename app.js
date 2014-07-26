/*
 * Load external modules and init variables
 */
var twitter = require('twit'),
    http = require('http'),
    tweeted = [],
    idstweeteds = [],
    load_time = Math.round(new Date().getTime() / 10000),
    score_threshold = 40;
 

/*
 * Setup twitter api
 */
var twit = new twitter({
  consumer_key: 'lfmpcxXOOSX268v3almVQ',
  consumer_secret: 'jdzbs9AGkzicxf96Y8fpAyt6vSRxNpDDafOwyxI',
  access_token: '2197723268-1DIzWv1KB05tcnR8kx6dXuDA5jgoXxySbCnJeFJ',
  access_token_secret: 'BAca4IL8oErUEyMbakw8EB49IcsOOR6muM8YF9WMXsopT'
});
 
 
/*
 * Primary wrapper function
 */
function gogo() {
 
    console.log('Making request');
    
    //SEARCH FOR RT on twitter
    //date
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd='0'+dd;
    } 

    if(mm<10) {
        mm='0'+mm;
    } 

    today = yyyy+'-'+mm+'-'+dd;

    twit.get('search/tweets', {q: 'pixelart since:'+today, count: 30}, function(err, data, response){
       // console.log(data.statuses[0].id);
        rt = data.statuses;
        var len = rt.length;
       // console.log(len);
        var start = 'RT';


        for(var i=0; i<len; i++){
            var rw = rt[i],
                retweets = rw.retweet_count,
                favs = rw.favorite_count,
                text = rw.text.toString(),
                id = rw.id_str,
                user = rw.screen_name;

            if(!(text.indexOf(start) === 0) && (favs>2 || retweets>1) && user!='pixelartbot' && !idstweeteds[id]){
                console.log("Retweets: "+retweets+'\n'+
                            "Favs: "+favs+'\n'+
                            "text: "+text+'\n'+
                            "id: "+id+'\n');

                twit.post('statuses/retweet/:id', { id: id }, function (err, data, response) {
                    if(err){
                        console.log(err);
                    }
                    idstweeteds.push(id);
                });

            }
        }
    });
    



    //SEARCH ON REDDIT
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
       // console.log("Got response: " + res.statusCode);
 
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
                    len = reddit.length;
 
                // Limit top 15
                if(len > 15) {
                    len = 15;
                }
 
 
                // Loop through results and parse
                for(var j=0;j<len;j++) {

                    var ar = reddit[j].data,
                        score = ar.score,
                        created = ar.created,
                        title = ar.title,
                        url = ar.url,
                        domain = ar.domain,
                        id = ar.id;
                    

                    if(!tweeted[id] && (domain == "imgur.com" || domain=="youtube.com" || domain=="media.indiedb.com" || domain=="pixeljoint.com" || domain=="i.imgur.com") && created>load_time){
                    // Send tweet
                    title = shortenTweet(title);
                    
                    //Get the image from imgur
                    if(domain == "imgur.com"){
                        url = url.replace(/^https?:\/\//,'');
                        url = url.split('/');
                        newUrl = url[0]+'/gallery/'+url[1];
                        url = newUrl;
                        console.log('NEW URL '+url);

                    }

                    console.log([title, ' Url: ', url, ' '].join(''));
                    //twit
                   twit.post('statuses/update', {status: [title, ' ', url, ' #pixelArt'].join('')}, function(err, data, response){
                        console.log(data);
                    });


                    

                    tweeted.push(id);
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