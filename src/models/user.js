const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const { composeWithMongoose } = require('graphql-compose-mongoose')

const UserSchema = new mongoose.Schema({
  predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  email: String,
  active: Boolean,
  verification_token: String,
  expoPushToken: String
})

const PredictionSchema = new mongoose.Schema({
  home_pred: Number,
  away_pred: Number,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'matches'
  },
  locked: { type: Boolean, default: false },
  points: Number,
  banker: Boolean,
  insurance: Boolean
})

const MatchSchema = new mongoose.Schema({
  predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }],
  home_team: String,
  away_team: String,
  gameweek: Number,
  kick_off_time: Date,
  live_home_score: Number,
  live_away_score: Number,
  status: String
})

UserSchema.plugin(passportLocalMongoose)

exports.user = mongoose.model('users', UserSchema)
exports.prediction = mongoose.model('predictions', PredictionSchema)
exports.match = mongoose.model('matches', MatchSchema)

exports.MatchTC = composeWithMongoose(exports.match)
exports.PredictionTC = composeWithMongoose(exports.prediction)
exports.UserTC = composeWithMongoose(exports.user)
