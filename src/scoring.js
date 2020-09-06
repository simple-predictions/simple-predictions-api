const app = require('./app.js')

exports.scoreGames = function(){
    console.info('score games called')
    return new Promise(async function (resolve, reject){
    const ids_arr = Object.entries(app.ids)
    var games;
    await new Promise((resolve, reject) => app.table.find().toArray((err, result) => {
        if (err) throw err;
        games = result;
        resolve();
    }))
    if (!games) {
        throw ('Error: Games array empty. Database is empty!')
    }
    // Loop through array of games
    for (var i = 0;i < games.length;i++) {
        var game = games[i];
        var home_team = game['home_team']
        var away_team = game['away_team']
        var game_id = game['id']
        var new_data = {'$set': {}}
        for (var x = 0;x < ids_arr.length;x++){
            var id = ids_arr[x];
            var name = id[0];
            var pred_home = game[name+'_home_prediction'];
            var pred_away = game[name+'_away_prediction'];
            var live_home = game['live_home_score'];
            var live_away = game['live_away_score'];
            var banker_mult = game['banker_multiplier'];
            var banker = game[name+'_banker'];
            var insurance = game[name+'_insurance']
            var points = calculateScores(pred_home, pred_away, live_home, live_away, banker_mult, banker, insurance);
            new_data['$set'][name+'_points'] = points;
        }
        await new Promise((resolve, reject) => {app.table.updateOne({home_team: home_team, away_team: away_team, id: game_id}, new_data, function(err, result){
            if (err) throw err;
            resolve();
        })});
    }
    resolve()
    })
}

function calculateScores(pred_home, pred_away, live_home, live_away, banker_mult, banker, insurance){
    var points;
    // Check if predictions present
    if (typeof pred_home == 'undefined' || typeof pred_away == 'undefined'){
        points = 0;
    } else {
        // Check if exactly correct
        if (pred_home == live_home && pred_away == live_away) {
            points = 30;
        } else {
            // Check if draw
            if (pred_home == pred_away && live_home == live_away) {
                points = 20;
            } else{
                // Check if correct goal difference
                if ((pred_home - live_home) == (pred_away - live_away)) {
                    points = 15;
                } else {
                    // Check if result correct
                    if (((pred_home > pred_away) && (live_home > live_away)) || (pred_home < pred_away) && (live_home < live_away)) {
                        points = 10;
                    } else {
                        points = -10;
                    }
                }
            }
        }
    }

    // Now apply banker and insurance chips
    if ((points < 0)&&(insurance)) {
        points = 0;
    }
    if (banker) {
        points = points*banker_mult;
    }
    return points;
}

exports.updateMiniLeague  = async function(){
    var bearer = await app.new_bearer();
    var current_gameweek = await app.getTalkSportWeekNum();
    var options = {
        hostname: 'iknowthescore.co.uk',
        post: 443,
        path: '/engage/resources/mini-leagues/main-table/d29f61c8-0478-4bcb-9d78-4615e2bcfe01?page[number]=0&page[size]=20&page[number]=0&page[size]=20&page[totals]=false',
        method: 'GET',
        headers: {
          'Authorization': bearer
        }
    }
    app.https.get(options, (res) => {
        data = '';
        res.on('data', (d) => {
            data += d;
        })
        res.on('end', () => {
            json = JSON.parse(data);
            addMiniLeagueDataToDB(json, current_gameweek);
        })
    })
}

async function addMiniLeagueDataToDB(json, current_gameweek){
    const minileague_table = app.minileague_table;
    data = json['data'];
    for (var i = 0;i < data.length; i++) {
        var player = data[i];
        var attributes = player['attributes'];
        var talkSport_position = attributes['position']
        var talkSport_points = attributes['points'];
        var name = attributes['username'];
        if (attributes['gameWeekNumber'] == current_gameweek) {
            // Maths needed to calculate points total from previous gameweek
            var pointsChange = attributes['pointsChange'];
            var positionChange = attributes['positionChange'];
            var actual_points = talkSport_points - pointsChange;
            var actual_position = talkSport_position - positionChange;
        } else {
            var actual_points = talkSport_points;
            var actual_position = talkSport_position;
        }
        await new Promise((resolve, reject) => {minileague_table.updateOne({name: name},{ $set: { name: name, position: actual_position, points: actual_points }}, function(err, result) {
            if (err) throw err;
            resolve()
        })})
    }
}