const { MatchTC } = require('../../models/user.js')
const { getGameweek } = require('../../services/predictions')

const prepareMatchesQuery = async rp => {
  rp.projection.kick_off_time = true

  if (rp.args.filter.gameweek === 0) {
    rp.args.filter.gameweek = await getGameweek()
  }

  return rp
}

const sortMatches = matches => {
  return matches.sort((a, b) => new Date(a.kick_off_time) - new Date(b.kick_off_time))
}

exports.MatchQuery = {
  matchById: MatchTC.getResolver('findById'),
  matchByIds: MatchTC.getResolver('findByIds').wrapResolve(next => async rp => {
    rp = await prepareMatchesQuery(rp)
    const res = await next(rp)
    return sortMatches(res)
  }),
  matchOne: MatchTC.getResolver('findOne'),
  matchMany: MatchTC.getResolver('findMany').wrapResolve(next => async rp => {
    rp = await prepareMatchesQuery(rp)
    const res = await next(rp)
    return sortMatches(res)
  })
}
