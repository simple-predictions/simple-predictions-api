const { getUserPredictions } = require('./predictions')

const MiniLeague = require('../models/minileague').minileague
const User = require('../models/user').user

exports.createMiniLeague = (username, league_name) => {
  User.find({username: username}, function(err, res) {
    if (err) throw err;
    const user_id = res[0]['_id']
    MiniLeague.create({name: league_name, members: [user_id]}, function (err,res) {
      if (err) throw err;
    })
  })
}

exports.joinMiniLeague = (username, league_name) => {
  User.find({username: username}, function(err, res) {
    if (err) throw err;
    const user_id = res[0]['_id']
    MiniLeague.updateOne({name: league_name}, {$push: {members: user_id}}, function(err) {
      if (err) throw err;
    })
  })
}

exports.miniLeaguePredictions = async (league_name) => {
  return await new Promise((resolve) => {
    MiniLeague.find({name: league_name}).populate({path:'members', populate:{path: 'predictions', populate: {path: 'match'}}}).exec(function (err, res) {
      if (err) throw err;
      var members = res[0]['members']

      var match_preds_arr = []
      for (var i = 0; i < members.length; i++) {
        // Loop through members
        var member = members[i]
        var member_predictions = member['predictions']
        for (var x = 0; x < member_predictions.length; x++) {
          // Loop through member's predictions
          // Every prediction has a match assosiated with it
          var prediction = member_predictions[x]
          // .toObject() very important here because otherwise it references itself and creates an infinite loop
          var match = prediction['match'].toObject()
          var match_exists = match_preds_arr.some(arr_match => arr_match._id === match._id)
          if (!match_exists) {
            match['predictions'] = []
            match_preds_arr.push(match)
          }
          var match_index = match_preds_arr.findIndex(arr_match => arr_match._id === match._id)
          prediction = prediction.toObject()
          prediction['username'] = member['username']
          console.log(prediction)
          match_preds_arr[match_index]['predictions'].push(prediction)
        }
      }
      resolve(match_preds_arr)
    })
  })
}