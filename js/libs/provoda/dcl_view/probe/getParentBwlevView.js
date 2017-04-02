define(function () {
'use strict';
var spv = require('spv');
var nil = spv.nil;
return function getParentBwlevView(target) {
  var cur = target.parent_view;

  while (!nil(cur)) {
    if (cur.mpx.md.model_name == 'bwlev') {
      return cur;
    }

    cur = cur.parent_view;
  }

};
});
