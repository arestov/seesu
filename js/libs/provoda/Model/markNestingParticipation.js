define(function(require){
'use strict';
var spv = require('spv');
var reportProbe = require('../dcl/probe/report');
var PathParticipation = require('./PathParticipation');

var getPathpId = PathParticipation.getPathpId;
var getPathIdByNestingName = PathParticipation.getPathIdByNestingName;
var getPathIdByPathIdAndPrefix = PathParticipation.getPathIdByPathIdAndPrefix;

return function markNestingParticipation(md, nesting_name, added, removed) {
  if (removed) {
    if (Array.isArray(removed)) {
      for (var i = 0; i < removed.length; i++) {
        handleRemoving(md, nesting_name, removed[i], i);
      }
    } else {
      handleRemoving(md, nesting_name, removed, 0);
    }
  }

  if (added) {
    if (Array.isArray(added)) {
      for (var i = 0; i < added.length; i++) {
        handleAdding(md, nesting_name, added[i], i);
      }
    } else {
      handleAdding(md, nesting_name, added, 0);
    }
  }
};


function handleRemoving(md, nesting_name, item, pos) {
  unmark(md, nesting_name, item, pos);
}

function handleAdding(md, nesting_name, item, pos) {
  startBubleUp(md, mark(md, nesting_name, item, pos));
}

function ensure(cur) {
  if (!cur._participation_in_nesting) {
    cur._participation_in_nesting = spv.set.create();
  }
  return cur._participation_in_nesting;
}

function NestParticipation(nesting_name, md, owner, pos) {
  this.nesting_name = nesting_name;
  this.md = md;
  this.owner = owner;
  this.pos = pos;
}

function mark(md, nesting_name, cur, pos) {
  if (!cur._provoda_id) {
    return;
  }

  var set = ensure(cur);
  var key = nesting_name + ' - ' + cur._provoda_id;

  if (!spv.set.contains(set, key)) {
    return spv.set.add(set, key, new NestParticipation(nesting_name, cur, md, pos));
  }

  var item = spv.set.get(set, key);
  if (item.pos == pos) {return;}

  item.pos = pos;
  return item;

}

function unmark(md, nesting_name, cur) {
  if (!cur._provoda_id) {
    return;
  }

  var key = nesting_name + ' - ' + cur._provoda_id;
  return spv.set.remove(cur._participation_in_nesting, key);
}

function PathsParticipationSet() {
  this.index = {};
  this.list = [];
}

function ensurePathsSet(owner) {
  if (!owner._nestings_paths) {
    owner._nestings_paths = new PathsParticipationSet();
  }

  return owner._nestings_paths;
}

function hasPathp(owner, path_id, md) {
  var pathp_id = getPathpId(md, path_id);
  return owner._nestings_paths &&
    spv.set.contains(owner._nestings_paths, pathp_id);
}

function getPathp(owner, path_id, md) {
  var pathp_id = getPathpId(md, path_id);
  return hasPathp(owner, path_id, md) && owner._nestings_paths.index[pathp_id];
}

function addPacp(owner, path_pacp) {
  var set = ensurePathsSet(owner);
  spv.set.add(set, path_pacp.id, path_pacp);
}

function startItem(owner, nest_ppation) {
  var path_id = getPathIdByNestingName(nest_ppation.nesting_name);

  var pos = [nest_ppation.pos];
  if (!hasPathp(owner, path_id, nest_ppation.md)) {
    var path_pacp = new PathParticipation(path_id, owner, nest_ppation.md, pos);
    addPacp(owner, path_pacp);
  }

  var pathp = getPathp(owner, path_id, nest_ppation.md);
  pathp.pos = pos;

  reportProbe(pathp);

  return pathp;
}

function prependPath(nest_ppation, path_pacp_chi) {
  if (!isBubblingNeeded(path_pacp_chi.md)) {
    return;
  }

  if (path_pacp_chi.path.length > 4) {
    return;
  }

  var cur_path_id = getPathIdByPathIdAndPrefix(nest_ppation.nesting_name, path_pacp_chi.key);

  var pos = [nest_ppation.pos].concat(path_pacp_chi.pos);
  if (!hasPathp(nest_ppation.owner, cur_path_id, path_pacp_chi.md)) {
    var cur = new PathParticipation(
      cur_path_id,
      nest_ppation.owner,
      path_pacp_chi.md,
      pos
    );
    addPacp(nest_ppation.owner, cur);
  }

  var pathp = getPathp(nest_ppation.owner, cur_path_id, path_pacp_chi.md);
  pathp.pos = pos;

  reportProbe(pathp);

  return pathp;

  // if (pathp.path.length > 3) {
  //   debugger;
  // }
}

function startItemChildren(owner, nest_ppation) {
  if (!nest_ppation.md._nestings_paths) {return;}

  var list = [];

  for (var i = 0; i < nest_ppation.md._nestings_paths.list.length; i++) {
    var cur = nest_ppation.md._nestings_paths.list[i];
    var item = prependPath(nest_ppation, cur);
    if (item) {
      list.push(item);
    }
  }

  return list;
}

function startBubleUp(owner, nest_ppation) {
  if (!nest_ppation) {return;}

  /*
    1. collect for owner
      a. cursor
      b. items inside cursor
    2. pass everyng to "parent" participation


    _nestings_paths should be updated when
      a) new child added (owner's nesting)
      b) child changed (owner's nesting nesting)

  */

  var first = startItem(owner, nest_ppation);
  var list = startItemChildren(owner, nest_ppation) || [];
  list.unshift(first);

  if (!owner._participation_in_nesting) {
    return;
  }

  bubleUp(list);
}

function bubleUp(list) {
  while (list.length) {
    var cur = list.shift();
    var np_set = cur.owner._participation_in_nesting;
    if (!np_set || !np_set.list.length) {continue;}

    for (var i = 0; i < np_set.list.length; i++) {
      var nest_ppation = np_set.list[i];
      var item = prependPath(nest_ppation, cur);
      if (item) {
        list.push(item);
      }
      // debugger;
    }
  }
}

function startBubleDown() {

}

function isBubblingNeeded(md) {
  return Boolean(md._probs);
}

});
