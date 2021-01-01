const mongoose = require('mongoose')

exports.mongoose = async () => {
  const uri = 'mongodb://127.0.0.1:27017/simple-predictions-api'
  //const uri = 'mongodb+srv://compass:solaustin@simple-predictions-api-gpv4x.gcp.mongodb.net/simple-predictions-api?retryWrites=true&w=majority'
  const connection = await mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
  return connection.connection.db;
};