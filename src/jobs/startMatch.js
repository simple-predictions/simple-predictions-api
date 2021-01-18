exports.startMatch = (agendaInstance, createScoreCheckingJobs) => {
  console.info('generating two hours score checking cron')
  const datetime = new Date(Date.now())
  for (let i = 0; i < 120; i++) {
    datetime.setTime(datetime.getTime() + (1 * 60 * 1000))
    const minutes = datetime.getMinutes()
    const hours = datetime.getHours()
    const date = datetime.getDate()
    const month = datetime.getMonth()
    createScoreCheckingJobs(minutes, hours, date, month)
  }
}
