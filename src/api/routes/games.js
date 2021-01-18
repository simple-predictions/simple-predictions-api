const updateFixtures = require('../../services/games').games

exports.games = express => {
  express.get('/updatefixtures', (req, res) => {
    updateFixtures()
    res.json()
  })
}
