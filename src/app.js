require('monitor').start();

const env = require('dotenv').config()['parsed'] || process.env;

const Sentry = require('@sentry/node');
const environment = process.env.NODE_ENV || 'development';
const Tracing = require("@sentry/tracing");
const express = require('express')()

Sentry.init({
  dsn: 'https://4fc238857c344c5f90ecc4b3ebcce7d6@o342120.ingest.sentry.io/5264910',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Mongo(),
    new Tracing.Integrations.Express({express})
  ], 
  tracesSampleRate: 1.0,
  environment: environment
});

const PORT = process.env.PORT || 5000
const ids = { 'sol': '598f8e9a-af62-48e9-ac88-ae641071794d', 'phil': 'b64cd765-6564-41b0-8cfd-4e5b4721505e', 'jonny': '75406c71-6aa2-4ac5-801f-e87bd267613c', 'sam': '22c1c71f-d18a-455f-ad07-4263dbf0cacc', 'jacob': 'fce60643-3310-4e18-9e19-e5bc647df7a9', 'lila': '06ea1097-369b-40e2-8cf8-159265dfa708'}
exports.ids = ids;
const https = require('https');
const Twit = require('twit');

// Use imported app
express.use(Sentry.Handlers.tracingHandler());

require('./loaders').expressApp({ expressApp: express })

var T = new Twit({
  consumer_key:         'S5Kfhe84lyy5anAwIfipS5rzR',
  consumer_secret:      env['TWIT_CONSUMER_SECRET'],
  access_token:         '770278396005867521-L1NBvOb3mNYlXp87iQ6yd3aphk1Nz2T',
  access_token_secret:  env['TWIT_ACCESS_TOKEN_SECRET'],
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

express.listen(PORT, () => console.log(`Listening on ${ PORT }`))

// MongoDB connection URIs
const uri = 'mongodb://127.0.0.1:27017/simple-predictions-api'
//const uri = 'mongodb+srv://compass:solaustin@simple-predictions-api-gpv4x.gcp.mongodb.net/simple-predictions-api?retryWrites=true&w=majority'

// LogDNA Bunyan connection
var bunyan = require('bunyan');
let LogDNAStream = require('logdna-bunyan').BunyanStream;

let logDNA = new LogDNAStream({
  key: env['LOG_DNA_KEY']
});

var logger = bunyan.createLogger({
  name: 'simple-predictions-api-nodejs',
  streams: [
    { stream: process.stdout },
    { stream: logDNA,
      type: 'raw'
    }
  ]
});

logger.info('Hello world!')