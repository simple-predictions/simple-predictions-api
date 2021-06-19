/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { user: User, match: Match } = require('../../src/models/user')
const { updateDBScoresFootballData } = require('../../src/services/scoring')

describe('test user schema', function() {
    it('should exist', function() {
        assert.isDefined(schema.getType('users'))
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
    it("should return a user's total points", async function() {
        const { _id: id } = await Match.create({home_team: 'Arsenal', away_team: 'Tottenham'})
        await this.graphQLServer.executeOperation({
            query: `
            mutation {
                updatePrediction(matchID: "${id}", home_pred: 1, away_pred: 0) {
                    home_pred
                    away_pred
                }
            }`
        })
        const data = {
            matches: [
                {
                    homeTeam: {
                        name: 'Arsenal'
                    },
                    awayTeam: {
                        name: 'Tottenham'
                    },
                    score: {
                        fullTime: {
                            homeTeam: 0,
                            awayTeam: 1
                        }
                    },
                    status: 'FINISHED'
                }
            ]
        }
        await updateDBScoresFootballData(data)

        const res = await this.graphQLServer.executeOperation({
            query: `
            query {
                userOne(filter: {username: "sol"}) {
                    username
                    email
                    totalPoints
                }
            }`
        })
        res.data.userOne.username.should.equal('sol')
        res.data.userOne.email.should.equal('solomonabrahams100@gmail.com')
        res.data.userOne.totalPoints.should.equal(-10)
    })
    describe("test friend schema", function() {
        it("should add friend", async function() {
            const friend = await User.register(new User({ username: 'other', email: 'other@gmail.com' }), 'testpass')

            const queryRes = await this.graphQLServer.executeOperation({
                query: `
                mutation {
                    addFriend(friendUsername: "other") {
                        username
                        friends {
                            username
                        }
                    }
                }`
            })

            queryRes.data.addFriend.username.should.equal("sol")
            queryRes.data.addFriend.friends.should.have.lengthOf(1)
            queryRes.data.addFriend.friends[0].username.should.equal("other")

            const user = await User.findOne({ username: 'sol' })
            user.friends.should.have.lengthOf(1)
            user.friends[0].toString().should.equal(friend._id.toString())
        })
        it("shouldn't add friends twice", async function() {
            const friend = await User.register(new User({ username: 'other', email: 'other@gmail.com' }), 'testpass')
            await this.graphQLServer.executeOperation({
                query: `
                mutation {
                    addFriend(friendUsername: "other") {
                        username
                        friends {
                            username
                        }
                    }
                }`
            })
            const queryRes = await this.graphQLServer.executeOperation({
                query: `
                mutation {
                    addFriend(friendUsername: "other") {
                        username
                        friends {
                            username
                        }
                    }
                }`
            })

            assert.isNull(queryRes.data.addFriend)
            queryRes.errors.should.have.lengthOf(1)
            queryRes.errors[0].message.should.equal("You are already friends")
        })
        it("shouldn't add friends that don't exist", async function() {
            const queryRes = await this.graphQLServer.executeOperation({
                query: `
                mutation {
                    addFriend(friendUsername: "other") {
                        username
                        friends {
                            username
                        }
                    }
                }`
            })

            assert.isNull(queryRes.data.addFriend)
            queryRes.errors.should.have.lengthOf(1)
            queryRes.errors[0].message.should.equal("User doesn't exist")
        })
    })
})