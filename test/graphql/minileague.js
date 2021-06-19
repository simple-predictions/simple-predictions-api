/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { minileague: Minileague } = require('../../src/models/minileague')
const { user: User } = require('../../src/models/user')

describe('test minileague schema', function() {
    it('should exist', function() {
        assert.equal(schema.getType('minileague'))
    })
    it('should get many minileagues', async function() {
        const userObj = await User.findOne({})
        const minileagueObj = await Minileague.create({ name: 'Test Minileague', members: [userObj._id] })
        await User.updateOne({}, { minileagues: [minileagueObj._id] })
        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                minileagueMany {
                    name
                    members {
                        username
                    }
                }
            }`
        })
        res.data.minileagueMany.should.have.lengthOf(1)
        res.data.minileagueMany[0].name.should.equal('Test Minileague')
        res.data.minileagueMany[0].members.should.have.lengthOf(1)
        res.data.minileagueMany[0].members[0].username.should.equal('sol')
    })
    it('should create a minileague', async function() {
        const res = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                createMinileague(leagueName: "Test Minileague") {
                    name
                    members {
                        username
                    }
                }
            }`
        })
        res.data.createMinileague.name.should.equal('Test Minileague')
        res.data.createMinileague.members.should.have.lengthOf(1)
        res.data.createMinileague.members[0].username.should.equal('sol')

        const mongoRes = await Minileague.findOne({})
        mongoRes.name.should.equal('Test Minileague')
        mongoRes.members.should.have.lengthOf(1)
    })
    it('should not create a minileague that already exists', async function() {
        await Minileague.create({ name: 'Test Minileague' })

        const res = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                createMinileague(leagueName: "Test Minileague") {
                    name
                    members {
                        username
                    }
                }
            }
            `
        })
        assert.isNull(res.data.createMinileague)
        res.errors.should.have.lengthOf(1)
        res.errors[0].message.should.equal('Mini league already exists')
    })
    it('should join a minileague', async function() {
        await Minileague.create({ name: 'Test Minileague' })
        
        const res = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                joinMinileague(leagueName: "Test Minileague") {
                    _id
                    name
                    members {
                        username
                    }
                }
            }`
        })
        const minileagueID = res.data.joinMinileague._id

        res.data.joinMinileague.members[0].username.should.equal('sol')

        const userRes = await User.findOne({})
        userRes.minileagues.should.have.lengthOf(1)
        userRes.minileagues[0].toString().should.equal(minileagueID)

        const minileagueRes = await Minileague.findOne({})
        minileagueRes.members.should.have.lengthOf(1)
    })
    it('should not join a minileague that doesn\'t exist', async function() {
        const res = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                joinMinileague(leagueName: "Test Minileague") {
                    _id
                    name
                    members {
                        username
                    }
                }
            }`
        })
        assert.isNull(res.data.joinMinileague)
        res.errors.should.have.lengthOf(1)
        res.errors[0].message.should.equal('Mini league not found')
    })
    it('should not join a minileague you\'re already in', async function() {
        await Minileague.create({ name: 'Test Minileague' })

        await this.graphQLServer.executeOperation({
            query: `
            mutation {
                joinMinileague(leagueName: "Test Minileague") {
                    _id
                    name
                    members {
                        username
                    }
                }
            }`
        })
        const res = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                joinMinileague(leagueName: "Test Minileague") {
                    _id
                    name
                    members {
                        username
                    }
                }
            }`
        })
        assert.isNull(res.data.joinMinileague)
        res.errors.should.have.lengthOf(1)
        res.errors[0].message.should.equal('You are already a member of this mini league')
    })
})