const { UserTC } = require('../../models/user.js')

const cleanUserObject = (user, rp) => {
  if (rp.context.username !== user.username) {
    user.email = undefined
  }
  return user
}

const userFindOneWrap = async (next, rp) => {
  const res = await next(rp)

  const user = cleanUserObject(res, rp)
  return user
}

const userFindManyWrap = async (next, rp) => {
  const res = await next(rp)

  const users = []
  for (let i = 0; i < res.length; i++) {
    let user = res[i]
    user = cleanUserObject(user, rp)
    users.push(user)
  }
  return users
}

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
