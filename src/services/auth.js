const User = require('../models/user').user

exports.auth_user = () => {
  return 'Success'
}

exports.getUserInfo = async (username) => {
  return await new Promise((resolve) => {
    User.findOne({username: username}, function (err, res) {
      if (err) throw err;
      resolve(res)
    })
  })
}