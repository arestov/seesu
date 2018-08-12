define(function(require) {
'use strict';
var spv = require('spv')
// var NestingSourceDr = require('../../utils/NestingSourceDr');
var NestWatch = require('../../nest-watch/NestWatch');
var utils = require('../../utils/index.js');
var getParsedState = utils.getParsedState
var handler = require('./handler')

var getDeps = spv.memorize(function getEncodedState(state_name) {
  var result = getParsedState(state_name)

  if (!result) {
    return null
  }

  if (result.rel_type !== 'nesting') {
    return result
  }

  debugger

  // var doubleHandler = getStateWriter(result.full_name, result.state_name, result.zip_name);
  var nwatch = new NestWatch(result.nesting_source, result.state_name, {
    onchd_state: handler,
    onchd_count: handler,
  })

  var copy = spv.cloneObj({}, result);
  copy.nwatch = nwatch

  return copy
});

var makeGroups = utils.groupDeps(getDeps, function(cur) {
  debugger
  return cur;
})


// getParsedState: getParsedState,

var NestCompxDcl = function(name, data) {
  this.dest_name = name;

  var deps = data[1];
  var fn = data[2]

  this.nwbases = new Array(deps.length);

  var result = makeGroups([deps]);
  //
  // var compx_nest_matches = new Array(result.conndst_nesting.length)
  // for (var i = 0; i < result.conndst_nesting.length; i++) {
  //   compx_nest_matches[i] = result.conndst_nesting[i].nwatch;
  // }

  // this.compx_nest_matches = compx_nest_matches;
  this.conndst_parent = result.conndst_parent
  this.conndst_nesting = result.conndst_nesting
  this.conndst_root = result.conndst_root;


  // for (var i = 0; i < data.length; i++) {
  //   this.nwbases[i] = new NestWatch(new NestingSourceDr(data[i]), null, {
  //     onchd_count: handleChdCount,
  //   });
  // }
}

return NestCompxDcl;
});
