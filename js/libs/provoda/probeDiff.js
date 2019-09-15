define(function (require) {
'use strict';
var getNesting = require('pv/getNesting')

var getModelByIdUniversal = function(highway_holder, _provoda_id) {
  var _highway = highway_holder._highway
  if (_highway.models) {
    return _highway.models[_provoda_id]
  }

  if (!_highway.views_proxies) {
    return _highway.sync_r.models_index[_provoda_id]
  }

  var view = highway_holder
  var proxies_space = view.proxies_space || view.root_view.proxies_space;
  var mpx = _highway.views_proxies.spaces[proxies_space].mpxes_index[_provoda_id]
  return mpx.md;
}

var getModelByR = function(highway_holder, mdr) {
  var _provoda_id = mdr._provoda_id
  return getModelByIdUniversal(highway_holder, _provoda_id)
}

var getTree = function (highway_holder, mdrp) {
  var result = [];
  if (!mdrp) {
    return result;
  }
  var cur = getModelByR(highway_holder, mdrp);
  while (cur) {
    result.unshift(cur);
    cur = cur.map_parent;
  }
  return result;
};

var pathAsSteps = function (path, value) {
  if (!path) {return;}
  var result = new Array(path.length);
  for (var i = 0; i < path.length; i++) {
    var cur = path[i];

    result[i] = {
      type: 'move-view',
      value: value,
      bwlev: cur.getMDReplacer(),
      target: cur.getNesting('pioneer').getMDReplacer()
    };
  }

  return result;
};

function getClosestStep(value_full_path, oldvalue_full_path) {
  var length = Math.max(value_full_path.length, oldvalue_full_path.length);
  for (var i = 0; i < length; i++) {
    var curA = value_full_path[i];
    var curB = oldvalue_full_path[i];
    if (curA !== curB) {
      return i;
    }
  }
}

var asMDR = function(md) {
  return md && md.getMDReplacer();
}

return function probeDiff(highway_holder, value, oldvalue) {
  var bwlev = value;
  var target = getNesting(getModelByR(highway_holder, bwlev), 'pioneer').getMDReplacer();

  var value_full_path = getTree(highway_holder, value);
  var oldvalue_full_path = getTree(highway_holder, oldvalue);

  var closest_step = getClosestStep(value_full_path, oldvalue_full_path);
  var value_path_to = closest_step != null && value_full_path.slice(closest_step);;
  var oldvalue_path_from = closest_step != null && oldvalue_full_path.slice(closest_step).reverse();
  var common_step = closest_step != null && value_full_path[closest_step - 1];

  var changes_wrap = [];
  if (oldvalue_path_from && oldvalue_path_from.length) {
    changes_wrap.push({
      name: 'zoom-out',
      changes: pathAsSteps(oldvalue_path_from, false)
    });
  }
  if (value_path_to && value_path_to.length) {
    changes_wrap.push({
      name: 'zoom-in',
      changes: pathAsSteps(value_path_to, true)
    });
  }


  return {
    bwlev: bwlev,
    target: target,
    value_full_path: value_full_path.map(asMDR),
    oldvalue_full_path: oldvalue_full_path.map(asMDR),
    common_step: common_step,
    array: changes_wrap,
  };
};
});
