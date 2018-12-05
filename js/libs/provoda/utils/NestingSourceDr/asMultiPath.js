define(function(require) {
'use strict';
var spv = require('spv')
var parse = require('./parse')
var toMultiPath = require('./toMultiPath')

return spv.memorize(function(string) {
  var nesting_source = parse(string)
  return toMultiPath(nesting_source)
})

});
