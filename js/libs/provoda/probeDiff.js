define(function () {
'use strict';
var getParents = function (mdrp) {
  var result = [];
  if (!mdrp) {
    return result;
  }
  var cur = mdrp.getMD();
  while (cur) {
    result.unshift(cur);
    cur = cur.map_parent;
  }
  return result;
};

var pathAsSteps = function (path) {
  if (!path) {return;}
  var result = new Array(path.length);
  for (var i = 0; i < path.length; i++) {
    var cur = path[i];

    result[i] = {
      type: 'move-view',
      value: true,
      bwlev: cur.getMDReplacer(),
      target: cur.getNesting('pioneer').getMDReplacer()
    };
  }

  return result;
};

return function probeDiff(value, oldvalue, changes_number) {
  var bwlev = value;
  var target = bwlev.getMD().getNesting('pioneer').getMDReplacer();

  var value_full_path = getParents(value);
  var oldvalue_full_path = getParents(oldvalue);

  var common_parent = null;
  var value_path_to = null;
  var oldvalue_path_from = null;

  var length = Math.max(value_full_path.length, oldvalue_full_path.length);
  for (var i = 0; i < length; i++) {
    var curA = value_full_path[i];
    var curB = oldvalue_full_path[i];
    if (curA !== curB) {
      value_path_to = value_full_path.slice(i).reverse();
      oldvalue_path_from = oldvalue_full_path.slice(i);
      break;
    }
    common_parent = curA;
  }

  var changes_wrap = [];
  if (oldvalue_path_from && oldvalue_path_from.length) {
    changes_wrap.push({
      name: 'zoom-out',
      changes: pathAsSteps(oldvalue_path_from)
    });
  }
  changes_wrap.push({
    name: 'zoom-in',
    changes: pathAsSteps(value_path_to)
  });

  return {
    changes_number: changes_number,
    bwlev: bwlev,
    target: target,
    value_full_path: value_full_path,
    oldvalue_full_path: oldvalue_full_path,
    common_parent: common_parent,
    array: changes_wrap,
  };
};
});
