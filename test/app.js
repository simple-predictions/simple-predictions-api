/* eslint-disable */
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongod = new MongoMemoryServer();

const chai = require('chai')
const chaiHttp = require('chai-http')
const getUserInfo = require('../src/services/auth').getUserInfo
const mongoose = require('mongoose')

// const server = require('../app').server
// const should = chai.should()

chai.use(chaiHttp)
// Our parent block
describe("Get all users", function() {
    it("should return user info", function(done) {
        done()
    })
})