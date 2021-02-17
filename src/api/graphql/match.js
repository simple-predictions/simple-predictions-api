const { MatchTC } = require('../../models/user.js')

exports.MatchQuery = {
  matchById: MatchTC.getResolver('findById'),
  matchByIds: MatchTC.getResolver('findByIds'),
  matchOne: MatchTC.getResolver('findOne'),
  matchMany: MatchTC.getResolver('findMany')
}
