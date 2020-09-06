const expressLoader = require('./express').app

exports.expressApp = async ({expressApp}) => {
  await expressLoader({ app: expressApp });
}