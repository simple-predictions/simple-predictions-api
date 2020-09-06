const env = require('dotenv').config()['parsed'] || process.env;
const https = require('https');

exports.new_bearer = function(){
    return new Promise((resolve, reject) => {
      setTimeout(() => {
      // const url = URI.parse('https://iknowthescore.co.uk/engage/resources/players/auth')
      const hostname = 'iknowthescore.co.uk';
      const path = '/engage/resources/players/auth';
      
      const postData = '{"data":{"type":"credentials","attributes":{"username":"solomonabrahams@outlook.com","password":"'+env['IKTS_PASSWORD']+'"}}}'
      const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        }
      }
  
      var req = https.request(options, (res) => {
        var data = '';
        res.on('data', (d) => {
          data += d
        })
        res.on('end', () => {
          var json = JSON.parse(data);
          var bearer = 'Bearer '+json['data']['id']
          console.info('bearer token generated')
          console.info('bearer token is: '+bearer)
          resolve(bearer)
        })
      })
  
      req.write(postData);
      req.end();
      }, 1*1000)
    })
  }