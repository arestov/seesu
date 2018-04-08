define(function (require) {
'use strict';
var mark = require('./mark');
var spv = require('spv');
var BrowseLevel = require('../bwlev/BrowseLevel');

BrowseLevel.prototype.BWL = BrowseLevel;

return function prepare(root) {
  var augmented = spv.inh(root, {}, {});
  return mark(augmented, augmented);
};

});
