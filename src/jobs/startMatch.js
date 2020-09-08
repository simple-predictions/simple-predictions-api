const { agenda } = require("../loaders/agenda");

exports.startMatch = (agendaInstance) => {
  agendaInstance.define('update scores in game', () => {
    // Updates scores from Twitter
    console.info('updating scores from twitter in cron job')
    live_scoring.updateLiveScores();
    // Updates scores from football-data.org
    // This doesn't need to be run until the end of the game!
    updateFootballDataScores();
  })

  console.info('generating two hours score checking cron')
  datetime = new Date(Date.now())
  var twoHourCheckScoreJobs = [];
  for (var i = 0;i < 120;i++) {
    datetime.setTime(datetime.getTime()+(1*60*1000))
    var minutes = datetime.getMinutes();
    var hours = datetime.getHours();
    var date = datetime.getDate();
    var month = datetime.getMonth();
    var job = agendaInstance.every(minutes+' '+hours+' '+date+' '+month+' *', 'update scores in game')
    //twoHourCheckScoreJobs.push(job);
  }
  /*
  for (var i = 0;i < twoHourCheckScoreJobs.length; i++) {
    job = twoHourCheckScoreJobs[i];
    job.start();
  }*/
}