define(function(require) {
'use strict';
var isBigStep = require('./isBigStep');

return function getNavGroups(bwlev) {
  var cur_group = [];
  var groups = [cur_group];

  var cur = bwlev;
  var cur_child = cur.getNesting('pioneer');
  while (cur) {
    cur_group.push(cur_child);

    if (isBigStep(cur, cur_child)) {
      cur_group = [];
      groups.push(cur_group);
    }

    cur = cur.map_parent;
    cur_child = cur && cur.getNesting('pioneer');
  }
  return groups;
};

})
