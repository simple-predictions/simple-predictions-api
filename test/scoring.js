/* eslint-disable */

const { scoreGames, calculateScores, parseTwitterLiveScores, updateLiveScores, updateDBScoresFootballData, updateFootballDataScores } = require('../src/services/scoring')
const scoringModule = require('../src/services/scoring')
const Match = require('../src/models/user').match
const Prediction = require('../src/models/user').prediction
const sinon = require('sinon')

describe('games', function() {
    it("are updated historically from football data scores", async function() {
        const stub = sinon.stub(scoringModule, 'updateDBScoresFootballData')
        await updateFootballDataScores()
        const matches = stub.args[0][0].matches
        matches.should.have.lengthOf(10)
    })

    it("are updated live from twitter", async function() {
        await updateLiveScores()
    })

    it("are updated and parsed live from twitter", async function() {
        const pred1 = await Prediction.create({home_pred: 1, away_pred: 1})
        const pred2 = await Prediction.create({home_pred: 0, away_pred: 1})
        await Match.create({home_team: 'Liverpool', away_team: 'Bournemouth', live_home_score: 0, live_away_score: 1, predictions: [ pred1['_id'], pred2['_id'] ]})
        const tweet1 = {
            text: 'GOAL Liverpool 1-3 Bournemouth (72 mins) Champions respond! Leroy Sane drills low across goal from the left and his pinpoint effort goes in off the post #MCILIV'
        }
        const tweet2 = {
            text: 'Liverpool 1-3 Bournemouth (72 mins) Champions respond! Leroy Sane drills low across goal from the left and his pinpoint effort goes in off the post #MCILIV'
        }
        await parseTwitterLiveScores({data: [tweet1, tweet2]})
        const new_match = await Match.findOne({})
        const new_pred1 = await Prediction.findOne({_id: pred1['_id']})
        const new_pred2 = await Prediction.findOne({_id: pred2['_id']})
        new_match.live_home_score.should.equal(1)
        new_match.live_away_score.should.equal(3)
        new_pred1.points.should.equal(-10)
        new_pred2.points.should.equal(10)
    })

    it("are scored correctly from database", async function() {
        const pred1 = await Prediction.create({home_pred: 0, away_pred: 1})
        const pred2 = await Prediction.create({home_pred: 1, away_pred: 1})
        const pred3 = await Prediction.create({home_pred: 1, away_pred: 0})
        await Match.create({live_home_score: 0, live_away_score: 1, predictions: [ pred1['_id'], pred2['_id'], pred3['_id'] ]})
        await scoreGames()
        const new_pred = await Prediction.find({})
        new_pred[0]['points'].should.equal(30)
        new_pred[1]['points'].should.equal(-10)
        new_pred[2]['points'].should.equal(-10)
    })

    describe("scores are calculated correctly", function() {
        it("when prediction is exactly correct", function() {
            calculateScores(1, 0, 1, 0, false, false, 2).should.equal(30)
            calculateScores(0, 1, 0, 1, false, false, 2).should.equal(30)
            calculateScores(0, 0, 0, 0, false, false, 2).should.equal(30)
        })

        it("when prediction goal difference is correct", function() {
            calculateScores(1, 0, 2, 1, false, false, 2).should.equal(15)
            calculateScores(0, 1, 1, 2, false, false, 2).should.equal(15)
            calculateScores(0, 0, 1, 1, false, false, 2).should.equal(20)
        })

        it("when prediction outcome is correct", function() {
            calculateScores(1, 0, 3, 1, false, false, 2).should.equal(10)
            calculateScores(0, 1, 0, 2, false, false, 2).should.equal(10)
            calculateScores(0, 0, 1, 1, false, false, 2).should.equal(20)
        })

        it("when prediction is incorrect", function() {
            calculateScores(1, 0, 0, 1, false, false, 2).should.equal(-10)
            calculateScores(0, 1, 0, 0, false, false, 2).should.equal(-10)
            calculateScores(0, 0, 2, 1, false, false, 2).should.equal(-10)
        })

        it("when banker is used", function() {
            calculateScores(1, 0, 0, 1, true, false, 2).should.equal(-20)
            calculateScores(0, 0, 1, 1, true, false, 2).should.equal(40)
            calculateScores(0, 1, 0, 1, true, false, 3).should.equal(90)
        })

        it("when insurance is used", function() {
            calculateScores(1, 0, 0, 1, false, true, 2).should.equal(0)
            calculateScores(0, 0, 1, 1, false, true, 2).should.equal(20)
            calculateScores(0, 1, 0, 1, false, true, 3).should.equal(30)
        })
    })
})