const mongoose = require('mongoose')
const { composeWithMongoose } = require('graphql-compose-mongoose')

const MiniLeagueSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
})

exports.minileague = mongoose.model('minileagues', MiniLeagueSchema)
exports.MinileagueTC = composeWithMongoose(exports.minileague)
