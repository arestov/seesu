define(function (require) {
'use strict';
var _goDeeper = require('./_goDeeper');
var getModelById = require('../utils/getModelById');
var changeBridge = require('./changeBridge');
// var showMOnMap = require('./showMOnMap');

return function requestPage(BWL, self, id) {
  var md = getModelById(self, id);
  var pioneer = self.getNesting('pioneer');

  var target_is_deep_child;

  var cur = md;
  var bwlev_children = [];

  while (cur.map_parent) {
    bwlev_children.push(cur);

    if (cur.map_parent == pioneer) {
      target_is_deep_child = true;
      break;
    }
    cur = cur.map_parent;
  }

  if (!target_is_deep_child) {
    return md.requestPage();
  }

  bwlev_children = bwlev_children.reverse();

  var map = md.app.map;

  // !!!!showMOnMap(BWL, map, pioneer, self);

  var last_called = null;
  var parent_bwlev = self;
  for (var i = 0; i < bwlev_children.length; i++) {
    if (!parent_bwlev) {
      continue;
    }
    var cur_md = bwlev_children[i];

    if (cur_md.state('has_no_access')) {
      parent_bwlev = null;
      cur_md.switchPmd();
    } else {
      parent_bwlev = _goDeeper(BWL, map, cur_md, parent_bwlev);
      last_called = parent_bwlev;
    }
  }

  changeBridge(last_called);
}
});
