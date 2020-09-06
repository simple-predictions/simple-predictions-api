const auth_user = require('../../services/auth').auth_user
const passport = require('passport')
const User = require('../../models/user').user

exports.auth = (express) => {
  express.post('/login', passport.authenticate('local'), (req,res) => {
    res.json(auth_user())
  })

  express.post('/register', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    User.register(new User({username: username}), password, function (err, user) {
      if(err){
        console.log(err);
        return res.render("register");
      }
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secret");
      });
    })
  })
}