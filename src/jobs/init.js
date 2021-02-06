const generateTwoHoursScoreCheckingCron = require('./startMatch').startMatch
const Match = require('../models/user').match
const updateLiveScores = require('../services/scoring').updateLiveScores
const updateFootballDataScores = require('../services/scoring').updateFootballDataScores
const updateTodayGames = require('../services/scoring').updateTodayGames
const https = require('https')
const sendExpoReminderNotifs = require('../services/auth').sendExpoReminderNotifs

exports.init = async agendaInstance => {
  // DEBUG LINE NEXT
  // updateFootballDataScores()
  agendaInstance.cancel({ repeatInterval: { $exists: true, $ne: null } })
  agendaInstance.start()
  remindDoPreds(agendaInstance)
  generateTwoHoursScoreCheckingCron(agendaInstance, createScoreCheckingJobs)
  agendaInstance.start()
  console.info('replacing cron jobs')
  let timesArr = []
  await new Promise((resolve, reject) => {
    Match.distinct('kick_off_time', function (err, result) {
      if (err) throw err
      timesArr = result
      resolve()
    })
  })
  // Loop through times_arr
  for (let i = 0; i < timesArr.length; i++) {
    const time = timesArr[i]
    const datetime = new Date(time)
    // Checks if date if in future. If in past, skip iteration
    /* if (datetime < Date.now){
      continue
    } */
    // Run 2 minutes later than specified
    const minutes = datetime.getMinutes() + 2
    const hours = datetime.getHours()
    const date = datetime.getDate()
    const month = datetime.getMonth()
    agendaInstance.define('game start job ' + time, agendaInstance => {
      console.info('game start cron job running')
      generateTwoHoursScoreCheckingCron(agendaInstance, createScoreCheckingJobs)
    })
    agendaInstance.every(minutes + ' ' + hours + ' ' + date + ' ' + month + ' *', 'game start job ' + time)
    // jobs_arr.push(job)
  }

  function createScoreCheckingJobs (minutes, hours, date, month) {
    agendaInstance.define('update scores in game ' + hours + ' ' + minutes, () => {
      // Updates scores from Twitter
      console.info('updating scores from twitter in cron job')
      updateLiveScores()
      // Updates scores from football-data.org
      // This doesn't need to be run until the end of the game!
      updateFootballDataScores()
      updateTodayGames()
    })
    agendaInstance.every(minutes + ' ' + hours + ' ' + date + ' ' + month + ' *', 'update scores in game ' + hours + ' ' + minutes)
  }
  agendaInstance.start()
  /* for (var i = 0; i < jobs_arr.length;i++) {
    job = jobs_arr[i];
    job.start()
  } */
}

const remindDoPreds = async agendaInstance => {
  return await new Promise(resolve => {
    const options = {
      host: 'footballapi.pulselive.com',
      path: '/football/compseasons/363/gameweeks',
      method: 'GET',
      port: 443,
      headers: { Origin: 'https://www.premierleague.com' }
    }

    https.get(options, resp => {
      let data = ''

      resp.on('data', c => {
        data += c
      })

      resp.on('end', () => {
        const json = JSON.parse(data)
        const gameweekNum = createRemindDoPredsJobs(json, agendaInstance)
        resolve(gameweekNum)
      })
    })
  })
}

const createRemindDoPredsJobs = (json, agendaInstance) => {
  /* agendaInstance.define('test definition', () => {
    sendExpoReminderNotifs(20)
  })
  agendaInstance.now('test definition') */
  for (let i = 0; i < json.gameweeks.length; i++) {
    const gameweek = json.gameweeks[i]
    let time = gameweek.from.millis
    time = new Date(time - 86400000)
    if (Date.now() > time) {
      continue
    }
    const minutes = time.getMinutes() + 2
    const hours = time.getHours()
    const date = time.getDate()
    const month = time.getMonth()
    const gameweekNum = i + 1

    agendaInstance.define('send preds reminder notification ' + hours + ' ' + minutes + ' ' + date + ' ' + month, () => {
      sendExpoReminderNotifs(gameweekNum)
    })

    agendaInstance.schedule(time, 'send preds reminder notification ' + hours + ' ' + minutes + ' ' + date + ' ' + month)
  }
}
