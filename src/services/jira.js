const https = require('https')
const env = require('dotenv').config().parsed || process.env

exports.createJiraIssue = data => {
  const stringed = JSON.stringify(data)
  const options = {
    host: 'simple-predictions.atlassian.net',
    path: '/rest/api/3/issue',
    method: 'POST',
    port: 443,
    headers: { 'Content-Length': stringed.length, 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from('solomonabrahams100@gmail.com:' + env.JIRA_API_TOKEN).toString('base64') }
  }
  console.log(options)
  const req = https.request(options, resp => {
    console.log(resp.statusCode)
    let data = ''

    resp.on('data', c => {
      data += c
    })

    resp.on('end', () => {
      console.log(data)
    })

    resp.on('error', e => {
      console.log(new Error(e))
    })
  })
  console.log(stringed)
  req.write(stringed)
  req.end()
}
