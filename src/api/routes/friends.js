const { addFriend, listFriends } = require('../../services/friends')
const getUserPredictions = require('../../services/predictions').getUserPredictions

exports.friends = express => {
  express.post('/addfriend', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const currentUsername = req.session.passport.user
    const friendUsername = req.body.username
    if (currentUsername === friendUsername) {
      res.status(403)
      res.json('You cannot add yourself as a friend')
      return
    }

    try {
      const resText = await addFriend(currentUsername, friendUsername)
      res.json(resText)
    } catch (err) {
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

    const friendsList = await listFriends(username)
    res.json(friendsList)
  })

  express.get('/friendpredictions', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const gameweek = req.query.gameweek || null

    const friendUsername = req.query.username

    if (friendUsername === req.session.passport.user) {
      const preds = await getUserPredictions(friendUsername, gameweek, true)
      res.json(preds)
    } else {
      const preds = await getUserPredictions(friendUsername, gameweek)
      res.json(preds)
    }
  })
}
