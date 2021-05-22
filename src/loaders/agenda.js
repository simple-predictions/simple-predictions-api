const Agenda = require('agenda')

exports.agenda = ({ mongoConnection }) => {
  return new Agenda({
    mongo: mongoConnection,
    processEvery: '2 minutes'
  })
  /**
   * This voodoo magic is proper from agenda.js so I'm not gonna explain too much here.
   * https://github.com/agenda/agenda#mongomongoclientinstance
   */
}
