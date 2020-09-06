const Router = require('express')
const auth = require('./routes/auth').auth

exports.routes = () => {
	const app = Router();
	auth(app);

	return app
}