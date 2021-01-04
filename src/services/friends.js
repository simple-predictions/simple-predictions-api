const User = require('../models/user').user

exports.addFriend = (current_username, friend_username) => {
  return new Promise((resolve, reject) => {User.findOne({username: friend_username}, function(err, res) {
    if (res == null) {
      reject('Username not found')
      return
    }
    if (err) throw err
    console.log(res, current_username, friend_username)
    User.updateOne({username: current_username}, {$addToSet: {friends: res._id}}, function(err, res) {
      if (err) {
        throw err
      } else {
        if (res.nModified === 1) {
          resolve('Success')
        } else {
          reject('You are already following '+friend_username)
        }
      }
    })
  })})
}

exports.listFriends = (username) => {
  return new Promise((resolve, reject) => {
    User.findOne({username: username}, function(err) {if (err) throw err}).populate('friends').exec(function(err, res) {
      if (err) throw err
      res_arr = [{name: 'Mine', _id: res._id}]

      for (var i = 0; i < res.friends.length; i++) {
        var friend = res.friends[i]
        res_arr.push({name: friend.username, _id: friend._id})
      }

      resolve(res_arr)
  })})
}