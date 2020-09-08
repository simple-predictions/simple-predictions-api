const { joinMiniLeague, createMiniLeague, miniLeaguePredictions } = require('../../services/minileague')

exports.minileague = (express) => {
  express.post('/createminileague', (req, res) => {
    /*if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user*/
    const username = 'sol'
    const league_name = req.body.league_name

    createMiniLeague(username, league_name)
    res.json({})
  })

  express.post('/joinminileague', (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const league_name = req.body.league_name

    joinMiniLeague(username, league_name)
    res.json({})
  })

  express.get('/minileaguepredictions', (req, res) => {
    const league_name = req.query.league_name
    console.log(req.query.league_name)
    miniLeaguePredictions(league_name)
    res.json({})
  })
}