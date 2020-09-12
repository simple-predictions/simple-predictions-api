const Container = require('typedi').Container
const agendaFactory = require('./agenda').agenda

exports.di = ({ mongoConnection, models }) => {
  try {
    models.forEach(m => {
      Container.set(m.name, m.model);
    });

    const agendaInstance = agendaFactory({ mongoConnection });
    agendaInstance.start()

    Container.set('agendaInstance', agendaInstance);

    return { agenda: agendaInstance };
  } catch(e) {
    console.log(e)
  }
}