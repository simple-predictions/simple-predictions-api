exports.predictions = (express) => {
  express.get('/updateprediction', (req,res) => {
    const username = req.session.passport.user
    
    res.json();
  })
}