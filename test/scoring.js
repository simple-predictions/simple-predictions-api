/* eslint-disable */

const { scoreGames, calculateScores } = require('../src/services/scoring')
const Match = require('../src/models/user').match
const Prediction = require('../src/models/user').prediction

describe('games', function() {
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