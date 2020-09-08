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

exports.miniLeaguePredictions = (league_name) => {
  MiniLeague.find({name: league_name}).populate({path:'members', populate:{path: 'predictions', populate: {path: 'match'}}}).exec(function (err, res) {
    if (err) throw err;
    console.log(JSON.stringify(res))
  })
}