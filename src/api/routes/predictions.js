const updatePrediction = require('../../services/predictions').updatePrediction
const getUserPredictions = require('../../services/predictions').getUserPredictions
const updateManyPredictions = require('../../services/predictions').updateManyPredictions

exports.predictions = (express) => {
  express.post('/updatemanypredictions', (req,res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const predictions = req.body.predictions

    updateManyPredictions(username, predictions)
  })

  express.post('/updateprediction', (req,res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const home_pred = req.body.home_pred
    const away_pred = req.body.away_pred
    const game_id = req.body.game_id

    updatePrediction(username, home_pred, away_pred, game_id)

    res.json();
  })

  express.get('/getuserpredictions', (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const gameweek = req.body.gameweek || null

    getUserPredictions(username, gameweek)
    res.json()
  })
}