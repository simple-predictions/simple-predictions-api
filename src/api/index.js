const Router = require('express')
const auth = require('./routes/auth').auth
const generic = require('./routes/generic').generic
const jira = require('./routes/jira').jira
const score = require('./routes/score').score
const games = require('./routes/games').games
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user.js').user
const env = require('dotenv').config().parsed || process.env
const expressSession = require('express-session')
const MemoryStore = require('memorystore')(expressSession)

const { ApolloServer } = require('apollo-server-express')

const schema = require('./graphql/index')

exports.routes = () => {
  const app = Router()

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const domain = env.CORS_DOMAIN

  passport.use(new LocalStrategy(User.authenticate()))
  passport.serializeUser(User.serializeUser())
  passport.deserializeUser(User.deserializeUser())

  app.use(passport.initialize())
  app.use(passport.session())

  app.use(expressSession({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: false, domain: domain },
    store: new MemoryStore({
      checkPeriod: 86400000
    })
  }))

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const username = req.session.passport?.user || 'solly'
      const id = await User.findOne({ username })
      return { username, id: id._id.toString() }
    },
    tracing: true
  })

  server.applyMiddleware({
    app,
    cors: false
  })

  auth(app)
  generic(app)
  jira(app)
  score(app)
  games(app)

  return app
}
