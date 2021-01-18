const { joinMiniLeague, createMiniLeague, miniLeaguePredictions, getMiniLeagues, miniLeagueTable } = require('../../services/minileague')

exports.minileague = express => {
  express.post('/createminileague', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }
    const username = req.session.passport.user
    const leagueName = req.body.league_name
    let response
    try {
      response = await createMiniLeague(username, leagueName)
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
    const leagueName = req.body.league_name
    let response

    try {
      response = await joinMiniLeague(username, leagueName)
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

    const leagueID = req.query.league_id
    const username = req.session.passport.user
    const gameweek = req.query.gameweek
    if (!leagueID) {
      res.status(500)
      res.json({ members: [], matches: [] })
      return
    }

    const preds = await miniLeaguePredictions(leagueID, username, gameweek)
    res.json(preds)
  })

  express.get('/minileaguetable', async (req, res) => {
    if (!req.session.passport) {
      res.status(401)
      res.json()
      return
    }

    const leagueID = req.query.league_id
    const table = await miniLeagueTable(leagueID)
    res.json(table)
  })
}
