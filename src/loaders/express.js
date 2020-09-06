const routes = require('../api').routes
const cors = require('cors')
const express = require('express')

exports.app = ({app}) => {
  app.get('/status', (req, res) => {
    res.status(200).end();
  });

  app.use(cors());

  // Load API Routes
  app.use('/', routes())
}