/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { user: User } = require('../../src/models/user')

describe('test match schema', function() {
    it('should exist', function() {
        assert.isDefined(schema.getType('matches'))
    })
    it('should get a single user', async function() {
        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                userOne {
                    username
                    email
                }
            }`
        })
        res.data.userOne.username.should.equal('sol')
        res.data.userOne.email.should.equal('solomonabrahams100@gmail.com')
    })
    it("should hide another user's email address", async function() {
        await User.register(new User({ username: 'other', email: 'other@gmail.com' }), 'testpass')
        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                userOne(filter: {username: "other"}) {
                    username
                    email
                }
            }`
        })
        res.data.userOne.username.should.equal('other')
        assert.isNull(res.data.userOne.email)
    })
})