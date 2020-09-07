const updatePrediction = require('../../services/predictions').updatePrediction

exports.predictions = (express) => {
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
  express.get('/getpredictions', (req, res) => {
    // https://footballapi.pulselive.com/football/compseasons/363/gameweeks
  })
}