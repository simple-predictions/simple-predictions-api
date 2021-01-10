const { joinMiniLeague, createMiniLeague, miniLeaguePredictions, getMiniLeagues, miniLeagueTable } = require('../../services/minileague')

exports.minileague = (express) => {
  express.post('/createminileague', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const league_name = req.body.league_name

    try {
      var response = await createMiniLeague(username, league_name)
    } catch (err) {
      response = err
      res.status(403)
    }
    res.json(response)
  })

  express.post('/joinminileague', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const league_name = req.body.league_name

    try {
      var response = await joinMiniLeague(username, league_name)
    } catch (err) {
      response = err
      res.status(403)
    }
    res.json(response)
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
    const username = req.session.passport.user
    if (!league_id) {
      res.status(500)
      res.json({members: [], matches: []})
      return
    }

    const preds = await miniLeaguePredictions(league_id, username)
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