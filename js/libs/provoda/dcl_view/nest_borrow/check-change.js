define(function (require) {
'use strict';
var spv = require('spv');
var nil = spv.nil;

function checkChange(target, nesname, items) {
  // пришли изменения одного nest. надо проверить существующие watch
  if (nil(target.nest_borrow_watchers)) {
    return;
  }

  for (var i = 0; i < target.nest_borrow_watchers.list.length; i++) {
    checkNestingWatch(target, target.nest_borrow_watchers.list[i], nesname, items)
  }
};

function checkChildren(target, watch) {
  // создан один watch, надо проверить существующие nest
  for (var i in target.children_models) {
    checkNestingWatch(target, watch, i, target.children_models[i]);
  }
}


function checkNestingWatch(target, watch, nesname, items) {
  if (watch.dcl.source_nesting_name !== nesname) {
    return;
  }

  watch.view.collectionChange(watch.view, watch.dcl.name, items);
}

checkChange.checkChildren = checkChildren;

return checkChange;
})
