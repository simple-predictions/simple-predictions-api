const routes = require('../api').routes
const cors = require('cors')
const express = require('express')

exports.app = ({app}) => {
  app.use(cors());

  // Load API Routes
  app.use('/', routes())
}