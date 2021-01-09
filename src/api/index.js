const Router = require('express')
const auth = require('./routes/auth').auth
const generic = require('./routes/generic').generic
const jobs = require('./routes/jobs').jobs
const jira = require('./routes/jira').jira
const predictions = require('./routes/predictions').predictions
const score = require('./routes/score').score
const games = require('./routes/games').games
const minileague = require('./routes/minileague').minileague
const friends = require('./routes/friends').friends
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.js').user
const env = require('dotenv').config()['parsed'] || process.env;
const express_session = require('express-session')
var MemoryStore = require('memorystore')(express_session)

exports.routes = (agendaInstance) => {
	const app = Router();

	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }));
	
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(express_session({    
		secret: env.SESSION_SECRET,    
		resave: false,    
		saveUninitialized: false,
		cookie: {httpOnly: false},
		store: new MemoryStore({
			checkPeriod: 86400000
		})
	}));

	passport.use(new LocalStrategy(User.authenticate()));
	passport.serializeUser(User.serializeUser());
	passport.deserializeUser(User.deserializeUser());

	auth(app);
	generic(app);
	jobs(app, agendaInstance);
	jira(app);
	predictions(app);
	score(app);
	games(app);
	minileague(app);
	friends(app)

	return app
}