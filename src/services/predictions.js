const Match = require('../models/user').match
const Prediction = require('../models/user').prediction
const User = require('../models/user').user
const https = require('https')

exports.updateManyPredictions = async (username, json) => {
  const promises = []
  const specialPreds = []
  for (let i = 0; i < json.length; i++) {
    const prediction = json[i]
    const homePred = prediction.home_pred
    const awayPred = prediction.away_pred
    const banker = prediction.banker
    const insurance = prediction.insurance
    if (isNaN(homePred) || isNaN(awayPred) || homePred.length === 0 || awayPred.length === 0) {
      continue
    }
    if (banker || insurance) {
      specialPreds.push(prediction)
      continue
    }
    const gameID = prediction.game_id
    promises.push(this.updatePrediction(username, homePred, awayPred, gameID))
  }
  Promise.allSettled(promises).then(() => {
    for (let i = 0; i < specialPreds.length; i++) {
      const prediction = specialPreds[i]
      const homePred = prediction.home_pred
      const awayPred = prediction.away_pred
      const banker = prediction.banker
      const insurance = prediction.insurance
      const gameID = prediction.game_id
      if (insurance && banker) {
        continue
      }
      this.updatePrediction(username, homePred, awayPred, gameID, banker, insurance)
    }
  })
}

exports.updatePrediction = (username, homePred, awayPred, gameID, banker, insurance) => {
  return new Promise((resolve, reject) => {
    if (insurance && banker) {
      reject(new Error('You cannot play an insurance and banker'))
      return
    }
    User.findOne({ username: username }, function (err, res) {
      const userID = res._id
      if (err) throw err
      Match.findOne({ _id: gameID }).populate({ path: 'predictions', match: { author: userID } }).exec(function (err, match) {
        if (err) throw err
        const gameweek = match.gameweek
        Match.find({ $and: [{ gameweek: gameweek }] }).populate({ path: 'predictions', match: { $and: [{ author: userID }, { $or: [{ banker: true }, { insurance: true }] }] } }).exec(function (err, otherGames) {
          if (err) throw err
          otherGames = otherGames.filter(game => game.predictions.length > 0)
          let insuranceCount = 0
          let bankerCount = 0
          for (let i = 0; i < otherGames.length; i++) {
            if (otherGames[i]._id.toString() === gameID) continue
            if (otherGames[i].predictions[0].banker) { bankerCount += 1 }
            if (otherGames[i].predictions[0].insurance) { insuranceCount += 1 }
          }
          if (insuranceCount > 1 || (insuranceCount === 1 && insurance)) {
            console.log('INSURANCE CLEARED')
            insurance = false
          }
          console.log('Banker info', bankerCount, banker)
          if (bankerCount > 1 || (bankerCount === 1 && banker)) {
            console.log('BANKER CLEARED')
            banker = false
          }
          if (new Date(match.kick_off_time).getTime() < Date.now()) {
            reject(new Error('You cannot modify your predictions after kick off'))
            return
          }
          const prediction = match.predictions[0]
          if (!prediction) {
            Prediction.create({ home_pred: homePred, away_pred: awayPred, author: userID, match: match._id, banker: banker, insurance: insurance }, function (err, res) {
              if (err) throw err
              User.updateOne({ _id: userID }, { $push: { predictions: res._id } }, function (err) {
                if (err) throw err
              })
              Match.updateOne({ _id: gameID }, { $push: { predictions: res._id } }, function (err) {
                if (err) throw err
              })
              resolve()
            })
          } else {
            const userPred = prediction
            console.log(banker, insurance)
            Prediction.updateOne({ _id: userPred._id }, { home_pred: homePred, away_pred: awayPred, author: userID, match: match._id, banker: banker, insurance: insurance }, function (err) {
              if (err) throw err
              resolve()
            })
          }
        })
      })
    })
  })
}

exports.getUserPredictions = async (username, gameweek, includeFuture) => {
  const talksportGameweek = await this.getGameweek()
  return await new Promise(resolve => {
    const gameweekNum = gameweek || talksportGameweek

    Match.find({ gameweek: gameweekNum }).sort('kick_off_time').populate({
      path: 'predictions',
      populate: { path: 'author' }
    }).exec(function (err, res) {
      const finalPredsArr = []

      if (err) throw err
      for (let i = 0; i < res.length; i++) {
        const match = res[i]
        const predictions = match.predictions
        const matchObj = {
          home_team: match.home_team,
          away_team: match.away_team,
          gameweek: match.gameweek,
          kick_off_time: match.kick_off_time,
          user_predictions: [],
          _id: match._id,
          live_home_score: match.live_home_score,
          live_away_score: match.live_away_score,
          status: match.status
        }
        for (let x = 0; x < predictions.length; x++) {
          const prediction = predictions[x]
          const author = prediction.author.username
          if (author === username) {
            if (!includeFuture && Date.now() < match.kick_off_time) {
              continue
            }
            // This prediction belongs to the current user
            matchObj.user_predictions.push(prediction)
          } /* else {
            // This prediction doesn't belong to the current user
          } */
        }
        finalPredsArr.push(matchObj)
      }
      const retObj = { data: finalPredsArr, gameweek: gameweekNum }
      resolve(retObj)
    })
  })
}

exports.getGameweek = async function getGameweek () {
  return await new Promise(resolve => {
    const options = {
      host: 'footballapi.pulselive.com',
      path: '/football/compseasons/363/gameweeks',
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
        // resolve(gameweekNum)
        resolve(38)
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
