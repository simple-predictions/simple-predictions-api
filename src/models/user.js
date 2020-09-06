const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({});

UserSchema.plugin(passportLocalMongoose);

exports.user = mongoose.model("users", UserSchema)