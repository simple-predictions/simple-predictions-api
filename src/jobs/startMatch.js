const { agenda } = require("../loaders/agenda");

exports.startMatch = (agendaInstance, createScoreCheckingJobs) => {
  console.info('generating two hours score checking cron')
  datetime = new Date(Date.now())
  var twoHourCheckScoreJobs = [];
  for (var i = 0;i < 120;i++) {
    datetime.setTime(datetime.getTime()+(1*60*1000))
    var minutes = datetime.getMinutes();
    var hours = datetime.getHours();
    var date = datetime.getDate();
    var month = datetime.getMonth();
    createScoreCheckingJobs(minutes, hours, date, month)
    //twoHourCheckScoreJobs.push(job);
  }
  /*
  for (var i = 0;i < twoHourCheckScoreJobs.length; i++) {
    job = twoHourCheckScoreJobs[i];
    job.start();
  }*/
}