define(function () {
'use strict';

var NestingSourceDr = function (string) {
  var parts = string.split('>');
  this.start_point = parts.length > 1 && parts[0];
  this.selector = parts[parts.length - 1].split('.');
};
return NestingSourceDr;
});
