const https = require('https')
const Twit = require('twit');
//const { scoreGames } = require('../scoring');
const env = require('dotenv').config()['parsed'] || process.env;
const Match = require('../models/user').match
const Prediction = require('../models/user').prediction

var T = new Twit({
  consumer_key:         'S5Kfhe84lyy5anAwIfipS5rzR',
  consumer_secret:      env['TWIT_CONSUMER_SECRET'],
  access_token:         '770278396005867521-L1NBvOb3mNYlXp87iQ6yd3aphk1Nz2T',
  access_token_secret:  env['TWIT_ACCESS_TOKEN_SECRET'],
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

exports.scoreGames = () => {
  console.info('score games /services/scoring.js called')
  return new Promise(async function (resolve, reject){
  var games;
  await new Promise((resolve, reject) => Match.find({}).populate('predictions').exec((err, result) => {
      if (err) throw err;
      games = result;
      resolve();
  }))
  if (!games) {
      throw ('Error: Games array empty. Database is empty!')
  }
  // Loop through array of games
  for (var i = 0;i < games.length;i++) {
    var game = games[i];
    var home_team = game['home_team']
    var away_team = game['away_team']
    var game_id = game['_id']
    var new_data = {$set: {}}
    var predictions = game['predictions']
    for (var x = 0;x < predictions.length;x++){
      var prediction = predictions[x];
      var pred_id = prediction['_id']
      var pred_home = prediction['home_pred'];
      var pred_away = prediction['away_pred'];
      var live_home = game['live_home_score'];
      var live_away = game['live_away_score'];
      var banker_mult = game['banker_multiplier'];
      var banker = prediction['banker'] || false;
      var insurance = prediction['insurance'] || false;
      var points = calculateScores(pred_home, pred_away, live_home, live_away, banker_mult, banker, insurance);
      new_data['$set']['points'] = points;

      await new Promise((resolve, reject) => {
        Prediction.updateOne({_id: pred_id}, new_data, function(err, result){
          if (err) throw err;
          resolve();
      })});
    }
  }
  resolve()
  })
}

scoreGames = exports.scoreGames

function calculateScores(pred_home, pred_away, live_home, live_away, banker_mult, banker, insurance){
  var points;
  // Check if predictions present
  if (pred_home == null || pred_away == null || live_home == null || live_away == null){
      points = 0;
  } else {
      // Check if exactly correct
      if (pred_home == live_home && pred_away == live_away) {
          points = 30;
      } else {
          // Check if draw
          if (pred_home == pred_away && live_home == live_away) {
              points = 20;
          } else{
              // Check if correct goal difference
              if ((pred_home - live_home) == (pred_away - live_away)) {
                  points = 15;
              } else {
                  // Check if result correct
                  if (((pred_home > pred_away) && (live_home > live_away)) || (pred_home < pred_away) && (live_home < live_away)) {
                      points = 10;
                  } else {
                      points = -10;
                  }
              }
          }
      }
  }

  // Now apply banker and insurance chips
  if ((points < 0)&&(insurance)) {
      points = 0;
  }
  if (banker) {
      points = points*banker_mult;
  }
  return points;
}

function fixTeamNameProblems(name){
  name = name.replace('AFC','');
  name = name.replace('FC','');
  name = name.replace('&', 'and')
  name = name.trim();
  if (name == 'Brighton & Hove Albion') {name = 'Brighton'};
  return name
}

exports.updateLiveScores = async () => {
  console.log('scoring live games begin')
  await scoreGames()
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
      var home_team = teams[0]
      var away_team = teams[1].split(/ [^ ]*$/)[0]
      home_team = fixTeamNameProblems(home_team);
      away_team = fixTeamNameProblems(away_team);
      await new Promise((resolve, reject) => {
        Match.findOne({home_team: home_team, away_team: away_team}, async function(err, result){
        if (result == null||home_score == null){
          await scoreGames()
          resolve()
        } else {
        if (result['live_home_score']+result['live_away_score'] < combined_score || result['live_home_score'] == null) {
          // Update the score as it is greater than the previous score
          var id = result['_id'];
          console.log('set score in updatelivescores: '+home_team+' vs '+away_team+' to '+home_score+' - '+away_score)
          await new Promise((resolve, reject) => {Match.updateOne({_id:id}, { $set: {live_home_score: home_score, live_away_score: away_score}}, async function(err, result){
            if (err) throw err
            await scoreGames()
            resolve()
          })})
          // Call score game to update the scoring
        }
        await scoreGames()
        resolve()
        }
      })})
    }
    return result;
  })
}

exports.updateTodayGames = () => {
  console.log('updating todays games')
  var date = new Date().toISOString().split('T')[0];
  var options = {
    hostname: 'api.football-data.org',
    path: '/v2/competitions/PL/matches?dateFrom='+date+'&dateTo='+date,
    method: 'GET',
    headers: {
      'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
    }
  }
  https.get(options, (res) => {
    var data = '';
    res.on('data',(d) => {
      data += d;
    })
    res.on('end', () => {
      var json = JSON.parse(data);
      console.log(JSON.stringify(json))
      updateDBScoresFootballData(json)
    })
  })
}


exports.updateFootballDataScores = (optional_gameweek) => {
  console.info('updateFootballDataScores called')
  //var talkSport_week_num = await getTalkSportWeekNum();
  Match.findOne({}, async function(err, result){
    if (err) throw err;
    var home_team = result['home_team'];
    var away_team = result['away_team'];
    var teams = await getFootballDataIDs();
    function fixTeams(team){
      if (team=='Sheffield United') {team='Sheffield Utd'};
      if (team=='Wolves') {team='Wolverhampton'};
      if (team=='Brighton') {team='Brighton Hove'};
      if (team=='Man Utd') {team='Man United'};
      if (team=='Leicester') {team='Leicester City'};
      if (team=='Crystal Pal') {team='Crystal Palace'};
      if (team=='Norwich City') {team='Norwich'};
      if (team=='Wolverhampton Wanderers') {team='Wolverhampton'};
      return team
    }
    home_team = fixTeams(home_team);
    away_team = fixTeams(away_team);
    var home_team_id = teams[home_team];
    var away_team_id = teams[away_team];
    var options = {
      hostname: 'api.football-data.org',
      path: '/v2/competitions/PL',
      method: 'GET',
      headers: {
        'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
      }
    }
    var matchday = await new Promise((resolve, reject) => https.get(options, (res) => {
      var data = '';
      res.on('data',(d) => {
        data += d;
      })
      res.on('end',() => {
        var json = JSON.parse(data)
        var inner_matchday = checkMatchday(json)
        resolve(inner_matchday)
      })
    }))
    // Use function param if given or alternatively use calculated current gameweek
    matchday = optional_gameweek || matchday
    console.log('matchday is '+matchday)
    options = {
      hostname: 'api.football-data.org',
      path: '/v2/competitions/PL/matches?matchday='+matchday,
      method: 'GET',
      headers: {
        'X-Auth-Token': env['FOOTBALL_DATA_API_AUTH']
      }
    }
    https.get(options, (res) => {
      var data = '';
      res.on('data',(d) => {
        data += d;
      })
      res.on('end', () => {
        var json = JSON.parse(data);
        updateDBScoresFootballData(json)
      })
    })
  });
}

function checkMatchday(json){
  const matchday = json['currentSeason']['currentMatchday']
  return matchday
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
    var data = '';
    res.on('data', (d) => {
      data += d;
    })
    res.on('end', () => {
      var json = JSON.parse(data)
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
  var matches = json['matches'];
  if (!matches) {
    throw ('Error: Matches not valid please check sentry ffs')
  }
  for (var i = 0;i < matches.length;i++) {
    var match = matches[i]
    var home_team = match['homeTeam']['name'];
    var away_team = match['awayTeam']['name'];
    var home_score = match['score']['fullTime']['homeTeam']
    var away_score = match['score']['fullTime']['awayTeam']
    var status = match['status'];
    home_team = fixTeamNameProblems(home_team);
    away_team = fixTeamNameProblems(away_team);
    var combined_score = home_score + away_score;
    if ((home_team && away_team) && (home_score || home_score == 0) && (away_score || away_score == 0)) {
      console.log(`Currently checking in updateDBScoresFootballData for: ${home_team} vs ${away_team} with a final score of ${home_score}-${away_score}`)
    }
    await new Promise((resolve, reject) => {Match.findOne({home_team: home_team, away_team: away_team}, async function(err, result){
      if (result.status !== status) {
        Match.updateOne({_id: result.id}, { $set: {status: status} }, function(err){
          if (err) throw err
          console.info('game status updated for '+home_team+' vs '+away_team+' to '+status)
        })
      }
      if (result == null||home_score == null){
        if (result) {
          if (home_score == null && away_score == null && result['kick_off_time'] < Date.now() && !(result['live_home_score'] > 0) && !(result['live_away_score'] > 0)) {
            console.log('set score in updatedbfootballdata1 '+home_team+' vs '+away_team+' to 0-0')
            await new Promise((resolve, reject) => {Match.updateOne({_id:result['_id']}, { $set: {live_home_score: 0, live_away_score: 0}}, function(err, result) {
              if (err) throw err
              console.info('set scores to 0')
              resolve()
            })})
          }
        }
        resolve()
      } else {
      var id = result['_id'];
      if (result['live_home_score']+result['live_away_score'] < combined_score || result['live_home_score'] == null || result['status'] == 'FINISHED') {
        // Update the score as it is greater than the previous score
        console.log('set score in updatedbfootballdata2 '+home_team+' vs '+away_team+' to '+home_score+' - '+away_score+' with id '+id)
        await new Promise((resolve, reject) => {Match.updateOne({_id:id}, { $set: {live_home_score: home_score, live_away_score: away_score, status: status}}, function(err, result){
          if (err) throw err
          console.info('score updated through football-data api')
          resolve()
        })})
        await scoreGames();
      }
      resolve()
      }
    })})
  }
}