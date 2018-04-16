define(function () {
'use strict';
var spv = require('spv');
var nil = spv.nil;
return function getBwlevView(target) {
  var cur = target;

  while (!nil(cur)) {
    if (cur.mpx.md.model_name == 'bwlev') {
      return cur;
    }

    cur = cur.parent_view;
  }

};
});
