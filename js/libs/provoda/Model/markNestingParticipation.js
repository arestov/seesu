define(function(require){
'use strict';
var spv = require('spv');
var findAndRemoveItem = spv.findAndRemoveItem;

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

function PathParticipation(key, path, owner, md, pos) {
  // debugger;
  this.owner = owner;
  this.md = md;
  this.pos = pos;
  this.key = key;
  this.path = path;

}

function PathsParticipationSet() {
  this.index = {};
  this.list = [];
}

function addPacp(owner, path_id, path_pacp) {
  if (!owner._nestings_paths) {
    owner._nestings_paths = {};
  }

  if (!owner._nestings_paths[path_id]) {
    owner._nestings_paths[path_id] = new PathsParticipationSet();
  }

  var set = owner._nestings_paths[path_id];

  AddToSet(set, path_pacp.md._provoda_id, path_pacp);
}

function startItem(owner, part) {
  var path_id = part.nesting_name;
  var path_pacp = new PathParticipation(path_id, [part.nesting_name], owner, part.md, [part.pos]);

  addPacp(owner, path_id, path_pacp);
}

function startItemChildren(owner, part) {
  if (!part.md._nestings_paths) {return;}

  for (var path_id in part.md._nestings_paths) {
    if (!part.md._nestings_paths.hasOwnProperty(path_id)) {continue;}

    var arr = part.md._nestings_paths[path_id].list;
    for (var i = 0; i < arr.length; i++) {
      var path_pacp_chi = arr[i];
      if (path_pacp_chi.pos.length > 4) {
        continue;
      }
      var cur_key = part.nesting_name + '.' + path_id;
      var cur = new PathParticipation(
        cur_key,
        [part.nesting_name].concat(path_pacp_chi.path),
        owner,
        path_pacp_chi.md,
        [part.pos].concat(path_pacp_chi.pos)
      );

      addPacp(owner, cur_key, cur);

      if (cur.pos.length > 3) {
        debugger;
      }

    }

    // var path_pacp_chi =
  }
}

function startBubleUp(owner, part) {
  if (!part) {return;}

  /*
    1. collect for owner
      a. cursor
      b. items inside cursor
    2. pass everyng to "parent" participation


    _nestings_paths should be updated when
      a) new child added (owner's nesting)
      b) child changed (owner's nesting nesting)

  */

  startItem(owner, part);
  startItemChildren(owner, part);

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
