const mongoose = require('mongoose')
const env = require('dotenv').config().parsed || process.env

exports.mongoose = async () => {
  const uri = env.MONGO_URI
  mongoose.set('debug', true)

  const connection = await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
  return connection.connection.db
}
