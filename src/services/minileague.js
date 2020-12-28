const { getUserPredictions, getGameweek } = require('./predictions')

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

exports.miniLeaguePredictions = async (league_id) => {
  return await new Promise((resolve) => {
    MiniLeague.find({_id: league_id}).populate({path:'members', populate:{path: 'predictions', populate: {path: 'match'}}}).exec(async function (err, res) {
      if (err) throw err;
      var members = res[0]['members']
      const currentGameweek = await getGameweek()

      var match_preds_obj = {'matches': [], 'members':[]}
      for (var i = 0; i < members.length; i++) {
        // Loop through members
        var member = members[i]
        var member_predictions = member['predictions']
        member_predictions = member_predictions.sort((a,b) => a.match.kick_off_time - b.match.kick_off_time)
        console.log(member_predictions)
        for (var x = 0; x < member_predictions.length; x++) {
          // Loop through member's predictions
          // Every prediction has a match assosiated with it
          var prediction = member_predictions[x]
          // .toObject() very important here because otherwise it references itself and creates an infinite loop
          var match = prediction['match'].toObject()
          if (match['gameweek'] !== currentGameweek) {
            continue
          }
          var match_exists = match_preds_obj['matches'].some(arr_match => arr_match._id === match._id)
          if (!match_exists) {
            match['predictions'] = []
            match_preds_obj['matches'].push(match)
          }
          var match_index = match_preds_obj['matches'].findIndex(arr_match => arr_match._id === match._id)
          prediction = prediction.toObject()
          prediction['username'] = member['username']
          match_preds_obj['matches'][match_index]['predictions'].push(prediction)
        }
      }
      match_preds_obj['members'] = members
      resolve(match_preds_obj)
    })
  })
}

exports.getMiniLeagues = async (username) => {
  return await new Promise((resolve) => {
    User.findOne({username: username}, function(err, res) {
      if (err) throw err;
      const user_id = res['_id']

      MiniLeague.find({members: user_id }, function (err, res) {
        if (err) throw err;
      }).populate('members').exec(function (err, res) {
        if (err) throw err;
        resolve(res)
      })
    })
  })
}