const init = require('../jobs/init').init

exports.jobs = ({ agenda }) => {
  init(agenda)
}
