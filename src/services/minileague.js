const { getUserPredictions, getGameweek } = require('./predictions')

const MiniLeague = require('../models/minileague').minileague
const Match = require('../models/user').match
const User = require('../models/user').user

exports.createMiniLeague = (username, league_name) => {
  return new Promise((resolve, reject) => {
    User.find({username: username}, function(err, res) {
    if (err) throw err;
    const user_id = res[0]['_id']
    MiniLeague.findOne({name: league_name}, function(err, existing_league) {
      if (err) throw err
      if (existing_league) {
        reject('A mini-league with this name already exists.')
        return
      } else {
        MiniLeague.create({name: league_name, members: [user_id]}, function (err,res) {
          if (err) throw err
          resolve('Mini-league created')
        })
      }
    })
  })})
}

exports.joinMiniLeague = (username, league_name) => {
  return new Promise((resolve, reject) => {
    User.find({username: username}, function(err, res) {
    if (err) throw err;
    const user_id = res[0]['_id']
    MiniLeague.updateOne({name: league_name}, {$addToSet: {members: user_id}}, function(err, res) {
      if (err) {
        throw err
      } else {
        if (res.n === 1) {
          if (res.nModified === 1) {
            resolve('Success')
          } else {
            reject('You are already a member of '+league_name)
          }
        } else {
          reject("Mini-league doesn't exist")
        }
      }
    })
  })})
}

function insertAndShift(arr, from, to) {
  let cutOut = arr.splice(from, 1) [0]; // cut the element at index 'from'
  arr.splice(to, 0, cutOut);            // insert it at index 'to'
}

exports.miniLeaguePredictions = async (league_id, username, gameweek) => {
  return await new Promise(async (resolve) => {
    const currentGameweek = parseInt(gameweek) || await getGameweek()
    Match.find({gameweek: currentGameweek}, null, {sort: {kick_off_time: 1}}, function(err, match_res) {
      if (err) throw err;
      match_res = match_res.map(obj => {
        obj['predictions'] = []
        return obj.toObject()
      })
      var match_preds_obj = {'matches': match_res, 'members':[]}

      MiniLeague.find({_id: league_id}).populate({path:'members', populate:{path: 'predictions', populate: {path: 'match'}}}).exec(function (err, res) {
        if (err) throw err;

        var members = res[0]['members']
        var myself_idx = members.findIndex((member) => member.username == username)
        var myself = members.splice(myself_idx, 1)[0]
        members.splice(0, 0, myself)
        
        for (var i = 0; i < members.length; i++) {
          // Loop through members
          var member = members[i]
          var member_predictions = member['predictions']
          member_predictions = member_predictions.sort((a,b) => a.match.kick_off_time - b.match.kick_off_time)
          for (var x = 0; x < member_predictions.length; x++) {
            // Loop through member's predictions
            // Every prediction has a match assosiated with it
            var prediction = member_predictions[x]
            // .toObject() very important here because otherwise it references itself and creates an infinite loop
            var match = prediction['match'].toObject()
            if (match['gameweek'] !== currentGameweek) {
              continue
            }

            var match_index = match_preds_obj['matches'].findIndex(arr_match => arr_match._id.toString() === match._id.toString())
            prediction = prediction.toObject()
            prediction['username'] = member['username']
            if (match.kick_off_time > Date.now() && prediction['username'] != username) {
              delete prediction.home_pred
              delete prediction.away_pred
              prediction['error_message'] = 'Not kicked off'
            }
            match_preds_obj['matches'][match_index]['predictions'].push(prediction)
          }
        }
        match_preds_obj['members'] = members
        resolve({preds: match_preds_obj, gameweek: currentGameweek})
      })
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

exports.miniLeagueTable = async (league_id) => {
  return await new Promise((resolve) => {
    MiniLeague.findOne({_id: league_id}, function(err, res) {
      if (err) throw err;
    }).populate({path: 'members', populate: { path: 'predictions'}}).exec(function(err, res) {
      if (err) throw err;
      var members = []
      for (var i = 0; i < res.members.length; i++) {
        var member_predictions = res.members[i].predictions
        var member_points = member_predictions.reduce(function(prev, cur) {
          return prev + cur.points;
        }, 0);
        members.push({username: res.members[i].username, points: member_points})
      }
      members.sort((a,b) => b.points - a.points)
      resolve(members)
    })
  })
}