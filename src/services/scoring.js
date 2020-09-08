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

exports.updateLiveScores = async () => {
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
          await new Promise((resolve, reject) => {Match.updateOne({id:id}, { $set: {live_home_score: home_score, live_away_score: away_score}}, async function(err, result){
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

exports.updateFootballDataScores = () => {
  console.info('updateFootballDataScores called')
  //var talkSport_week_num = await getTalkSportWeekNum();
  Match.findOne({}, async function(err, result){
    if (err) throw err;
    home_team = result['home_team'];
    away_team = result['away_team'];
    var teams = await getFootballDataIDs();
    function fixTeams(team){
      if (team=='Sheffield United') {team='Sheffield Utd'};
      if (team=='Wolves') {team='Wolverhampton'};
      if (team=='Brighton') {team='Brighton Hove'};
      if (team=='Man Utd') {team='Man United'};
      if (team=='Leicester') {team='Leicester City'};
      if (team=='Crystal Pal') {team='Crystal Palace'};
      if (team=='Norwich City') {team='Norwich'};
      return team
    }
    home_team = fixTeams(home_team);
    away_team = fixTeams(away_team);
    var home_team_id = teams[home_team];
    var away_team_id = teams[away_team];
    var options = {
      hostname: 'api.football-data.org',
      path: '/v2/teams/'+home_team_id+'/matches?venue=HOME',
      method: 'GET',
      headers: {
        'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
      }
    }
    var matchday = await new Promise((resolve, reject) => https.get(options, (res) => {
      data = '';
      res.on('data',(d) => {
        data += d;
      })
      res.on('end',() => {
        json = JSON.parse(data)
        var matchday = checkMatchday(json,result,away_team_id)
        resolve(matchday)
      })
    }))

    options = {
      hostname: 'api.football-data.org',
      path: '/v2/competitions/PL/matches?matchday='+matchday,
      method: 'GET',
      headers: {
        'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
      }
    }
    https.get(options, (res) => {
      data = '';
      res.on('data',(d) => {
        data += d;
      })
      res.on('end', () => {
        json = JSON.parse(data);
        updateDBScoresFootballData(json)
      })
    })
  });
}

async function getFootballDataIDs(){
  var options = {
    hostname: 'api.football-data.org',
    path: '/v2/competitions/PL/teams',
    method: 'GET',
    headers: {
      'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
    }
  }
  var teams = {}
  await new Promise((resolve, reject) => {https.get(options, (res) => {
    data = '';
    res.on('data', (d) => {
      data += d;
    })
    res.on('end', () => {
      json = JSON.parse(data)
      for (var i = 0; i < json['teams'].length; i++) {
        var team_name = json['teams'][i]['shortName']
        var team_id = json['teams'][i]['id']
        teams[team_name] = team_id;
      }
      resolve(teams)
    })
  })})
  return teams;
}

async function updateDBScoresFootballData(json) {
  matches = json['matches'];
  if (!matches) {
    throw ('Error: Matches not valid please check sentry ffs')
  }
  for (var i = 0;i < matches.length;i++) {
    match = matches[i]
    home_team = match['homeTeam']['name'];
    away_team = match['awayTeam']['name'];
    home_score = match['score']['fullTime']['homeTeam']
    away_score = match['score']['fullTime']['awayTeam']
    home_team = fixTeamNameProblems(home_team);
    away_team = fixTeamNameProblems(away_team);
    combined_score = home_score + away_score;
    if (home_team && away_team && home_score && away_score) {
      console.log(`Currently checking in updateDBScoresFootballData for: ${home_team} vs ${away_team} with a final score of ${home_score}-${away_score}`)
    }
    await new Promise((resolve, reject) => {Match.findOne({home_team: home_team, away_team: away_team}, async function(err, result){
      if (result == null||home_score == null){
        if (result) {
          if (home_score == null && away_score == null && result['kick_off_time'] > Date.now() && !(result['live_home_score'] > 0) && !(result['live_away_score'] > 0)) {
            console.log('set score in updatedbfootballdata1 '+home_team+' vs '+away_team+' to 0-0')
            await new Promise((resolve, reject) => {Match.updateOne({id:id}, { $set: {live_home_score: 0, live_away_score: 0}}, function(err, result) {
              console.info('set scores to 0')
              resolve()
            })})
          }
        }
        resolve()
      } else {
      status = match['status'];
      id = result['id'];
      if (result['live_home_score']+result['live_away_score'] < combined_score || result['live_home_score'] == null) {
        // Update the score as it is greater than the previous score
        console.log('set score in updatedbfootballdata2 '+home_team+' vs '+away_team+' to '+home_score+' - '+away_score)
        await new Promise((resolve, reject) => {Match.updateOne({id:id}, { $set: {live_home_score: home_score, live_away_score: away_score, status: status}}, function(err, result){
          console.info('score updated through football-data api')
          resolve()
        })})
        await scoring.scoreGames();
      }
      // Still update game status as game is present
      await new Promise((resolve, reject) => {Match.updateOne({id: id}, { $set: {status: status} }, function(err, result){
        console.info('game status updated')
        resolve()
      }
      )})
      resolve()
      }
    })})
  }
}