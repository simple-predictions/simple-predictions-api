exports.jobs = (express) => {
  express.get('/replacecronjobs', (req,res) => {
    console.info('replace cron jobs called')
    replaceCronJobs()
    res.json()
  })

  express.get('/generatetwohours',(req, res) => {
    console.info('generate two hours called')
    generateTwoHoursScoreCheckingCron()
    res.json()
  })
}