const routes = require('../api').routes
const cors = require('cors')
const env = require('dotenv').config().parsed || process.env

exports.app = ({ app, agendaInstance }) => {
  app.get('/status', (req, res) => {
    res.status(200).end()
  })

  app.use(cors({ origin: ['https://www.saltbeefleague.co.uk', 'http://192.168.0.22:3000', 'https://studio.apollographql.com'], credentials: true }))

  // Load API Routes
  app.use('/', routes(agendaInstance))
}
