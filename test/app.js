const chai = require('chai')
const chaiHttp = require('chai-http')
// const server = require('../app').server
// const should = chai.should()

chai.use(chaiHttp)
// Our parent block
describe('Games', () => {
    // Wait for cron jobs to replace
  /*
  * Test the /GET route
  */
    describe('/GET games', function(){
        it('it should GET all the games', function(done) {
            done()
        })
    });
});