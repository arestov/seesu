define(function (require) {
'use strict';
var getBwlevView = require('../getBwlevView');
var watcherKey = require('./watcherKey');
var spv = require('spv');
var nil = spv.nil;

return function (self) {
  if (nil(self._probe)) {
    return;
  }

  var bwlev_view = getBwlevView(self);
  if (nil(bwlev_view)) {
    throw new Error('cant find bwlev_view');
  }

  for (var key in self._probe) {
    var cur = self._probe[key];
    spv.set.remove(bwlev_view.probe_watchers, watcherKey(cur, self));
  }
};
})
