const User = require('../models/user').user

exports.addFriend = (currentUsername, friendUsername) => {
  return new Promise((resolve, reject) => {
    User.findOne({ username: friendUsername }, function (err, res) {
      if (err) throw err
      if (res == null) {
        reject(new Error('Username not found'))
        return
      }
      User.updateOne({ username: currentUsername }, { $addToSet: { friends: res._id } }, function (err, res) {
        if (err) throw err
        if (res.nModified === 1) {
          resolve('Success')
        } else {
          reject(new Error('You are already following ' + friendUsername))
        }
      })
    })
  })
}

exports.listFriends = username => {
  return new Promise((resolve, reject) => {
    User.findOne({ username: username }, function (err) { if (err) throw err }).populate('friends').exec(function (err, res) {
      if (err) throw err
      const resArr = [{ name: 'Mine', _id: res._id }]

      for (let i = 0; i < res.friends.length; i++) {
        const friend = res.friends[i]
        resArr.push({ name: friend.username, _id: friend._id })
      }

      resolve(resArr)
    })
  })
}
