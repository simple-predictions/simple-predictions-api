const { MatchTC, PredictionTC, UserTC } = require('../../models/user.js')
const { PredictionQuery } = require('./predictions')
const { UserQuery, UserMutation } = require('./user')
const { MatchQuery } = require('./match')
const { MinileagueQuery } = require('./minileague')
const { SchemaComposer } = require('graphql-compose')
const { MinileagueTC } = require('../../models/minileague.js')

const schemaComposer = new SchemaComposer()

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

MinileagueTC.addRelation(
  'members',
  {
    resolver: UserQuery.userByIds,
    prepareArgs: {
      _ids: source => source.members || []
    },
    projection: { members: true }
  }
)

schemaComposer.Query.addFields({
  ...MatchQuery,
  ...PredictionQuery,
  ...UserQuery,
  ...MinileagueQuery
})

schemaComposer.Mutation.addFields({
  ...UserMutation
})

// Put together a schema
const schema = schemaComposer.buildSchema()

module.exports = schema
