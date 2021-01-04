const {addFriend, listFriends} = require('../../services/friends')
const getUserPredictions = require('../../services/predictions').getUserPredictions

exports.friends = (express) => {
  express.post('/addfriend', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const current_username = req.session.passport.user
    const friend_username = req.body.username
    if (current_username == friend_username) {
      res.status(403)
      res.json('You cannot add yourself as a friend')
      return
    }
    
    try {
      var res_text = await addFriend(current_username, friend_username)
      res.json(res_text)
    } catch(err) {
      res.status(403)
      res.json(err)
    }
  })

  express.get('/friends', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    
    const username = req.session.passport.user

    const friends_list = await listFriends(username)
    res.json(friends_list)
  })

  express.get('/friendpredictions', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const gameweek = req.query.gameweek || null

    const friend_username = req.query.username

    if (friend_username == req.session.passport.user) {
      const preds = await getUserPredictions(friend_username, gameweek, true)
    } else {
      preds = await getUserPredictions(friend_username, gameweek)
    }

    res.json(preds)
  })
}