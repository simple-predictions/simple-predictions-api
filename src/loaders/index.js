const expressLoader = require('./express').app
const mongooseLoader = require('./mongoose').mongoose
const diLoader = require('./di').di
const jobsLoader = require('./jobs').jobs
const userModel = require('../models/user.js').user

exports.expressApp = async ({expressApp}) => {
  await expressLoader({ app: expressApp });
  
  const mongoConnection = await mongooseLoader();

  const { agenda } = await diLoader({
    mongoConnection,
    models: [
      userModel,
      // salaryModel,
      // whateverModel
    ],
  });

  await jobsLoader({agenda})
}