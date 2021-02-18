const { MatchTC } = require('../../models/user.js')

const sortMatches = matches => {
  return matches.sort((a, b) => new Date(a.kick_off_time) - new Date(b.kick_off_time))
}

exports.MatchQuery = {
  matchById: MatchTC.getResolver('findById'),
  matchByIds: MatchTC.getResolver('findByIds').wrapResolve(next => async rp => {
    rp.projection.kick_off_time = true
    const res = await next(rp)
    return sortMatches(res)
  }),
  matchOne: MatchTC.getResolver('findOne'),
  matchMany: MatchTC.getResolver('findMany').wrapResolve(next => async rp => {
    rp.projection.kick_off_time = true
    const res = await next(rp)
    return sortMatches(res)
  })
}
