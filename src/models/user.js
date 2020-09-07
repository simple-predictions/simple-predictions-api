const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }]
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
    }
});

const MatchSchema = new mongoose.Schema({
    predictions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'predictions' }],
    home_team: String,
    away_team: String,
    gameweek: Number,
    kick_off_time: Date
});

UserSchema.plugin(passportLocalMongoose);

exports.user = mongoose.model("users", UserSchema)
exports.prediction = mongoose.model("predictions", PredictionSchema)
exports.match = mongoose.model("matches", MatchSchema)