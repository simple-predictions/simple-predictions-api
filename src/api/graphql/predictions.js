const Match = require('../../models/user').match
const { PredictionTC } = require('../../models/user.js')

const cleanPredictionObject = async (pred, rp) => {
  const kickOffTime = (await Match.findOne({ _id: pred.match })).toObject().kick_off_time

  if (pred.author !== rp.context.id && new Date(kickOffTime) > Date.now()) {
    pred.home_pred = undefined
    pred.away_pred = undefined
  }

  return pred
}

const predictionFindOneWrap = async (next, rp) => {
  rp.projection.author = true
  rp.projection.match = true
  const res = await next(rp)

  const pred = cleanPredictionObject(res, rp)

  return pred
}

const predictionFindManyWrap = async (next, rp) => {
  rp.projection.author = true
  rp.projection.match = true
  const res = await next(rp)
  const preds = []

  for (let i = 0; i < res.length; i++) {
    let pred = res[i]
    pred = cleanPredictionObject(pred, rp)
    preds.push(pred)
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
  })
}
