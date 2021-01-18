const liveScoring = require('../../services/scoring')
const scoreGames = liveScoring.scoreGames

exports.score = express => {
  express.get('/updatelivescores', (req, res) => {
    liveScoring.updateLiveScores()
    console.log('Update live scores')
    res.json()
  })

  express.get('/updateoldscores', (req, res) => {
    if (req.query.gameweek) {
      liveScoring.updateFootballDataScores(req.query.gameweek)
    } else {
      liveScoring.updateFootballDataScores()
    }
    console.log('Update old scores')
    res.json()
  })

  express.get('/updateallscores', (req, res) => {
    liveScoring.updateLiveScores()
    liveScoring.updateFootballDataScores()
    console.log('Update all scores')
    res.json()
  })

  express.get('/updatetodayscores', (req, res) => {
    liveScoring.updateTodayGames()
    res.json()
  })

  express.get('/scoregames', (req, res) => {
    scoreGames()
    res.json()
  })
}
