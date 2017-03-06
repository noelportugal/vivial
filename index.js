'use strict'

const request = require('request')
const moment = require('moment')
const CryptoJS = require('crypto-js')

class Vivial {
  /**
   * @param {object} params
   * @constructor
   */
  constructor (params) {
    this.apiKey = params.apiKey
    this.apiSecret = params.apiSecret
    this.accountId = params.accountId
    this.baseUrl = 'https://api.vivialconnect.net/api/v1.0'
  }

  /**
   * create HMAC signature
   * @returns {Promise}
   */
  createSignature (requestData) {
    return new Promise((resolve, reject) => {
      var now = moment.utc()
      var requestTimestamp = now.format('YYYYMMDD[T]HHmmss[Z]')
      var longDate = now.format('ddd, DD MMM YYYY HH:mm:ss [GMT]')
      var canonicalizedHeaders = 'accept:application/json' + '\n' +
                'content-type:application/json' + '\n' +
                'date:' + longDate + '\n' +
                'host:api.vivialconnect.net'
      var canonicalizedHeaderNames = 'accept;content-type;date;host'
      var canonicalizedQueryString = ''

      var urlPath = requestData.url.split('.net', 3)[1]
      var urlSplit = requestData.url.split('?', 3)

      if (urlSplit.length > 1) {
        canonicalizedQueryString = urlSplit[1]
        urlPath = urlPath.split('?' + canonicalizedQueryString, 2)[0]
      }

      var httpVerb = requestData.requestMethod
      var requestBody = ''
      if (httpVerb === 'POST' || httpVerb === 'PUT') {
        requestBody = JSON.stringify(requestData.body)
      }

      var requestBodySHA256 = CryptoJS.SHA256(requestBody)

      var canonicalRequest =
                httpVerb + '\n' +
                requestTimestamp + '\n' +
                urlPath + '\n' +
                canonicalizedQueryString + '\n' +
                canonicalizedHeaders + '\n' +
                canonicalizedHeaderNames + '\n' +
                requestBodySHA256

      var signature = CryptoJS.HmacSHA256(canonicalRequest, this.apiSecret)
      var signatureData = {
        requestTimestamp: requestTimestamp,
        longDate: longDate,
        signature: signature
      }
      requestData.signatureData = signatureData
      resolve(signatureData)
    })
  }

  /**
   * httpRequest
   * @returns {Promise}
   */
  httpRequest (requestData) {
    return new Promise((resolve, reject) => {
      var options = {
        url: requestData.url,
        method: requestData.requestMethod,
        headers: {
          'Accept': 'application/json',
          'Date': requestData.signatureData.longDate,
          'Host': 'api.vivialconnect.net',
          'Content-Type': 'application/json',
          'X-Auth-Date': requestData.signatureData.requestTimestamp,
          'X-Auth-SignedHeaders': 'accept;content-type;date;host',
          Authorization: 'HMAC ' + this.apiKey + ':' + requestData.signatureData.signature
        },
        body: JSON.stringify(requestData.body)
      }

      request(options, function (error, response, body) {
        if (error) reject(error)
        resolve(body)
      })
    })
  }

  /**
   * send Sms and MMS if media_urls
   * @returns {Promise}
   */
  sendSms (requestBody) {
    return new Promise((resolve, reject) => {
      var requestData = {}
      requestData.url = this.baseUrl + '/accounts/' + this.accountId + '/messages.json'
      requestData.requestMethod = 'POST'
      requestData.body = requestBody
      this.createSignature(requestData)
      .then(this.httpRequest(requestData).then(function (data) {
        resolve(data)
      }))
    })
  }

  /**
   * phone number lookup
   * @returns {Promise}
   */
  lookup (phoneNumber) {
    return new Promise((resolve, reject) => {
      var requestData = {}
      requestData.url = this.baseUrl + '/accounts/' + this.accountId + '/numbers/lookup.json?phone_number=' + encodeURIComponent(phoneNumber)
      requestData.requestMethod = 'GET'
      this.createSignature(requestData)
      .then(this.httpRequest(requestData).then(function (data) {
        resolve(data)
      }))
    })
  }
}

module.exports = Vivial
