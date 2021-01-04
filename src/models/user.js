const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
});

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
    points: Number
});

const MatchSchema = new mongoose.Schema({
    predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }],
    home_team: String,
    away_team: String,
    gameweek: Number,
    kick_off_time: Date,
    live_home_score: Number,
    live_away_score: Number,
    status: String
});

UserSchema.plugin(passportLocalMongoose);

exports.user = mongoose.model("users", UserSchema)
exports.prediction = mongoose.model("predictions", PredictionSchema)
exports.match = mongoose.model("matches", MatchSchema)