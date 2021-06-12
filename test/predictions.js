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
    it("can be updated individually", async function() {
        await updatePrediction('sol', 1, 0, this.test.matchID, false, false)
        let newMatch = await Match.findOne({})
        newMatch.predictions.should.have.length(1)
        let predID = newMatch.predictions[0]

        let pred = await Prediction.findOne({_id: predID})
        pred.home_pred.should.equal(1)
        pred.away_pred.should.equal(0)

        await updatePrediction('sol', 2, 1, this.test.matchID, false, false)
        newMatch = await Match.findOne({})
        newMatch.predictions.should.have.length(1)
        predID = newMatch.predictions[0]

        pred = await Prediction.findOne({_id: predID})
        pred.home_pred.should.equal(2)
        pred.away_pred.should.equal(1)

    })
    it('cannot have a banker and insurance', async function() {
        await updatePrediction('sol', 1, 0, this.test.matchID, true, true).should.eventually.be.rejectedWith('You cannot play an insurance and banker')
        const newMatch = await Match.findOne({})
        newMatch.predictions.should.have.length(0)
    })
    it('cannot have multiple predictions with a banker in the same week', async function() {
        const match1 = await Match.create({home_team: 'Team1', away_team: 'Team2', gameweek: 1})
        const match2 = await Match.create({home_team: 'Team3', away_team: 'Team4', gameweek: 1})
        const match3 = await Match.create({home_team: 'Team5', away_team: 'Team6', gameweek: 1})
        const match4 = await Match.create({home_team: 'Team7', away_team: 'Team8', gameweek: 1})
        const match5 = await Match.create({home_team: 'Team9', away_team: 'Team10', gameweek: 1})

        await updatePrediction('sol', 1, 0, match1['_id'], false, false)
        await updatePrediction('sol', 1, 0, match2['_id'], true, false)
        await updatePrediction('sol', 1, 0, match3['_id'], false, true)
        await updatePrediction('sol', 1, 0, match4['_id'], true, false)
        await updatePrediction('sol', 1, 0, match5['_id'], true, false)

        const newPredictions = await Prediction.find({}).populate('match')
        var bankerCount = 0
        for (let i = 0; i < newPredictions.length; i++) {
            const match = newPredictions[i]
            if (match.banker) {
                bankerCount++
            }
        }

        bankerCount.should.equal(1)
    })

    it('cannot have multiple predictions with a insurance in the same week', async function() {
        const match1 = await Match.create({home_team: 'Team1', away_team: 'Team2', gameweek: 1})
        const match2 = await Match.create({home_team: 'Team3', away_team: 'Team4', gameweek: 1})
        const match3 = await Match.create({home_team: 'Team5', away_team: 'Team6', gameweek: 1})
        const match4 = await Match.create({home_team: 'Team7', away_team: 'Team8', gameweek: 1})
        const match5 = await Match.create({home_team: 'Team9', away_team: 'Team10', gameweek: 1})

        await updatePrediction('sol', 1, 0, match1['_id'], false, false)
        await updatePrediction('sol', 1, 0, match2['_id'], false, true)
        await updatePrediction('sol', 1, 0, match3['_id'], true, false)
        await updatePrediction('sol', 1, 0, match4['_id'], false, true)
        await updatePrediction('sol', 1, 0, match5['_id'], false, true)

        const newPredictions = await Prediction.find({}).populate('match')
        var insuranceCount = 0
        for (let i = 0; i < newPredictions.length; i++) {
            const match = newPredictions[i]
            if (match.insurance) {
                insuranceCount++
            }
        }

        insuranceCount.should.equal(1)
    })
})