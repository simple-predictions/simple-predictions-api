const live_scoring = require('../../services/scoring')
const scoreGames = live_scoring.scoreGames

exports.score = (express) => {
  express.get('/updatelivescores',(req,res) => {
    live_scoring.updateLiveScores();
    console.log('Update live scores')
    res.json();
  })

  express.get('/updateoldscores',(req,res) => {
    if (req.query.gameweek) {
      live_scoring.updateFootballDataScores(req.query.gameweek)
    } else {
      live_scoring.updateFootballDataScores()
    }
    console.log('Update old scores')
    res.json();
  })

  express.get('/updateallscores',(req,res) => {
    live_scoring.updateLiveScores();
    live_scoring.updateFootballDataScores();
    console.log('Update all scores')
    res.json();
  })

  express.get('/scoregames',(req,res) => {
    scoreGames();
    res.json();
  })
}