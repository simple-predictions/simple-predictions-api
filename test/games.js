/* eslint-disable */
const { games } = require('../src/services/games')
const Match = require('../src/models/user').match

describe('games', function() {
    it('should be updated', function(done) {
        games().then(() => {
            Match.find({}, function(err, res){
                if (err) throw err
                res.should.have.lengthOf.within(370, 390)
                done()
            })
        })
    })
})