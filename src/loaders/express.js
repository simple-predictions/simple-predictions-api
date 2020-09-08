const routes = require('../api').routes
const cors = require('cors')
const express = require('express')

exports.app = ({app}) => {
  app.get('/status', (req, res) => {
    res.status(200).end();
  });

  app.use(cors({origin: 'http://127.0.0.1:3000', credentials: true}));

  // Load API Routes
  app.use('/', routes())
}