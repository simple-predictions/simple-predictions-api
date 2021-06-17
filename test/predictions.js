/* eslint-disable */
const { updatePrediction, updateManyPredictions, getUserPredictions } = require('../src/services/predictions')
const predictionModule = require('../src/services/predictions')
const Match = require('../src/models/user').match
const User = require('../src/models/user').user
const Prediction = require('../src/models/user').prediction
const sinon = require('sinon')

describe('predictions', function() {
    beforeEach(async () => {
        const match = await Match.create({home_team: 'Arsenal', away_team: 'Tottenham', gameweek: 1})
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
    it('can be updated collectively', async function() {
        const match1 = await Match.create({home_team: 'Team1', away_team: 'Team2', gameweek: 1})
        const match2 = await Match.create({home_team: 'Team3', away_team: 'Team4', gameweek: 1})
        const stub = sinon.stub(predictionModule, 'updatePrediction')
        const data = [
            {
                home_pred: 1,
                away_pred: 0,
                banker: false,
                insurance: false,
                game_id: this.test.matchID
            },
            {
                home_pred: 1,
                away_pred: 1,
                banker: true,
                insurance: false,
                game_id: match1._id
            },
            {
                home_pred: 1,
                away_pred: 0,
                banker: false,
                insurance: true,
                game_id: match2._id
            }
        ]
        await updateManyPredictions('sol', data)
        stub.args[0][1].should.equal(1)
        stub.args[0][2].should.equal(0)
        stub.args[1][1].should.equal(1)
        stub.args[1][2].should.equal(1)
        stub.args[2][1].should.equal(1)
        stub.args[2][2].should.equal(0)
        stub.args[1][4].should.equal(true)
        stub.args[1][5].should.equal(false)
        stub.args[2][4].should.equal(false)
        stub.args[2][5].should.equal(true)
        stub.restore()
    })
    it('can be updated collectively and retrieved', async function() {
        const match1 = await Match.create({home_team: 'Team1', away_team: 'Team2', gameweek: 1})
        const match2 = await Match.create({home_team: 'Team3', away_team: 'Team4', gameweek: 1})
        const data = [
            {
                home_pred: 1,
                away_pred: 0,
                banker: false,
                insurance: false,
                game_id: this.test.matchID
            },
            {
                home_pred: 1,
                away_pred: 1,
                banker: true,
                insurance: false,
                game_id: match1._id
            },
            {
                home_pred: 1,
                away_pred: 0,
                banker: false,
                insurance: true,
                game_id: match2._id
            }
        ]
        await updateManyPredictions('sol', data)
        
        const preds = await getUserPredictions('sol', 1, true)
        preds.data.should.have.length(3)
        preds.data[0].user_predictions[0].home_pred.should.equal(1)
        preds.data[0].user_predictions[0].away_pred.should.equal(0)
        preds.data[1].user_predictions[0].home_pred.should.equal(1)
        preds.data[1].user_predictions[0].away_pred.should.equal(1)
        preds.data[2].user_predictions[0].home_pred.should.equal(1)
        preds.data[2].user_predictions[0].away_pred.should.equal(0)
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
