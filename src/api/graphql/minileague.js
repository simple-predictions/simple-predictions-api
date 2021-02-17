const { MinileagueTC } = require('../../models/minileague')

exports.MinileagueQuery = {
  minileagueById: MinileagueTC.getResolver('findById'),
  minileagueByIds: MinileagueTC.getResolver('findByIds'),
  minileagueOne: MinileagueTC.getResolver('findOne'),
  minileagueMany: MinileagueTC.getResolver('findMany')
}
