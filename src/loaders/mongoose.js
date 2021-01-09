const mongoose = require('mongoose')
const env = require('dotenv').config()['parsed'] || process.env;

exports.mongoose = async () => {
  const uri = env.MONGO_URI
  const connection = await mongoose.connect(uri, { useNewUrlParser: false, useCreateIndex: true, useUnifiedTopology: true });
  return connection.connection.db;
};