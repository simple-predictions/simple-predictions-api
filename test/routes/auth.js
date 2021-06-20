/* eslint-disable */
const { request, assert } = require('chai');
const chaiHttp = require('chai-http');
const User = require('../../src/models/user').user

describe("auth tests", function() {
    it("should login", async function() {
        const res = await request(this.server).post('/login').send({username: 'sol', password: 'testpass'})
        res.status.should.equal(200)
        assert.isNotNull(res.header['set-cookie'][0])
    })
    it("should not login", async function() {
        const res = await request(this.server).post('/login').send({username: 'incorrect', password: 'incorrect'})
        res.status.should.equal(401)
        assert.isUndefined(res.header['set-cookie'])
    })
    it("should register", async function() {
        const res = await request(this.server).post('/register').send({username: 'new', password: 'testpass', email: 'test@gmail.com'})
        res.status.should.equal(200)
        assert.isNotNull(res.header['set-cookie'][0])
    })
    it("should not register without an email", async function() {
        const res = await request(this.server).post('/register').send({username: 'new', password: 'testpass'})
        res.status.should.equal(500)
        assert.isUndefined(res.header['set-cookie'])
        assert.isNotNull(res.error)
        res.error.text.toString().should.equal("\"You haven't provided a username, email and password.\"")
    })
    it("should not register a user that already exists", async function() {
        const res = await request(this.server).post('/register').send({username: 'sol', password: 'testpass', email: 'test@gmail.com'})
        res.status.should.equal(409)
        assert.isUndefined(res.header['set-cookie'])
        assert.isNotNull(res.error)
        res.error.text.toString().should.equal(`{"name":"UserExistsError","message":"A user with the given username is already registered"}`)
    })
    it("should reset a user's password", async function() {
        const res = await request(this.server).post('/resetpassword').send({username: 'sol'})
        res.status.should.equal(200)
        await User.updateOne({ username: 'sol' }, { verification_token: 'stub' })
        res.body.should.equal("Email sent")

        const res1 = await request(this.server).post('/createnewpassword').send({username: 'sol', verification_token: 'stub', password: 'newpassword'})
        res1.status.should.equal(200)
        res1.body.should.equal("Password updated. Please login using your new password.")
        
        const res2 = await request(this.server).post('/login').send({username: 'sol', password: 'newpassword'})
        res2.status.should.equal(200)
        assert.isNotNull(res2.header['set-cookie'][0])
    })
    it("shouldn't get user info", async function() {
        const agent = request.agent(this.server)

        const res = await agent.post('/login').send({username: 'sol', password: 'testpass'})
        assert.isNotNull(res.header['set-cookie'][0])

        const res1 = await agent.get('/userinfo')
        console.info(res1.body)
        res1.status.should.equal(200)
        res1.body.username.should.equal('sol')
        res1.body.email.should.equal('solomonabrahams100@gmail.com')
    })
})