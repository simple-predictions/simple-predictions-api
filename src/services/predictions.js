const https = require('https')

exports.getGameweek = async function getGameweek () {
  return await new Promise(resolve => {
    const options = {
      host: 'footballapi.pulselive.com',
      path: '/football/compseasons/418/gameweeks',
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
        // eslint-disable-next-line no-unused-vars
        const gameweekNum = calculateEarliestGameweek(json)
        resolve(gameweekNum)
      })
    })
  })
}

function calculateEarliestGameweek (json) {
  const gameweeks = json.gameweeks
  let gameweekNum
  for (let i = 0; i < gameweeks.length; i++) {
    const gameweek = gameweeks[i]
    if (gameweek.status === 'L' || gameweek.status === 'I') {
      gameweekNum = gameweek.gameweek
      break
    }
    if (gameweek.status === 'U') {
      if ((new Date(gameweek.from.millis)) - Date.now() < 559200000) { // Change back to 259200000
        gameweekNum = gameweek.gameweek
      } else {
        gameweekNum = gameweek.gameweek - 1
      }
      break
    }
  }

  if (gameweekNum === 0) gameweekNum = 1
  return gameweekNum
}
