/* eslint-disable */

const schema = require('../../src/api/graphql/index')
const { assert } = require('chai')
const { match: Match, user: User, prediction: Prediction } = require('../../src/models/user')

describe('test prediction schema', function() {
    it('should exist', function() {
        assert.isDefined(schema.getType('predictions'))
    })
    it('should create a prediction', async function() {
        const match = await Match.create({ home_team: 'Team 1', away_team: 'Team 2' })
        const queryRes = await this.graphQLServer.executeOperation({
            query: `
            mutation {
                updatePrediction(matchID: "${match._id}", home_pred: 1, away_pred: 0) {
                    home_pred
                    away_pred
                    author {
                        _id
                    }
                    match {
                        _id
                    }
                }
            }`
        })
        const matchRes = await Match.findOne({})
        const userRes = await User.findOne({})
        const predRes = await Prediction.findOne({})

        queryRes.data.updatePrediction.home_pred.should.equal(1)
        queryRes.data.updatePrediction.away_pred.should.equal(0)
        queryRes.data.updatePrediction.author._id.should.equal(userRes._id.toString())
        queryRes.data.updatePrediction.match._id.should.equal(matchRes._id.toString())

        predRes.home_pred.should.equal(1)
        predRes.away_pred.should.equal(0)
        predRes.author.toString().should.equal(userRes._id.toString())
        predRes.match.toString().should.equal(matchRes._id.toString())

        userRes.predictions.should.have.lengthOf(1)
        userRes.predictions[0].toString().should.equal(predRes._id.toString())

        matchRes.predictions.should.have.lengthOf(1)
        matchRes.predictions[0].toString().should.equal(predRes._id.toString())
    })
    it('should find a single prediction', async function() {
        const match = await Match.create({ home_team: 'Team 1', away_team: 'Team 2' })
        await this.graphQLServer.executeOperation({
            query: `
            mutation {
                updatePrediction(matchID: "${match._id}", home_pred: 1, away_pred: 0) {
                    home_pred
                    away_pred
                }
            }`
        })

        const queryRes = await this.graphQLServer.executeOperation({
            query: `
            query {
                predictionOne {
                    home_pred
                    away_pred
                    author {
                        username
                    }
                }
            }
            `
        })
        queryRes.data.predictionOne.author.username.should.equal('sol')
        queryRes.data.predictionOne.home_pred.should.equal(1)
        queryRes.data.predictionOne.away_pred.should.equal(0)
    })
    it('should find multiple predictions', async function() {
        const match = await Match.create({ home_team: 'Team 1', away_team: 'Team 2' })
        await this.graphQLServer.executeOperation({
            query: `
            mutation {
                updatePrediction(matchID: "${match._id}", home_pred: 1, away_pred: 0) {
                    home_pred
                    away_pred
                }
            }`
        })

        const queryRes = await this.graphQLServer.executeOperation({
            query: `
            query {
                predictionMany {
                    home_pred
                    away_pred
                    author {
                        username
                    }
                }
            }
            `
        })

        queryRes.data.predictionMany.should.have.lengthOf(1)
        queryRes.data.predictionMany[0].author.username.should.equal('sol')
        queryRes.data.predictionMany[0].home_pred.should.equal(1)
        queryRes.data.predictionMany[0].away_pred.should.equal(0)
    })
    it('shouldn\'t return other user\'s future predictions', async function() {
        const match = await Match.create({ home_team: 'Team 1', away_team: 'Team 2', kick_off_time: new Date(Date.now() + 604800000) })
        const user = await User.register(new User({ username: 'other', email: 'other@gmail.com' }), 'testpass')
        const pred = await Prediction.create({ match: match._id, author: user._id, home_pred: 1, away_pred: 0 })
        await Match.updateOne({}, {predictions: pred._id})

        const queryRes = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne {
                    home_team
                    away_team
                    predictions {
                        home_pred
                        away_pred
                    }
                }
            }
            `
        })

        queryRes.data.matchOne.home_team.should.equal('Team 1')
        queryRes.data.matchOne.away_team.should.equal('Team 2')

        queryRes.data.matchOne.predictions.should.have.lengthOf(0)
    })
    it('should return other user\'s past predictions', async function() {
        const match = await Match.create({ home_team: 'Team 1', away_team: 'Team 2', kick_off_time: new Date(Date.now() - 604800000) })
        const user = await User.register(new User({ username: 'other', email: 'other@gmail.com' }), 'testpass')
        const pred = await Prediction.create({ match: match._id, author: user._id, home_pred: 1, away_pred: 0 })
        await Match.updateOne({}, {predictions: pred._id})

        const queryRes = await this.graphQLServer.executeOperation({
            query: `
            query {
                matchOne {
                    home_team
                    away_team
                    predictions {
                        home_pred
                        away_pred
                    }
                }
            }
            `
        })

        queryRes.data.matchOne.home_team.should.equal('Team 1')
        queryRes.data.matchOne.away_team.should.equal('Team 2')

        queryRes.data.matchOne.predictions.should.have.lengthOf(1)
        queryRes.data.matchOne.predictions[0].home_pred.should.equal(1)
        queryRes.data.matchOne.predictions[0].away_pred.should.equal(0)
    })
})