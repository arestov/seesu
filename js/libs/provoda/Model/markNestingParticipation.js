define(function(require){
'use strict';
var spv = require('spv');
var findAndRemoveItem = spv.findAndRemoveItem;

var cache_by_ids = {};
var count = 1;

var getPathById= function(path_id) {
  return cache_by_ids.hasOwnProperty(path_id) ? cache_by_ids[path_id] : null;
};

var getPathIdByNestingName = spv.memorize(function(nesting_name) {
  var result = [nesting_name];
  var path_id = ++count;
  cache_by_ids[path_id] = result;
  return path_id;
});

var getPathIdByPathIdAndPrefix = spv.memorize(function(nesting_name, base_path_id) {
  var base = getPathById(base_path_id);
  var copied = base.slice();
  copied.unshift(nesting_name);

  var path_id = ++count;
  cache_by_ids[path_id] = copied;

  return path_id;
}, function (nesting_name, base_path_id) {
  return nesting_name + '-' + base_path_id;
});

return function (md, nesting_name, added, removed) {
  if (removed) {
    if (Array.isArray(removed)) {
      for (var i = 0; i < removed.length; i++) {
        unmark(md, nesting_name, removed[i], i);
      }
    } else {
      unmark(md, nesting_name, removed, 0);
    }
  }

  if (added) {
    if (Array.isArray(added)) {
      for (var i = 0; i < added.length; i++) {
        startBubleUp(md, mark(md, nesting_name, added[i], i));
      }
    } else {
      startBubleUp(md, mark(md, nesting_name, added, 0));
    }
  }
};

function ensure(cur) {
  if (!cur._participation_in_nesting) {
    cur._participation_in_nesting = new NestingParticipationSet();
  }
}

function NestParticipation(nesting_name, md, owner, pos) {
  this.nesting_name = nesting_name;
  this.md = md;
  this.owner = owner;
  this.pos = pos;
}

function mark(md, nesting_name, cur, pos) {
  ensure(cur);
  var key = nesting_name + ' - ' + cur._provoda_id;

  var set = cur._participation_in_nesting;

  if (!isInSet(set, key)) {
    return AddToSet(set, key, new NestParticipation(nesting_name, cur, md, pos));
  }

  var item = getFromSet(set, key);
  if (item.pos == pos) {return;}

  item.pos = pos;
  return item;

}

function unmark(md, nesting_name, cur) {
  var key = nesting_name + ' - ' + cur._provoda_id;
  return RemoveFromSet(cur._participation_in_nesting, key);
}

function PathParticipation(key, owner, md, pos) {
  this.owner = owner;
  this.md = md;
  this.pos = pos;
  this.key = key;
  this.path = getPathById(key);

}

function PathsParticipationSet() {
  this.index = {};
  this.list = [];
}

function ensurePathsSet(owner, path_id) {
  if (!owner._nestings_paths) {
    owner._nestings_paths = {};
  }

  if (!owner._nestings_paths[path_id]) {
    owner._nestings_paths[path_id] = new PathsParticipationSet();
  }

  return owner._nestings_paths[path_id];
}

function hasPathp(owner, path_id, md) {
  return owner._nestings_paths &&
    owner._nestings_paths.hasOwnProperty(path_id) &&
    isInSet(owner._nestings_paths[path_id], md._provoda_id);
}

function getPathp(owner, path_id, md) {
  return hasPathp(owner, path_id, md) && owner._nestings_paths[path_id].index[md._provoda_id];
}

function addPacp(owner, path_id, path_pacp) {
  var set = ensurePathsSet(owner, path_id);
  AddToSet(set, path_pacp.md._provoda_id, path_pacp);
}

function startItem(owner, nest_ppation) {
  var path_id = getPathIdByNestingName(nest_ppation.nesting_name);

  var pos = [nest_ppation.pos];
  if (!hasPathp(owner, path_id, nest_ppation.md)) {
    var path_pacp = new PathParticipation(path_id, owner, nest_ppation.md, pos);
    addPacp(owner, path_id, path_pacp);
  }

  var pathp = getPathp(owner, path_id, nest_ppation.md);
  pathp.pos = pos;
  return pathp;
}

function prependPath(nest_ppation, path_pacp_chi) {
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
    addPacp(nest_ppation.owner, cur_path_id, cur);
  }

  var pathp = getPathp(nest_ppation.owner, cur_path_id, path_pacp_chi.md);
  pathp.pos = pos;

  return pathp;

  // if (pathp.path.length > 3) {
  //   debugger;
  // }
}

function startItemChildren(owner, nest_ppation) {
  if (!nest_ppation.md._nestings_paths) {return;}

  var list = [];

  for (var path_id in nest_ppation.md._nestings_paths) {
    if (!nest_ppation.md._nestings_paths.hasOwnProperty(path_id)) {continue;}

    var arr = nest_ppation.md._nestings_paths[path_id].list;
    for (var i = 0; i < arr.length; i++) {
      var item = prependPath(nest_ppation, arr[i]);
      if (item) {
        list.push(item);
      }
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



function NestingParticipationSet() {
  this.index = {};
  this.list = [];
}

function getFromSet(set, key) {
  if (isInSet(set, key)) {return set.index[key];}
}

function isInSet(set, key) {
  return set.index.hasOwnProperty(key);
}

function AddToSet(set, key, item) {
  if (!item) {
    throw new Error('cant\'t add nothing');
  }

  if (set.index.hasOwnProperty(key)) {return item;}

  set.index[key] = item;
  set.list.push(item);

  return item;
}

function RemoveFromSet(set, key) {
  var item = set.index[key];
  if (!set.index.hasOwnProperty(key)) {return;}

  delete set.index[key];
  set.list = findAndRemoveItem(set.list, item);
  return item;
}

});
