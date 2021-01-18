const { getGameweek } = require('./predictions')

const MiniLeague = require('../models/minileague').minileague
const Match = require('../models/user').match
const User = require('../models/user').user

exports.createMiniLeague = (username, leagueName) => {
  return new Promise((resolve, reject) => {
    User.find({ username: username }, function (err, res) {
      if (err) throw err
      const userID = res[0]._id
      MiniLeague.findOne({ name: leagueName }, function (err, existingLeague) {
        if (err) throw err
        if (existingLeague) {
          reject(new Error('A mini-league with this name already exists.'))
          // return
        } else {
          MiniLeague.create({ name: leagueName, members: [userID] }, function (err, res) {
            if (err) throw err
            resolve('Mini-league created')
          })
        }
      })
    })
  })
}

exports.joinMiniLeague = (username, leagueName) => {
  return new Promise((resolve, reject) => {
    User.find({ username: username }, function (err, res) {
      if (err) throw err
      const userID = res[0]._id
      MiniLeague.updateOne({ name: leagueName }, { $addToSet: { members: userID } }, function (err, res) {
        if (err) {
          throw err
        } else {
          if (res.n === 1) {
            if (res.nModified === 1) {
              resolve('Success')
            } else {
              reject(new Error('You are already a member of ' + leagueName))
            }
          } else {
            reject(new Error("Mini-league doesn't exist"))
          }
        }
      })
    })
  })
}

exports.miniLeaguePredictions = async (leagueID, username, gameweek) => {
  const defaultGameweek = await getGameweek()
  return await new Promise(resolve => {
    const currentGameweek = parseInt(gameweek) || defaultGameweek
    Match.find({ gameweek: currentGameweek }, null, { sort: { kick_off_time: 1 } }, function (err, matchRes) {
      if (err) throw err
      matchRes = matchRes.map(obj => {
        obj.predictions = []
        return obj.toObject()
      })
      const matchPredsObj = { matches: matchRes, members: [] }

      MiniLeague.find({ _id: leagueID }).populate({ path: 'members', populate: { path: 'predictions', populate: { path: 'match' } } }).exec(function (err, res) {
        if (err) throw err

        const members = res[0].members
        const myselfIdx = members.findIndex(member => member.username === username)
        const myself = members.splice(myselfIdx, 1)[0]
        members.splice(0, 0, myself)

        for (let i = 0; i < members.length; i++) {
          // Loop through members
          const member = members[i]
          let memberPredictions = member.predictions
          memberPredictions = memberPredictions.sort((a, b) => a.match.kick_off_time - b.match.kick_off_time)
          for (let x = 0; x < memberPredictions.length; x++) {
            // Loop through member's predictions
            // Every prediction has a match assosiated with it
            let prediction = memberPredictions[x]
            // .toObject() very important here because otherwise it references itself and creates an infinite loop
            const match = prediction.match.toObject()
            if (match.gameweek !== currentGameweek) {
              continue
            }

            const matchIndex = matchPredsObj.matches.findIndex(arrMatch => arrMatch._id.toString() === match._id.toString())
            prediction = prediction.toObject()
            prediction.username = member.username
            if (match.kick_off_time > Date.now() && prediction.username !== username) {
              delete prediction.home_pred
              delete prediction.away_pred
              prediction.error_message = 'Not kicked off'
            }
            matchPredsObj.matches[matchIndex].predictions.push(prediction)
          }
        }
        matchPredsObj.members = members
        resolve({ preds: matchPredsObj, gameweek: currentGameweek })
      })
    })
  })
}

exports.getMiniLeagues = async username => {
  const retObj = await new Promise(resolve => {
    User.findOne({ username: username }, function (err, res) {
      if (err) throw err
      const userID = res._id

      MiniLeague.find({ members: userID }, function (err, res) {
        if (err) throw err
      }).populate('members').exec(function (err, res) {
        if (err) throw err
        resolve(res)
      })
    })
  })

  for (let i = 0; i < retObj.length; i++) {
    retObj[i] = retObj[i].toObject()
    const id = retObj[i]._id
    const preds = await this.miniLeaguePredictions(id, username)
    const table = await this.miniLeagueTable(id)
    retObj[i].table = preds
    retObj[i].rankings = table
  }
  return retObj
}

exports.miniLeagueTable = async leagueID => {
  return await new Promise(resolve => {
    MiniLeague.findOne({ _id: leagueID }, function (err, res) {
      if (err) throw err
    }).populate({ path: 'members', populate: { path: 'predictions' } }).exec(function (err, res) {
      if (err) throw err
      const members = []
      for (let i = 0; i < res.members.length; i++) {
        const memberPredictions = res.members[i].predictions
        const memberPoints = memberPredictions.reduce(function (prev, cur) {
          return prev + cur.points
        }, 0)
        members.push({ username: res.members[i].username, points: memberPoints })
      }
      members.sort((a, b) => b.points - a.points)
      resolve(members)
    })
  })
}
