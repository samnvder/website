'use strict';

function detectEol(text) {
  return String(text).includes('\r\n') ? '\r\n' : '\n';
}

function toLf(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function withEol(text, eol) {
  const lf = toLf(text);
  return eol === '\r\n' ? lf.replace(/\n/g, '\r\n') : lf;
}

function matchEol(text, sample) {
  return withEol(text, detectEol(sample));
}

module.exports = { detectEol, toLf, withEol, matchEol };
