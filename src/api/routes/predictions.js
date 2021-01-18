const updatePrediction = require('../../services/predictions').updatePrediction
const getUserPredictions = require('../../services/predictions').getUserPredictions
const updateManyPredictions = require('../../services/predictions').updateManyPredictions

exports.predictions = express => {
  express.post('/updatemanypredictions', (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const predictions = req.body.predictions

    updateManyPredictions(username, predictions)
    res.json()
  })

  express.post('/updateprediction', (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const homePred = req.body.home_pred
    const awayPred = req.body.away_pred
    const gameID = req.body.game_id

    updatePrediction(username, homePred, awayPred, gameID)

    res.json()
  })

  express.get('/getuserpredictions', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const gameweek = parseInt(req.query.gameweek) || null

    const preds = await getUserPredictions(username, gameweek, true)
    res.json(preds)
  })
}
