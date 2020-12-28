exports.jobs = (express, agendaInstance) => {
  express.post('/replacecronjobs', (req,res) => {
    console.info('replace cron jobs called')
    replaceCronJobs()
    res.json()
  })

  express.post('/generatetwohours',(req, res) => {
    console.info('generate two hours called')
    generateTwoHoursScoreCheckingCron(agendaInstance)
    res.json()
  })
}