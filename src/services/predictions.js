const Match = require('../models/user').match
const Prediction = require('../models/user').prediction
const User = require('../models/user').user

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