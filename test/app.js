/* eslint-disable */
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongod = new MongoMemoryServer({ binary: { version: '4.4.6' } });

const chai = require('chai')
const chaiHttp = require('chai-http')

const mongoose = require('mongoose')

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
chai.should()
chai.use(chaiHttp)
chai.use(require('chai-as-promised'))
// Our parent block
before(async () => await connect());

before(function () {
    //silence the console
    console.log = function () {};
});

after(function () {
    //reset console
    delete console.log;
});

afterEach(async() => await clearDatabase());

after(async () => await disconnnect());

describe("Get all users", function() {
    it("should return user info", function(done) {
        done()
    })
})