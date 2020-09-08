const Match = require('../models/user').match
const Prediction = require('../models/user').prediction
const User = require('../models/user').user
const https = require('https')

exports.updatePrediction = (username, home_pred, away_pred, game_id) => {
  User.findOne({username: username}, function (err, res) {
    const user_id = res['_id']
    if (err) throw err;
    Match.findOne({_id: game_id}).populate({path: 'predictions'}).exec(function (err, match) {
      const predictions = match['predictions']
      const exists = predictions.some(pred => String(pred.author) == String(user_id))
      if (!exists) {
        Prediction.create({home_pred: home_pred, away_pred: away_pred, author: user_id, match: match['_id']}, function (err, res) {
          if (err) throw err;
          User.updateOne({_id: user_id}, {$push: {predictions: res['_id']}}, function (err) {
            if (err) throw err;
          })
          Match.updateOne({_id: game_id}, {$push: {predictions: res['_id']}}, function (err) {
            if (err) throw err;
          })
        })
      } else {
        const user_pred = predictions.find(pred => String(pred.author) == String(user_id))
        Prediction.updateOne({_id: user_pred._id}, {home_pred: home_pred, away_pred: away_pred, author: user_id, match: match['_id']}, function (err) {
          if (err) throw err;
        })
      }
    })
  })
}

exports.getUserPredictions = (username, gameweek) => {
  var gameweek_num = gameweek || getGameweek()
  gameweek_num = 1

  Match.find({gameweek: gameweek_num}).populate({
    path: 'predictions',
    populate: { path: 'author' }
  }).exec(function (err, res) {
    var final_preds_arr = []

    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      var match = res[i]
      var predictions = match['predictions']
      var match_obj = {
        home_team: match['home_team'],
        away_team: match['away_team'],
        gameweek: match['gameweek'],
        kick_off_time: match['kick_off_time'],
        user_predictions: []
      }
      for (var x = 0; x < predictions.length; x++) {
        var prediction = predictions[x]
        var author = prediction['author']['username']
        if (author === username) {
          // This prediction belongs to the current user
          match_obj.user_predictions.push(prediction)
        } else {
          // This prediction doesn't belong to the current user
        }
      }

      final_preds_arr.push(match_obj)
    }
    console.log(final_preds_arr)
  })
}

exports.getPrediction = (pred_id) => {
}

function getGameweek() {
  const options = {
    host: 'cors-anywhere.herokuapp.com',
    path: '/https://footballapi.pulselive.com/football/compseasons/363/gameweeks',
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
      const gameweek_num = calculateEarliestGameweek(json)
      return gameweek_num
    })
  })
}

function calculateEarliestGameweek(json) {
  const gameweeks = json['gameweeks']
  var gameweek_num
  for (var i = 0; i < gameweeks.length; i++) {
    var gameweek = gameweeks[i]
    if (gameweek['status'] == 'L') {
      gameweek_num = gameweek['gameweek']
      break
    } 
    if (gameweek['status'] == 'U') {
      gameweek_num = gameweek['gameweek'] - 1
      break
    }
  }

  if (gameweek_num == 0) gameweek_num = 1
  return gameweek_num
}