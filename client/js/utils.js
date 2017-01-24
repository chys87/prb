'use strict';

const htmlEncode = exports.htmlEncode = require('lodash/escape');

const hE = exports.hE = function hE(strings, ...values) {
  const n = strings.length;
  let r = '';
  for (let i = 0; i < n; ++i) {
    r += strings[i];
    if (values[i])
      r += htmlEncode(values[i]);
  }
  return r;
}
