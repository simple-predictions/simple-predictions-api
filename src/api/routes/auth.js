const auth_user = require('../../services/auth').auth_user
const passport = require('passport')
const User = require('../../models/user').user
const getUserInfo = require('../../services/auth').getUserInfo

exports.auth = (express) => {
  express.get('/test', (req, res) => {
    res.json('test')
  })

  express.post('/login', passport.authenticate('local'), (req,res) => {
    res.json(auth_user)
  })

  express.post('/register', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    User.register(new User({username: username}), password, function (err, user) {
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