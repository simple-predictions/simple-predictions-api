/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { user: User, match: Match } = require('../../src/models/user')
const { updatePrediction } = require('../../src/services/predictions')
const { updateDBScoresFootballData } = require('../../src/services/scoring')

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
    it("should return a user's total points", async function() {
        const { _id: id } = await Match.create({home_team: 'Arsenal', away_team: 'Tottenham'})
        await updatePrediction('sol', 1, 0, id, false, false)
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
})