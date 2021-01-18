const auth_user = require('../../services/auth').auth_user
const passport = require('passport')
const User = require('../../models/user').user
const getUserInfo = require('../../services/auth').getUserInfo
const resetPassword = require('../../services/auth').resetPassword
const createNewPassword = require('../../services/auth').createNewPassword

exports.auth = (express) => {
  express.post('/resetpassword', async (req, res) => {
    const username = req.body.username
    if(!(username)) {
      res.status(500)
      res.json('Not all parameters were provided.')
    }
    try {
      const response = await resetPassword(username)
      res.json(response)
    } catch (error) {
      const response = error
      res.status(500)
      res.json(response)
    }
  })

  express.post('/createnewpassword', async (req, res) => {
    const username = req.body.username
    const verificationToken = req.body.verification_token
    const password = req.body.password
    if (!(username && verificationToken && password)) {
      res.status(500)
      res.json('Not all parameters were provided')
    }
    try {
      const response = await createNewPassword(username, verificationToken, password)
      res.json(response)
    } catch (error) {
      const response = error
      res.status(500)
      res.json(response)
    }
  })

  express.get('/test', (req, res) => {
    res.json('test')
  })

  express.post('/login', passport.authenticate('local'), (req,res) => {
    res.json(auth_user)
  })

  express.post('/register', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email
    if (!(username && password && email)) {
      res.status(500)
      res.json("You haven't provided a username, email and password.")
    }
    User.register(new User({username: username, email: email}), password, function (err, user) {
      if(err){
        console.log(err)
        res.status(409)
        res.json(err)
        return
      }
      passport.authenticate("local")(req, res, function(){
        res.status(200)
        res.json()
      });
    })
  })

  express.get('/userinfo', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user

    userinfo = await getUserInfo(username)
    res.json(userinfo)
  })
}