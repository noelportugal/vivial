# vivial
A (un-official) Vivial Connect NodeJs Package

# Install
npm install --save vivial

# Usage
const Vivial = require('vivial')

const credentials = {
  apiKey: '[API_KEY]',
  apiSecret: '[API_SECRET]',
  accountId: '[ACCOUNT_ID]'
}
var vivial = new Vivial(credentials)

var requestBody = {
  'message': {
    'body': 'Hello from Vivial Connect NodeJs',
    'from_number': '+19999999999',
    // 'media_urls': ['https://cdn.meme.am/cache/instances/folder60/500x/75963060.jpg'], // uncomment to send MMS
    'to_number': '+19999999999'
  }
}

vivial.sendSms(requestBody).then(function (data) {
  console.log(data)
})

# Lookup
vivial.lookup('+19999999999').then(function (data) {
  console.log(data)
})
