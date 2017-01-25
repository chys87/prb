'use strict';

const HmacSHA512 = require('crypto-js/hmac-sha512')

const gen_auth_data = exports.gen_auth_data = function(pass) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = '' + Math.random() * 1e17 + Math.random() * 1e17;
  return `${timestamp}-${nonce}-${HmacSHA512(timestamp + nonce, pass).toString()}`;
}
