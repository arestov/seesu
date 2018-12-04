define(function(require) {
'use strict';
var spv = require('spv')
// var NestingSourceDr = require('../../utils/NestingSourceDr');
var NestWatch = require('../../nest-watch/NestWatch');
var getParsedState = require('../../utils/getParsedState');
var groupDeps = require('../../utils/groupDeps')
var toMultiPath = require('../../utils/NestingSourceDr/toMultiPath')

var handler = require('./handler')
var hnest = handler.hnest

var getDeps = spv.memorize(function getEncodedState(state_name) {
  var result = getParsedState(state_name)

  if (!result) {
    return null
  }

  if (result.rel_type !== 'nesting') {
    return result
  }

  // var doubleHandler = getStateWriter(result.full_name, result.state_name, result.zip_name);
  var nwatch = new NestWatch(toMultiPath(result.nesting_source), result.state_name, {
    onchd_state: hnest,
    onchd_count: hnest,
  })

  var copy = spv.cloneObj({}, result);
  copy.nwatch = nwatch

  return copy
});

var makeGroups = groupDeps(getDeps, function(cur) {
  return cur;
})


// getParsedState: getParsedState,

var NestCompxDcl = function(name, data) {
  this.dest_name = name;

  var deps = data[1];
  var fn = data[2]

  this.deps = deps;

  var result = makeGroups([deps]);

  this.calcFn = fn;

  this.conndst_parent = result.conndst_parent
  this.conndst_nesting = result.conndst_nesting
  this.conndst_root = result.conndst_root;


}

return NestCompxDcl;
});
