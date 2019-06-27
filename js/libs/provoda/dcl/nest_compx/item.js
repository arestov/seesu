define(function(require) {
'use strict';
var spv = require('spv')
var NestWatch = require('../../nest-watch/NestWatch');
var parseMultiPath = require('../../utils/multiPath/parse')
var asString = require('../../utils/multiPath/asString')

var handler = require('./handler')
var hnest = handler.hnest

var getDeps = spv.memorize(function getEncodedState(string) {

  var result = parseMultiPath(string)

  if (!result) {
    throw new Error('cant parse: ' + string)
    return null
  }

  if (result.base_itself) {
    return result
  }

  if (result.result_type !== 'nesting' && result.result_type !== 'state') {
    throw new Error('implement runner part')
  }

  if (!result.nesting || !result.nesting.path) {
    return result;
  }

  var state_name = result.state && result.state.path

  var nwatch = new NestWatch(result, state_name, {
    onchd_state: hnest,
    onchd_count: hnest,
  })

  var copy = spv.cloneObj({}, result);
  copy.nwatch = nwatch

  return copy
});

var groupBySubscribing = function(list) {
  var result = {
    nest_watch: [],
    usual: [],
    self: false,
  }

  for (var i = 0; i < list.length; i++) {
    var cur = list[i]
    if (cur.base_itself) {
      result.self = true
    } else if (cur.nwatch) {
      result.nest_watch.push(cur);
    } else {
      result.usual.push(cur);
    }
  }

  return result
}

var same = function(item) {
  return item;
}

var NestCompxDcl = function(name, data) {
  this.dest_name = name;

  var deps = data[1];
  var fn = data[2]

  var list = deps.map(getDeps)

  this.deps = list.map(asString);

  this.calcFn = fn || same;

  // will be used by runner
  this.parsed_deps = groupBySubscribing(list)

}

return NestCompxDcl;
});
