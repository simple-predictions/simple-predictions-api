const mongoose = require('mongoose')

exports.mongoose = async () => {
  const uri = 'mongodb+srv://compass:solaustin@simple-predictions-api-gpv4x.gcp.mongodb.net/simple-predictions-api?retryWrites=true&w=majority'
  const connection = await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });
  return connection.connection.db;
};