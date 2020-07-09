let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app').server;
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Games', () => {
    // Wait for cron jobs to replace
  /*
  * Test the /GET route
  */
    describe('/GET games', function(){
        it('it should GET all the games', function(done) {
            setTimeout(function(){
            chai.request(server)
                .get('/data')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
            }, 5000)
        })
    });
});