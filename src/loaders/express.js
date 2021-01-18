const routes = require('../api').routes
const cors = require('cors')
const env = require('dotenv').config().parsed || process.env

exports.app = ({ app, agendaInstance }) => {
  app.get('/status', (req, res) => {
    res.status(200).end()
  })

  app.use(cors({ origin: env.CORS_URL, credentials: true }))

  // Load API Routes
  app.use('/', routes(agendaInstance))
}
