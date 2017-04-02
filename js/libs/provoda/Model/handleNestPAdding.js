define(function (require) {
'use strict';
var spv = require('spv');
var reportProbe = require('../dcl/probe/report');
var PathParticipation = require('./PathParticipation');

var getPathpId = PathParticipation.getPathpId;
var getPathIdByNestingName = PathParticipation.getPathIdByNestingName;
var getPathIdByPathIdAndPrefix = PathParticipation.getPathIdByPathIdAndPrefix;

return function handleAdding(md, nesting_name, item, pos) {
  // md - хранитель
  // nesting_name - грездо
  // item - элемент гнезда
  startBuble(md, mark(md, nesting_name, item, pos));
};

function NestParticipation(nesting_name, md, owner, pos) {
  this.nesting_name = nesting_name;
  this.md = md;
  this.owner = owner;
  this.pos = pos;
}

function ensure(cur) {
  if (!cur._participation_in_nesting) {
    cur._participation_in_nesting = spv.set.create();
  }
  return cur._participation_in_nesting;
}

function mark(md, nesting_name, cur, pos) {
  if (!cur._provoda_id) {
    return;
  }

  var set = ensure(cur);
  /*

  _participation_in_nesting.

   хранит информацию о превставлении модели в качестве элементов различных грезд
   "участие" (непосредственное участие)
  */
  var key = nesting_name + ' - ' + cur._provoda_id;

  if (!spv.set.contains(set, key)) {
    return spv.set.add(set, key, new NestParticipation(nesting_name, cur, md, pos));
  }

  var item = spv.set.get(set, key);
  if (item.pos == pos) {return;}

  item.pos = pos;
  return item;

}


function startBuble(owner, nest_ppation) {
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

  bubleList(list);
}

function bubleList(list) {
  // для каждой вовлеченности распространить её вдоль участий её владельца
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

function prependPath(nest_ppation, path_pacp_chi) {
  // распространяет информацию о вовлечении из глубины наружу

  if (!isBubblingNeeded(path_pacp_chi.md)) {
    return;
  }

  if (path_pacp_chi.path.length > 4) {
    return;
  }

  /*
  1. add item
  2. mark item's position
  */

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
  /*
  если элемент "участия" является владельцем "вовлеченностей", то необходимо
  вычислить/распространить их в сторону "участия"
  */

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

function startItem(owner, nest_ppation) {
  /*
  конвертировать "участие" во "вовлеченность"
  */

  /*
  1. add item
  2. mark item's position
  */
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
  // добавляет информацию о вовлечении

  /*
    информация об участии моделей в качестве вложенности проивольной глублины
    в этой модели
    "вовлечение" другой конец "участие". интересует место участия, его широта и владелец, а не участник
  */
  var set = ensurePathsSet(owner);
  spv.set.add(set, path_pacp.id, path_pacp);
}

function ensurePathsSet(owner) {
  if (!owner._nestings_paths) {
    owner._nestings_paths = new PathsParticipationSet();
  }
  return owner._nestings_paths;
}

function PathsParticipationSet() {
  this.index = {};
  this.list = [];
}

function isBubblingNeeded(md) {
  return Boolean(md._probs);
}




})
