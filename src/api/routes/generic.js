express.get('/data',async (req,res) => {
    var json = await getData();
    logger.info('Get data path called')
    res.json(json)
  })
    
  express.get('/dropall', (req, res) => {
    console.info('drop all rows')
    table.deleteMany({}, {$multi: true})
    res.json()
  })