define(function (require) {
'use strict';
var spv = require('spv');
var nil = spv.nil;

var getParentBwlevView = require('./getParentBwlevView');
var watcherKey = require('./watcherKey');

var probeCheckChildren = require('./check-change').probeCheckChildren;

return function (self) {
  if (nil(self._probe)) {
    return;
  }

  var bwlev_view = getParentBwlevView(self);
  if (nil(bwlev_view)) {
    throw new Error('cant find bwlev_view');
  }

  bwlev_view.probe_watchers = bwlev_view.probe_watchers || spv.set.create();

  for (var key in self._probe) {
    var cur = self._probe[key];

    var item = {
      dcl: cur,
      view: self,
    };
    spv.set.add(bwlev_view.probe_watchers, watcherKey(cur, self), item);

    probeCheckChildren(bwlev_view, item);
  }
};
});
