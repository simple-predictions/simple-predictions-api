/* eslint-disable */

const { scoreGames, calculateScores } = require('../src/services/scoring')

describe('games', function() {
    describe("are scored correctly", function() {
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