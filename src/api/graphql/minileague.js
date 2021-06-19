const { MinileagueTC, minileague } = require('../../models/minileague')
const { user } = require('../../models/user')

exports.MinileagueQuery = {
  minileagueById: MinileagueTC.getResolver('findById'),
  minileagueByIds: MinileagueTC.getResolver('findByIds'),
  minileagueOne: MinileagueTC.getResolver('findOne'),
  minileagueMany: MinileagueTC.getResolver('findMany').wrapResolve(next => async rp => {
    rp.projection.members = true
    const res = await next(rp)
    const leagues = []
    console.log(res)
    for (let i = 0; i < res.length; i++) {
      console.log(res[i].members)
      console.log(rp.context.id)
      if (res[i].members.includes(rp.context.id)) {
        leagues.push(res[i])
      }
    }
    return leagues
  })
}

exports.MinileagueMutation = {
  joinMinileague: {
    type: MinileagueTC,
    args: { leagueName: 'String!' },
    resolve: async (source, args, context, info) => {
      const res = await minileague.updateOne(
        { name: args.leagueName },
        { $addToSet: { members: context.id } }
      )
      if (res.n === 0) {
        throw new Error('Mini league not found')
      }
      if (res.nModified === 0) {
        throw new Error('You are already a member of this mini league')
      }
      const updated = await minileague.findOne({ name: args.leagueName })
      await user.updateOne(
        { _id: context.id },
        { $addToSet: { minileagues: updated._id } }
      )
      return updated
    }
  },
  createMinileague: {
    type: MinileagueTC,
    args: { leagueName: 'String!' },
    resolve: async (source, args, context, info) => {
      let created
      try {
        created = await minileague.create(
          { name: args.leagueName, members: [context.id] }
        )
      } catch (err) {
        throw new Error('Mini league already exists')
      }
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
