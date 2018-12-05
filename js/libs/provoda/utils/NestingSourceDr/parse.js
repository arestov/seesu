define(function (require) {
'use strict';
var spv = require('spv')
var memorize = spv.memorize
var splitByDot = spv.splitByDot

var NestingSourceDr = function (string) {
  var parts = string.split('>');
  this.start_point = parts.length > 1 && parts[0];
  this.selector = splitByDot(parts[parts.length - 1]);
};

return memorize(function parseNSD(string) {
  return new NestingSourceDr(string);
})

});
