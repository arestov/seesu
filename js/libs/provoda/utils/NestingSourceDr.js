define(function (spv) {
'use strict';
var splitByDot = require('spv').splitByDot

var NestingSourceDr = function (string) {
  var parts = string.split('>');
  this.start_point = parts.length > 1 && parts[0];
  this.selector = splitByDot(parts[parts.length - 1]);
};
return NestingSourceDr;
});
