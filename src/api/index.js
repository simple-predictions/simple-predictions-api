const Router = require('express')
const auth = require('./routes/auth').auth
const generic = require('./routes/generic').generic
const jobs = require('./routes/jobs').jobs
const predictions = require('./routes/predictions').predictions
const score = require('./routes/score').score

exports.routes = () => {
	const app = Router();
	auth(app);


	return app
}