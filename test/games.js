/* eslint-disable */
const { games } = require('../src/services/games')
const Match = require('../src/models/user').match

describe('games', function() {
    it('updates games', function(done) {
        games()
        Match.create({home_team: 'test'}, async function(err, res) {
            if (err) throw err;
            console.log('match done', err, res)
            const match = await Match.findOne({})
            console.log('here is a match', match)
        })
        setTimeout(async () => {
            return await Match.find({}, function(err, res){
                console.log(res, 'error check')
                res.should.have.lengthOf.within(378, 382)
                done()
            })
        }, 500)
    })
})