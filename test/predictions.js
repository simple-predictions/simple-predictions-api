/* eslint-disable */
const { updatePrediction } = require('../src/services/predictions')
const Match = require('../src/models/user').match
const User = require('../src/models/user').user
const Prediction = require('../src/models/user').prediction

describe('predictions', function() {
    beforeEach(async () => {
        await User.register(new User({ username: 'sol', email: 'solomonabrahams100@gmail.com' }), 'testpass')
        const match = await Match.create({home_team: 'Arsenal', away_team: 'Tottenham'})
        this.ctx.currentTest.matchID = match['_id'].toString()
    })
    it("can be created individually", async function() {
        await updatePrediction('sol', 1, 0, this.test.matchID, false, false)
        const newMatch = await Match.findOne({})
        newMatch.predictions.should.have.length(1)
        const predID = newMatch.predictions[0]

        const pred = await Prediction.findOne({_id: predID})
        pred.home_pred.should.equal(1)
        pred.away_pred.should.equal(0)
        pred.match.toString().should.equal(this.test.matchID)
    })
    it('cannot have a banker and insurance', async function() {
        await updatePrediction('sol', 1, 0, this.test.matchID, true, true)
        const newMatch = await Match.findOne({})
        newMatch.predictions.should.have.length(0)
    })
})