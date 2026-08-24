'use strict';

const { markerStart, markerEnd } = require('./paths');
const { toLf } = require('./eol');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headlineHtml(text) {
  return escapeHtml(text || '').replace(/\n/g, '<br>');
}

function stripTags(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceMarkedBlock(source, name, inner) {
  const start = markerStart(name);
  const end = markerEnd(name);
  const src = toLf(source);
  const i = src.indexOf(start);
  const j = src.indexOf(end);
  if (i < 0 || j < 0 || j < i) {
    throw new Error(`Campaign marker "${name}" missing or inverted.`);
  }
  const before = src.slice(0, i + start.length);
  const after = src.slice(j);
  const body = toLf(inner).replace(/^\n/, '').replace(/\n$/, '');
  return `${before}\n${body}\n${after}`;
}

function readMarkedBlock(source, name) {
  const start = markerStart(name);
  const end = markerEnd(name);
  const src = toLf(source);
  const i = src.indexOf(start);
  const j = src.indexOf(end);
  if (i < 0 || j < 0 || j < i) return null;
  return src.slice(i + start.length, j).replace(/^\n/, '').replace(/\n$/, '');
}

function hasAllMarkers(source, names) {
  return names.every((n) => source.includes(markerStart(n)) && source.includes(markerEnd(n)));
}

module.exports = {
  escapeHtml,
  headlineHtml,
  stripTags,
  replaceMarkedBlock,
  readMarkedBlock,
  hasAllMarkers,
};
