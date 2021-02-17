const { MatchTC, PredictionTC, UserTC } = require('../models/user.js')
const { SchemaComposer } = require('graphql-compose')
const Match = require('../models/user').match

const schemaComposer = new SchemaComposer()

const MatchQuery = {
  matchById: MatchTC.getResolver('findById'),
  matchByIds: MatchTC.getResolver('findByIds'),
  matchOne: MatchTC.getResolver('findOne'),
  matchMany: MatchTC.getResolver('findMany')
}

const PredictionQuery = {
  predictionById: PredictionTC.getResolver('findById'),
  predictionByIds: PredictionTC.getResolver('findByIds').wrapResolve(next => async rp => {
    rp.projection.author = true
    rp.projection.match = true
    const res = await next(rp)

    for (let i = 0; i < res.length; i++) {
      const pred = res[i]
      const kickOffTime = (await Match.findOne({ _id: pred.match })).toObject().kick_off_time
      if (pred.author !== rp.context.id && new Date(kickOffTime) > Date.now()) {
        res[i].home_pred = undefined
        res[i].away_pred = undefined
      }
    }

    return res
  }),
  predictionOne: PredictionTC.getResolver('findOne'),
  predictionMany: PredictionTC.getResolver('findMany').wrapResolve(next => async rp => {
    rp.projection.author = true
    rp.projection.match = true
    const res = await next(rp)

    for (let i = 0; i < res.length; i++) {
      const pred = res[i]
      const kickOffTime = (await Match.findOne({ _id: pred.match })).toObject().kick_off_time
      if (pred.author !== rp.context.id && new Date(kickOffTime) > Date.now()) {
        res[i].home_pred = undefined
        res[i].away_pred = undefined
      }
    }

    return res
  }),
}

const cleanUserObject = (user, rp) => {
  if (rp.context.username !== user.username) {
    user.email = undefined
  }
  return user
}

const UserQuery = {
  userById: UserTC.getResolver('findById').wrapResolve(next => async rp => {
    const res = await next(rp)

    let user = res
    user = cleanUserObject(res, rp)
    return user
  }),
  userByIds: UserTC.getResolver('findByIds').wrapResolve(next => async rp => {
    const res = await next(rp)

    const users = []
    for (let i = 0; i < res.length; i++) {
      let user = res[i]
      user = cleanUserObject(user, rp)
      users.push(user)
    }
    return users
  }),
  userOne: UserTC.getResolver('findOne').wrapResolve(next => async rp => {
    const res = await next(rp)

    let user = res
    user = cleanUserObject(res, rp)
    return user
  }),
  userMany: UserTC.getResolver('findMany').wrapResolve(next => async rp => {
    const res = await next(rp)

    const users = []
    for (let i = 0; i < res.length; i++) {
      let user = res[i]
      user = cleanUserObject(user, rp)
      users.push(user)
    }
    return users
  })
}

const UserMutation = {
  userUpdateOne: UserTC.getResolver('updateOne').wrapResolve(next => rp => {
    if (rp.context.username !== rp.args.filter.username) {
      return null
    }
    return next(rp)
  })
}

MatchTC.addRelation(
  'predictions',
  {
    resolver: PredictionQuery.predictionByIds,
    prepareArgs: {
      _ids: source => source.predictions || []
    },
    projection: { predictions: true }
  }
)

PredictionTC.addRelation(
  'author',
  {
    resolver: UserQuery.userById,
    prepareArgs: {
      _id: source => source.author
    },
    projection: { author: true }
  }
)

UserTC.addRelation(
  'friends',
  {
    resolver: UserQuery.userByIds,
    prepareArgs: {
      _ids: source => source.friends || []
    },
    projection: { friends: true }
  }
)

UserTC.addRelation(
  'predictions',
  {
    resolver: PredictionQuery.predictionByIds,
    prepareArgs: {
      _ids: source => source.predictions || []
    },
    projection: { predictions: true }
  }
)

PredictionTC.addRelation(
  'match',
  {
    resolver: MatchQuery.matchById,
    prepareArgs: {
      _id: source => source.match || []
    },
    projection: { match: true }
  }
)

schemaComposer.Query.addFields({
  ...MatchQuery,
  ...PredictionQuery,
  ...UserQuery
})

schemaComposer.Mutation.addFields({
  ...UserMutation
})

// Put together a schema
const schema = schemaComposer.buildSchema()

module.exports = schema
