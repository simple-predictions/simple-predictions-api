const { MinileagueTC, minileague } = require('../../models/minileague')
const { user } = require('../../models/user')

exports.MinileagueQuery = {
  minileagueById: MinileagueTC.getResolver('findById'),
  minileagueByIds: MinileagueTC.getResolver('findByIds'),
  minileagueOne: MinileagueTC.getResolver('findOne'),
  minileagueMany: MinileagueTC.getResolver('findMany')
}

exports.MinileagueMutation = {
  joinMinileague: {
    type: MinileagueTC,
    args: { leagueID: 'String!' },
    resolve: async (source, args, context, info) => {
      const updated = await minileague.update(
        { _id: args.leagueID },
        { $addToSet: { members: context.id } }
      )
      if (updated) {
        await user.updateOne(
          { _id: context.id },
          { $addToSet: { minileagues: updated._id } }
        )
      } else {
        throw new Error('Mini league with ID ' + args.leagueID + ' not updated with value ' + args.valueToPush)
      }
      return updated
    }
  },
  createMinileague: {
    type: MinileagueTC,
    args: { leagueName: 'String!' },
    resolve: async (source, args, context, info) => {
      const created = await minileague.create(
        { name: args.leagueName, members: [context.id] }
      )
      if (created) {
        await user.updateOne(
          { _id: context.id },
          { $addToSet: { minileagues: created._id } }
        )
      } else {
        throw new Error('Mini league not created')
      }
      return created
    }
  }
}
