define(function(require) {
'use strict';
var spv = require('spv');
var NestWatch = require('../nest-watch/NestWatch');
var getStateWriter = require('../nest-watch/getStateWriter');
var getParsedState = require('./getParsedState')
var toMultiPath = require('./NestingSourceDr/toMultiPath')

var getEncodedState = spv.memorize(function getEncodedState(state_name) {
  var result = getParsedState(state_name)

  if (!result) {
    return null
  }

  if (result.rel_type !== 'nesting') {
    return result
  }

  var doubleHandler = getStateWriter(result.full_name, result.state_name, result.zip_name);
  var nwatch = new NestWatch(toMultiPath(result.nesting_source), result.state_name, {
    onchd_state: doubleHandler,
    onchd_count: doubleHandler,
  })

  var copy = spv.cloneObj({}, result);
  copy.nwatch = nwatch

  return copy
});

return getEncodedState
})
