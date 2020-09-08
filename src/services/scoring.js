const Twit = require('twit');
const env = require('dotenv').config()['parsed'] || process.env;
const Match = require('../models/user').match

var T = new Twit({
  consumer_key:         'S5Kfhe84lyy5anAwIfipS5rzR',
  consumer_secret:      env['TWIT_CONSUMER_SECRET'],
  access_token:         '770278396005867521-L1NBvOb3mNYlXp87iQ6yd3aphk1Nz2T',
  access_token_secret:  env['TWIT_ACCESS_TOKEN_SECRET'],
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

exports.updateLiveScores = () => {
  await scoring.scoreGames()
  // Get request used rather than streaming because it can be filtered by account (more narrowly)
  T.get('statuses/user_timeline', { user_id: 343627165, count: 50 }).then(async function(result) {
    var tweets = result['data']
    //tweets = ['test']
    // Loop through last 10 tweets from official Premier League account
    for (var i = 0; i < tweets.length; i++){
      var tweet = tweets[i];
      var tweet_text = tweet.text;
      //DEBUG: tweet_text = "GOAL Liverpool 1-3 Bournemouth (72 mins) Champions respond! Leroy Sane drills low across goal from the left and his pinpoint effort goes in off the post #MCILIV"
      // Check if tweet announces a goal
      if (!tweet_text){
        continue
      }
      if (!tweet_text.includes('GOAL ')) {
        // Skips the iteration of this tweet
        continue
      }
      // We now know that the tweet annouces a goal in the standard format
      // Find brackets in tweet which signify end of teams and score
      var split_tweet = tweet_text.split(/[()]+/)
      // Filter after keyword goal
      var final_tweet = split_tweet[0].split("GOAL ")[1]
      // final_tweet should contain 'HomeName HomeScore-AwayScore AwayName'
      // Find score
      var score_index = final_tweet.search(/\d.*\d/)
      var score = final_tweet.substring(score_index,score_index+3)
      var score_arr = score.split('-');
      var home_score = parseInt(score_arr[0]);
      var away_score = parseInt(score_arr[1]);
      var combined_score = home_score + away_score;
      // Split into team names
      var teams = final_tweet.split(/\s\d.*\d\s/)
      home_team = teams[0]
      away_team = teams[1].split(/ [^ ]*$/)[0]
      home_team = fixTeamNameProblems(home_team);
      away_team = fixTeamNameProblems(away_team);
      await new Promise((resolve, reject) => {Match.findOne({home_team: home_team, away_team: away_team}, async function(err, result){
        if (result == null||home_score == null){
          await scoring.scoreGames()
          resolve()
        } else {
        if (result['live_home_score']+result['live_away_score'] < combined_score || result['live_home_score'] == null) {
          // Update the score as it is greater than the previous score
          id = result['id'];
          console.log('set score in updatelivescores: '+home_team+' vs '+away_team+' to '+home_score+' - '+away_score)
          await new Promise((resolve, reject) => {table.updateOne({id:id}, { $set: {live_home_score: home_score, live_away_score: away_score}}, async function(err, result){
            await scoring.scoreGames()
            resolve()
          })})
          // Call score game to update the scoring
        }
        await scoring.scoreGames()
        resolve()
        }
      })})
    }
    return result;
  })
}