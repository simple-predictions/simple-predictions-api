const https = require('https')
const Match = require('../models/user').match

exports.games = () => {
  const options = {
    host: 'cors-anywhere.herokuapp.com',
    path: '/https://footballapi.pulselive.com/football/fixtures?comps=1&teams=1,2,131,43,4,6,7,34,9,26,10,11,12,23,18,20,21,36,25,38&compSeasons=363&page=0&pageSize=1000&sort=asc&statuses=U,L&altIds=true',
    method: 'GET',
    port: 443,
    headers: { 'Origin': 'https://www.premierleague.com' }
  }

  https.get(options, resp => {
    let data = ''

    resp.on('data', c => {
      data += c
    })

    resp.on('end', () => {
      const json = JSON.parse(data)
      updateFixtures(json)
    })
  })
}

function updateFixtures(json) {
  console.log('updating fixtures')

  const games = json['content']
  for (var i = 0; i < games.length; i++) {
    var game = games[i]
    var home_team = game['teams'][0]['team']['name']
    var away_team = game['teams'][1]['team']['name']
    var gameweek = game['gameweek']['gameweek']
    var kick_off_time = game['kickoff']['millis']

    Match.findOneAndUpdate({home_team: home_team, away_team: away_team}, {gameweek: gameweek, kick_off_time: kick_off_time}, {new:true, upsert: true, setDefaultsOnInsert: true}, function(err) {
      console.log(err)
    })
  }
}