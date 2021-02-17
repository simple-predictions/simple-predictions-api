const { UserTC, prediction } = require('../../models/user.js')

const modifyUserObject = (user, rp) => {
  if (rp.context.username !== user.username) {
    user.email = undefined
  }
  return user
}

const userFindOneWrap = async (next, rp) => {
  const res = await next(rp)

  const user = modifyUserObject(res, rp)
  return user
}

const userFindManyWrap = async (next, rp) => {
  const res = await next(rp)

  const users = []
  for (let i = 0; i < res.length; i++) {
    let user = res[i]
    user = modifyUserObject(user, rp)
    users.push(user)
  }
  return users
}

UserTC.addFields({
  totalPoints: {
    type: 'Int',
    description: 'All time user total points',
    resolve: async (source, args, context, info) => {
      const predIDs = source.predictions
      const preds = await prediction.find({ _id: { $in: predIDs } }).select('points -_id')
      const totalPoints = preds.reduce(function (prev, cur) {
        return prev + (cur.points || 0)
      }, 0)
      return totalPoints
    },
    projection: { predictions: true }
  }
})

exports.UserQuery = {
  userById: UserTC.getResolver('findById').wrapResolve(next => async rp => {
    return userFindOneWrap(next, rp)
  }),
  userByIds: UserTC.getResolver('findByIds').wrapResolve(next => async rp => {
    return userFindManyWrap(next, rp)
  }),
  userOne: UserTC.getResolver('findOne').wrapResolve(next => async rp => {
    return userFindOneWrap(next, rp)
  }),
  userMany: UserTC.getResolver('findMany').wrapResolve(next => async rp => {
    return userFindManyWrap(next, rp)
  })
}

exports.UserMutation = {
  userUpdateOne: UserTC.getResolver('updateOne').wrapResolve(next => rp => {
    if (rp.context.username !== rp.args.filter.username) {
      return null
    }
    return next(rp)
  })
}
