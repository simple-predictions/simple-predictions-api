const User = require('../models/user').user
const nodemailer = require('nodemailer');
const env = require('dotenv').config()['parsed'] || process.env;
const randomstring = require("randomstring");

exports.auth_user = () => {
  return 'Success'
}

exports.createNewPassword = (username, verification_token, password) => {
  return new Promise((resolve, reject) => {
    User.findOne({username: username}, function(err, res) {
      if (err) throw err
      if (res) {
        console.log(res.verification_token, verification_token)
        if (res.verification_token == verification_token) {
          // Password can be reset
          console.log('gonna reset')
          res.setPassword(password, function(err) {
            if (err) throw err
            res.verification_token = null
            res.save(function(err) {
              if (err) throw err
              resolve('Password updated. Please login using your new password.')
            })
          })
        } else {
          reject("Verification token doesn't match")
        }
      }
    })
  })
}

exports.resetPassword = (username) => {
  return new Promise((resolve, reject) => {
    User.findOne({username: username}, async function(err, res) {
      if (err) throw err
      if (res) {
        var verification_token = randomstring.generate({
          length: 64
        });

        User.updateOne({username: username}, {verification_token: verification_token}, function(err) {
          if (err) throw err
        })
        
        const reset_link = 'http://192.168.0.16:3000/createnewpassword?verification_token='+verification_token+'&username='+username

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'simplepredictions1@gmail.com',
            pass: env.GMAIL_PASSWORD
          }
        });
        
        const info = await transporter.sendMail({
          from: "Simple Predictions <simplepredictions1@gmail.com>", // sender address
          to: res.email, // list of receivers
          subject: "Password reset", // Subject line
          html: "Please <a href='"+reset_link+"'>click here</a>", // html body
        });

        if (info) {
          resolve('Email sent')
        }
      } else {
        reject('User not found.')
      }
    })
  })
}

exports.getUserInfo = async (username) => {
  return await new Promise((resolve) => {
    User.findOne({username: username}, function (err, res) {
      if (err) throw err;
      resolve(res)
    })
  })
}