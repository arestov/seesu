define(function () {
'use strict';
var spv = require('spv');
var nil = spv.nil;
return function getRootBwlevView(target) {
  var cur = target.parent_view;
  var possible_root;

  while (!nil(cur)) {
    if (cur.mpx.md.model_name == 'bwlev') {
      possible_root = cur;
    }

    cur = cur.parent_view;
  }

  return possible_root;
};
});
