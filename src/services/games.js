const https = require('https')
const Match = require('../models/user').match

exports.games = () => {
  const options = {
    host: 'cors-anywhere.herokuapp.com',
    path: '/https://footballapi.pulselive.com/football/fixtures?comps=1&teams=1,2,131,43,4,6,7,34,9,26,10,11,12,23,18,20,21,36,25,38&compSeasons=363&page=0&pageSize=1000&sort=asc&statuses=C,U,L&altIds=true',
    method: 'GET',
    port: 443,
    headers: { Origin: 'https://www.premierleague.com' }
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

function updateFixtures (json) {
  console.log('updating fixtures')

  const games = json.content
  for (let i = 0; i < games.length; i++) {
    const game = games[i]
    const homeTeam = game.teams[0].team.name
    const awayTeam = game.teams[1].team.name
    const gameweek = game.gameweek.gameweek
    const kickOffTime = game.kickoff.millis
    console.log(`${homeTeam} vs ${awayTeam} gw ${gameweek} millis ${kickOffTime}`)

    Match.findOneAndUpdate({ home_team: homeTeam, away_team: awayTeam }, { gameweek: gameweek, kick_off_time: kickOffTime }, { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false }, function (err, res) {
      if (err) throw err
    })
  }
}
