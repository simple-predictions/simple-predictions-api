const User = require('../models/user').user
const nodemailer = require('nodemailer')
const env = require('dotenv').config().parsed || process.env
console.log(env)
const randomstring = require('randomstring')
const ExpoSDK = require('expo-server-sdk').Expo

exports.auth_user = () => {
  return 'Success'
}

exports.createNewPassword = (username, verificationToken, password) => {
  return new Promise((resolve, reject) => {
    User.findOne({ username: username }, function (err, res) {
      if (err) throw err
      if (res) {
        if (res.verification_token === verificationToken) {
          // Password can be reset
          console.log('Will reset ' + username + "'s password")
          res.setPassword(password, function (err) {
            if (err) throw err
            res.verification_token = null
            res.save(function (err) {
              if (err) throw err
              resolve('Password updated. Please login using your new password.')
            })
          })
        } else {
          reject(new Error("Verification token doesn't match"))
        }
      } else {
        reject(new Error('User not found.'))
      }
    })
  })
}

exports.resetPassword = username => {
  return new Promise((resolve, reject) => {
    User.findOne({ username: username }, async function (err, res) {
      if (err) throw err
      if (res) {
        const verificationToken = randomstring.generate({
          length: 64
        })

        User.updateOne({ username: username }, { verification_token: verificationToken }, function (err) {
          if (err) throw err
        })

        const resetLink = 'http://www.saltbeefleague.co.uk/createnewpassword?verification_token=' + verificationToken + '&username=' + username

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'simplepredictions1@gmail.com',
            pass: env.GMAIL_PASSWORD
          }
        })

        const info = await transporter.sendMail({
          from: 'Simple Predictions <simplepredictions1@gmail.com>', // sender address
          to: res.email, // list of receivers
          subject: 'Password reset', // Subject line
          html: "Please <a href='" + resetLink + "'>click here</a>" // html body
        })

        if (info) {
          resolve('Email sent')
        }
      } else {
        reject(new Error('User not found.'))
      }
    })
  })
}

exports.getUserInfo = async username => {
  return await new Promise(resolve => {
    User.findOne({ username: username }, function (err, res) {
      if (err) throw err
    }).populate('friends').exec(async function (err, res) {
      if (err) throw err
      const points = await exports.getUserTotalPoints(username)
      res = res.toObject()
      res.totalPoints = points
      resolve(res)
    })
  })
}

exports.getUserTotalPoints = async username => {
  return await new Promise(resolve => {
    User.findOne({ username }, function (err) { if (err) throw err }).populate('predictions').exec(function (err, res) {
      if (err) throw err
      console.log(res)
      let totalPoints = 0
      for (let i = 0; i < res.predictions.length; i++) {
        const pred = res.predictions[i]
        totalPoints += pred.points
      }
      resolve(totalPoints)
    })
  })
}

exports.setUserExpoToken = async (username, expoPushToken) => {
  return await new Promise(resolve => {
    User.findOneAndUpdate({ username }, { expoPushToken }, function (err) {
      if (err) throw err
      resolve()
    })
  })
}

exports.sendExpoReminderNotifs = async gameweek => {
  const message = `Please do your predictions for gameweek ${gameweek}`
  const expo = new ExpoSDK({})
  const messages = []

  User.find({ expoPushToken: { $exists: true } }, function (err, res) {
    if (err) throw err
    for (let i = 0; i < res.length; i++) {
      const pushToken = res[i].expoPushToken
      messages.push({
        to: pushToken,
        sound: 'default',
        title: 'Predictions reminder',
        body: message,
        data: { gameweek, url: 'saltbeef://predictions' }
      })
    }
    console.log(messages)

    const chunks = expo.chunkPushNotifications(messages)
    const tickets = [];
    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
          console.log(ticketChunk)
          tickets.push(...ticketChunk)
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
          console.error(error)
        }
      }
    })()
  })
}
