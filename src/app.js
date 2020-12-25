require('monitor').start();

const env = require('dotenv').config()['parsed'] || process.env;

const Sentry = require('@sentry/node');
const environment = process.env.NODE_ENV || 'development';
const Tracing = require("@sentry/tracing");
//const {MongoClient} = require("mongodb");
const express = require('express')()

Sentry.init({
  dsn: 'https://4fc238857c344c5f90ecc4b3ebcce7d6@o342120.ingest.sentry.io/5264910',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Mongo(),
    new Tracing.Integrations.Express({express})
  ], 
  environment: environment,
  tracesSampleRate: 1.0
});

const path = require('path')
const PORT = process.env.PORT || 5000
const ids = { 'sol': '598f8e9a-af62-48e9-ac88-ae641071794d', 'phil': 'b64cd765-6564-41b0-8cfd-4e5b4721505e', 'jonny': '75406c71-6aa2-4ac5-801f-e87bd267613c', 'sam': '22c1c71f-d18a-455f-ad07-4263dbf0cacc', 'jacob': 'fce60643-3310-4e18-9e19-e5bc647df7a9', 'lila': '06ea1097-369b-40e2-8cf8-159265dfa708'}
exports.ids = ids;
const https = require('https');
const Twit = require('twit');

// Export for testing
const scoring = require('./scoring.js');

exports.https = https;

// Use imported app
express.use(Sentry.Handlers.requestHandler());
express.use(Sentry.Handlers.tracingHandler());
express.use(Sentry.Handlers.errorHandler());
require('./loaders').expressApp({ expressApp: express })

var T = new Twit({
  consumer_key:         'S5Kfhe84lyy5anAwIfipS5rzR',
  consumer_secret:      env['TWIT_CONSUMER_SECRET'],
  access_token:         '770278396005867521-L1NBvOb3mNYlXp87iQ6yd3aphk1Nz2T',
  access_token_secret:  env['TWIT_ACCESS_TOKEN_SECRET'],
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

express.listen(PORT, () => console.log(`Listening on ${ PORT }`))

// MongoDB connection
var table
const uri = 'mongodb://127.0.0.1:27017/simple-predictions-api'
//const uri = 'mongodb+srv://compass:solaustin@simple-predictions-api-gpv4x.gcp.mongodb.net/simple-predictions-api?retryWrites=true&w=majority'
/*const client = new MongoClient(uri, {useUnifiedTopology: true});
client.connect().then(() => {
  table = client.db('simple-predictions-api').collection('fixtures');
  exports.table = table;
  minileague_table = client.db('simple-predictions-api').collection('minileague');
  exports.minileague_table = minileague_table;
  //replaceCronJobs()
})*/

// LogDNA Bunyan connection
var bunyan = require('bunyan');
let LogDNAStream = require('logdna-bunyan').BunyanStream;

let logDNA = new LogDNAStream({
  key: env['LOG_DNA_KEY']
});

var logger = bunyan.createLogger({
  name: 'simple-predictions-api-nodejs',
  streams: [
    { stream: process.stdout },
    { stream: logDNA,
      type: 'raw'
    }
  ]
});

logger.info('Hello world!')

// Export new bearer function for use in scoring.js

function getTalkSportWeekNum(){ 
  return new Promise((resolve, reject) => {
  // Get auth token for TalkSport
  new_bearer().then(function(bearer){
    var options = {
      hostname: 'iknowthescore.co.uk',
      post: 443,
      path: '/engage/resources/predictions/display-gameweek/EN_PR',
      method: 'GET',
      headers: {
        'Authorization': bearer
      }
    }
    
    // Get latest week number
    https.get(options, (res) => {
      var data = '';
      res.on('data',(d) => {
        data += d
      })
      res.on('end',() => {
        json = JSON.parse(data);
        var talkSport_week_num = json['data']['attributes']['number']
        resolve(talkSport_week_num)
      })
    })
  })
})
}

// Export getTalkSportWeekNum function for use in scoring.js
exports.getTalkSportWeekNum = getTalkSportWeekNum;

function updateFixturesAndPredictions(week){
  new_bearer().then((bearer) => {
    var user_id = ids['sol'];
    var options = {
      hostname: 'iknowthescore.co.uk',
      port: 443,
      path: '/engage/resources/predictions/EN_PR/'+week+'/'+user_id,
      method: 'GET',
      headers: {
        'Authorization': bearer
      }
    }
    https.get(options, (res) => {
      data = ''
      res.on('data',(d) => {
        data += d;
      })
      res.on('end',()=>{
        data = data.toString('utf-8');
        console.log("about to log json request user's predictions with bearer token:"+options['headers'])
        json = JSON.parse(data);
        games_num = json['data'].length
        updateFixtures(json, games_num).then(() => {
          updatePredictions(week, bearer);
        })
      })
    })
  })
}

async function updateFixtures(json, games_num){
  var teams = [];
  games = json['included']
  for (var i=games_num; i < games_num*2; i++) {
    var team = games[i]['attributes']['name']
    teams.push([team])
  }
  for (var i=games_num*2; i < games_num*3; i++) {
    var team = games[i]['attributes']['name']
    var id = games[i-(games_num*2)]['id']
    var banker_mult = json['data'][i-(games_num*2)]['attributes']['bankerMultiplier']
    var kick_off_time = games[i-(games_num*2)]['attributes']['kickOff']
    teams[i-(games_num*2)].push(team);
    teams[i-(games_num*2)].push(id);
    teams[i-(games_num*2)].push(banker_mult);
    teams[i-(games_num*2)].push(kick_off_time);
  }
  var table = client.db('simple-predictions-api').collection('fixtures');
  await new Promise((resolve, reject) => table.find().toArray(async function(err,result){
    await removeOldFixtures(result, teams)
    await addNewFixtures(result, teams)
    resolve()
  }))
}

function removeOldFixtures(dbrows, gamesArr){
  return new Promise((resolve,reject) => {
  // Iterate through current database rows
  for (var i = 0; i < dbrows.length; i++) {
    // Find home and away teams for current database row (game)
    var dbrow = dbrows[i];
    var db_home_team = dbrow['home_team']
    var db_away_team = dbrow['away_team']
    teams = [db_home_team, db_away_team]
    db_id = dbrow['id']
    var index = gamesArr.find(game => {return db_id == game[2]})
    if (typeof index == 'undefined'){
      table.deleteOne({home_team: db_home_team, away_team: db_away_team})
    }
  }
  resolve()
  })
}

async function addNewFixtures(dbrows, gamesArr){
  // Iterate through rows to add
  for (var i = 0; i < gamesArr.length; i++) {
    var game = gamesArr[i];
    home_team = game[0];
    away_team = game[1];
    id = game[2];
    banker_mult = game[3];
    kick_off_time = game[4];
    await new Promise((resolve, reject) => {table.findOne({home_team: home_team, away_team: away_team, id: id}, function(err, result){
      if (result === null) {
        table.insertOne({home_team: home_team, away_team: away_team, id: id, banker_multiplier: banker_mult, kick_off_time: kick_off_time});
        resolve()
      } else {
        // Game already present
        resolve()
      }
    })})
  }
}

async function updatePredictions(week_num, bearer){
  const arr_ids = Object.entries(ids);
  for (var i in arr_ids) {
    name = arr_ids[i][0];
    id = arr_ids[i][1];
    options = {
      hostname: 'iknowthescore.co.uk',
      port: 443,
      path: '/engage/resources/predictions/EN_PR/'+week_num+'/'+id,
      method: 'GET',
      headers: {
        'Authorization': bearer
      }
    };
    await new Promise((resolve, reject) => {https.get(options, (res) => {
      var data = '';
      res.setEncoding('utf8')
      res.on('data', (d) => {
        data += d
      })
      res.on('end', () => {
        json = JSON.parse(data);
        // Now put JSON into an object
        addPredictionsToDB(json, name).then(() => {
          resolve();
        })
      })
    })
    })
  }
}

function addPredictionsToDB(json, name){
  return new Promise(async (resolve, reject) => {
  data = json['included'];
  for (var i = 0; i < data.length; i++) {
    var item = data[i]
    // Check that current item is a prediction
    if (item['type']!=='fixture-predictions'){
      // Skip if not prediction
      continue
    }
    id = item['relationships']['homeTeam']['data']['id']
    var new_values = { '$set' : {}};
    new_values['$set'][name+'_home_prediction'] = item['attributes']['home'];
    new_values['$set'][name+'_away_prediction'] = item['attributes']['away'];
    new_values['$set'][name+'_insurance'] = item['attributes']['insurance'];
    new_values['$set'][name+'_banker'] = item['attributes']['banker'];
    await new Promise((resolve, reject) => {table.updateOne({id: id}, new_values, function(err, result) {
      if (err) throw err;
      resolve()
    })})
  }
  resolve()
  })
}

async function updateFootballDataScores(){
  console.info('updateFootballDataScores called')
  //var talkSport_week_num = await getTalkSportWeekNum();
  table.findOne({}, async function(err, result){
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

function fixTeamNameProblems(name){
  name = name.replace('AFC','');
  name = name.replace('FC','');
  name = name.replace('Hotspur','');
  name = name.trim();
  if (name == 'Wolverhampton Wanderers') {name = 'Wolves'};
  if (name == 'Brighton & Hove Albion') {name = 'Brighton'};
  if (name == 'West Ham United') {name = 'West Ham'};
  if (name == 'Newcastle United') {name = 'Newcastle'};
  if (name == 'Crystal Palace') {name = 'Crystal Pal'};
  if (name == 'Manchester United') {name = 'Man Utd'};
  if (name == 'Manchester City') {name = 'Man City'};
  if (name == 'Leicester City') {name = 'Leicester'};
  return name
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
    await new Promise((resolve, reject) => {table.findOne({home_team: home_team, away_team: away_team}, async function(err, result){
      if (result == null||home_score == null){
        if (result) {
          if (home_score == null && away_score == null && result['kick_off_time'] > Date.now() && !(result['live_home_score'] > 0) && !(result['live_away_score'] > 0)) {
            console.log('set score in updatedbfootballdata1 '+home_team+' vs '+away_team+' to 0-0')
            await new Promise((resolve, reject) => {table.updateOne({id:id}, { $set: {live_home_score: 0, live_away_score: 0}}, function(err, result) {
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
        await new Promise((resolve, reject) => {table.updateOne({id:id}, { $set: {live_home_score: home_score, live_away_score: away_score, status: status}}, function(err, result){
          console.info('score updated through football-data api')
          resolve()
        })})
        await scoring.scoreGames();
      }
      // Still update game status as game is present
      await new Promise((resolve, reject) => {table.updateOne({id: id}, { $set: {status: status} }, function(err, result){
        console.info('game status updated')
        resolve()
      }
      )})
      resolve()
      }
    })})
  }
}

function checkMatchday(json,dbrow,away_team_id){
  for (var i = 0;i < json['matches'].length;i++) {
    var game = json['matches'][i];
    var away_team_id_json = game['awayTeam']['id'];
    //away_team_db = dbrow['away_team'];
    if (away_team_id_json == away_team_id) {
      var matchday = game['matchday'];
      return matchday;
    }
  }
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

function getData(){
  return new Promise((resolve, reject) => {
    var data;
    table.find().toArray((err, result) => {
      if (err) throw err;
      data = result;
      resolve(data);
    })
  });
}

// Minileague

function getMiniLeagueTable() {
  return new Promise((resolve, reject) => {
    var data;
    minileague_table.find().toArray((err, result) => {
      data = result;
      resolve(data);
    })
  });
}


// TEST ROUTE


// TIMING SECTION
/*var CronJob = require('cron').CronJob;

var update_fixtures_job = new CronJob('20 * * * *', function () {
  console.info('updating fixture list...')
  getTalkSportWeekNum().then((weeknum) => {
    updateFixturesAndPredictions(weeknum)
  })
})

update_fixtures_job.start()

var update_minileague_job = new CronJob('30 * * * *', function() {
  console.info('updating minileague data...')
  scoring.updateMiniLeague();
})

update_minileague_job.start()

var master_job = new CronJob('0 0 * * 1', function() {
  console.log('master cron is running')
  replaceCronJobs()
})

master_job.start()*/
