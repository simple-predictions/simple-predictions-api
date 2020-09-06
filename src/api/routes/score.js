express.get('/updatelivescores',(req,res) => {
  live_scoring.updateLiveScores();
  logger.info('Update live scores')
  res.json();
})

express.get('/updateoldscores',(req,res) => {
  updateFootballDataScores();
  logger.info('Update old scores')
  res.json();
})

express.get('/updateallscores',(req,res) => {
  live_scoring.updateLiveScores();
  updateFootballDataScores();
  logger.info('Update all scores')
  res.json();
})

express.post('/scoregames',(req,res) => {
  scoring.scoreGames();
  logger.info('Score games')
  res.json();
})