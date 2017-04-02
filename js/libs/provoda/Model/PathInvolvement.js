define(function (require) {
'use strict';
var spv = require('spv');
var cache_by_ids = {};
var count = 1;
var zeroPath = 0;
cache_by_ids[zeroPath] = [];

function PathInvolvement(key, owner, md, pos) {
  this.owner = owner;
  this.md = md;
  this.pos = pos;
  this.key = key;
  this.id = getPathpId(md, key);
  this.path = getPathById(key);
}

function getPathpId(md, key) {
  return md._provoda_id + ':' + key;
}

function getPathById(path_id) {
  return cache_by_ids.hasOwnProperty(path_id) ? cache_by_ids[path_id] : null;
}

var getPathIdByNestingName = spv.memorize(function(nesting_name) {
  var result = [nesting_name];
  var path_id = ++count;
  cache_by_ids[path_id] = result;
  return path_id;
});

var getPathIdByPathIdAndPrefix = spv.memorize(function(nesting_name, base_path_id) {
  var base = getPathById(base_path_id);
  var copied = base.slice();
  copied.unshift(nesting_name);

  var path_id = ++count;
  cache_by_ids[path_id] = copied;

  return path_id;
}, function (nesting_name, base_path_id) {
  return nesting_name + '-' + base_path_id;
});

PathInvolvement.getPathpId = getPathpId;
PathInvolvement.getPathById = getPathById;
PathInvolvement.getPathIdByNestingName = getPathIdByNestingName;
PathInvolvement.getPathIdByPathIdAndPrefix = getPathIdByPathIdAndPrefix;
PathInvolvement.zeroPath = zeroPath;

return PathInvolvement;
});
