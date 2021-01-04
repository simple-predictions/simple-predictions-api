const routes = require('../api').routes
const cors = require('cors')
//const express = require('express');
const Agenda = require('agenda');

exports.app = ({app, agendaInstance}) => {
  app.get('/status', (req, res) => {
    res.status(200).end();
  });

  app.use(cors({origin: 'http://192.168.0.16:3000', credentials: true}));

  // Load API Routes
  app.use('/', routes(agendaInstance))
}