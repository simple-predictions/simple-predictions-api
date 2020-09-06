express.get('/updatepredictions',(req,res) => {
  getTalkSportWeekNum().then((weeknum) => {
    updateFixturesAndPredictions(weeknum);
  });
  logger.info('Update predictions called')
  res.json();
})