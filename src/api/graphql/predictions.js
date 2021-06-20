const { PredictionTC } = require('../../models/user.js')
const { prediction, match, user } = require('../../models/user')
const { getGameweek } = require('../../services/predictions')

const cleanPredictionObject = async (pred, rp) => {
  const { kick_off_time: kickOffTime } = (await match.findOne({ _id: pred.match })).toObject()

  if (pred.author.toString() !== rp.context.id && new Date(kickOffTime) > Date.now()) {
    pred.home_pred = undefined
    pred.away_pred = undefined
  }

  return pred
}

const predictionFindOneWrap = async (next, rp) => {
  rp.projection.author = true
  rp.projection.match = true
  const res = await next(rp)

  const pred = await cleanPredictionObject(res, rp)

  return pred
}

const predictionFindManyWrap = async (next, rp) => {
  rp.projection = rp.projection || {}
  rp.projection.author = true
  rp.projection.match = true
  const res = await next(rp)
  const preds = []

  if (rp.args.gameweek === 0) {
    rp.args.gameweek = await getGameweek()
  }

  for (let i = 0; i < res.length; i++) {
    let pred = res[i]
    pred = await cleanPredictionObject(pred, rp)
    if (pred && (pred.home_pred || pred.home_pred === 0)) {
      preds.push(pred)
    }
  }
  return preds
}

exports.PredictionQuery = {
  predictionById: PredictionTC.getResolver('findById').wrapResolve(next => rp => {
    return predictionFindOneWrap(next, rp)
  }),
  predictionByIds: PredictionTC.getResolver('findByIds').wrapResolve(next => rp => {
    return predictionFindManyWrap(next, rp)
  }),
  predictionOne: PredictionTC.getResolver('findOne').wrapResolve(next => rp => {
    return predictionFindOneWrap(next, rp)
  }),
  predictionMany: PredictionTC.getResolver('findMany').wrapResolve(next => rp => {
    return predictionFindManyWrap(next, rp)
  }),
  predictionDataLoader: PredictionTC.getResolver('dataLoaderMany').wrapResolve(next => rp => {
    return predictionFindManyWrap(next, rp)
  })
}

exports.PredictionMutation = {
  updatePrediction: {
    type: PredictionTC,
    args: { matchID: 'String!', home_pred: 'Int!', away_pred: 'Int!', banker: 'Boolean', insurance: 'Boolean' },
    resolve: async (source, args, context, info) => {
      // eslint-disable-next-line camelcase
      const { kick_off_time, gameweek } = (await match.findOne({ _id: args.matchID }).select('kick_off_time gameweek -_id'))
      if (new Date(kick_off_time) < Date.now()) {
        return
      }

      const matches = await match.find({ gameweek }).populate({ path: 'predictions', match: { $and: [{ author: context.id }, { $or: [{ banker: true }, { insurance: true }] }] } }).exec()
      const bankers = matches.some(match => match.predictions[0]?.banker && match._id.toString() !== args.matchID)
      const insurances = matches.some(match => match.predictions[0]?.insurance && match._id.toString() !== args.matchID)
      args.banker = bankers ? false : args.banker
      args.insurance = insurances ? false : args.insurance
      if (args.banker && args.insurance) {
        args.banker = false
        args.insurance = false
      }

      const updated = await prediction.findOneAndUpdate(
        { match: args.matchID, author: context.id },
        { home_pred: args.home_pred, away_pred: args.away_pred, banker: args.banker, insurance: args.insurance },
        { upsert: true, new: true }
      )

      await match.updateOne({ _id: args.matchID }, { $addToSet: { predictions: updated._id } })
      await user.updateOne({ _id: context.id }, { $addToSet: { predictions: updated._id } })

      return updated
    }
  }
}
