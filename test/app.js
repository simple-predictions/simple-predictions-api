/* eslint-disable */
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongod = new MongoMemoryServer({ binary: { version: '4.4.6' } });

const chai = require('chai')
const chaiHttp = require('chai-http')
const getUserInfo = require('../src/services/auth').getUserInfo
const User = require('../src/models/user').user
const di = require('../src/loaders/di').di

const mongoose = require('mongoose')

const { createMiniLeague } = require('../src/services/minileague')

const connect = async () => {
    const uri = await mongod.getUri();
    
    const mongooseOpts = {
        useNewUrlParser: true,
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000
    };

    await mongoose.connect(uri, mongooseOpts);
}

const disconnnect = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}

// const server = require('../app').server
// const should = chai.should()

chai.use(chaiHttp)
// Our parent block
before(async () => {
    await connect();
});

after(async () => await disconnnect());

describe("Get all users", function() {
    it("should return user info", function(done) {
        done()
    })
})

describe('user', function() {
    it("can be created", async function() {
        await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass')
    })
    describe('read', function() {
        before(async () => {
            await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass').catch(err => {
                // Ignore error
            })
        })
        it("can be read", async function() {
            await getUserInfo('sol')
        })
    })
})