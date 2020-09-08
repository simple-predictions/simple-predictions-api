const generateTwoHoursScoreCheckingCron = require('./startMatch').startMatch
const Match = require('../models/user').match

exports.init = async (agendaInstance) => {
  console.info('replacing cron jobs')
  var jobs_arr = [];
  var times_arr = [];
  await new Promise((resolve, reject) => {Match.distinct('kick_off_time', function(err,result){
    if (err) throw err;
    times_arr = result;
    resolve()
  })});
  // Loop through times_arr
  for (var i = 0;i < times_arr.length;i++) {
    var time = times_arr[i];
    var datetime = new Date(time);
    // Checks if date if in future. If in past, skip iteration
    /*if (datetime < Date.now){
      continue
    }*/
    // Run 2 minutes later than specified
    var minutes = datetime.getMinutes()+2;
    var hours = datetime.getHours();
    var date = datetime.getDate();
    var month = datetime.getMonth();
    agendaInstance.define('game start job '+time, (agendaInstance) => {
      console.info('game start cron job running')
      generateTwoHoursScoreCheckingCron(agendaInstance);
    })
    var job = agendaInstance.every(minutes+' '+hours+' '+date+' '+month+' *', 'game start job '+time)
    //jobs_arr.push(job)
  }
  /*
  for (var i = 0; i < jobs_arr.length;i++) {
    job = jobs_arr[i];
    job.start()
  }*/
}