const new_bearer = require('../../services/auth').new_bearer

exports.auth = (express) => {
  express.get('/token',(req,res) => {
    new_bearer().then(function(bearer){
      res.json(bearer);
    })
  })
}