const { joinMiniLeague, createMiniLeague, miniLeaguePredictions, getMiniLeagues, miniLeagueTable } = require('../../services/minileague')

exports.minileague = (express) => {
  express.post('/createminileague', (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
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

  express.get('/minileagues', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user

    const minileagues = await getMiniLeagues(username)
    res.json(minileagues)
  })

  express.get('/minileaguepredictions', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    
    const league_id = req.query.league_id
    console.log(req.query.league_id)
    const preds = await miniLeaguePredictions(league_id)
    res.json(preds)
  })

  express.get('/minileaguetable', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const league_id = req.query.league_id
    const table = await miniLeagueTable(league_id)
    res.json(table)
  })
}