define(function (require) {
'use strict';
var spv = require('spv');
var nil = spv.nil;

function spyglassCheckChange(target, nesname, items) {
  // пришли изменения одного nest. надо проверить существующие watch
  if (nil(target.spyglass_watchers)) {
    return;
  }

  for (var i = 0; i < target.spyglass_watchers.list.length; i++) {
    spyglassCheckNestingWatch(target, target.spyglass_watchers.list[i], nesname, items)
  }
};

function spyglassCheckChildren(target, watch) {
  // создан один watch, надо проверить существующие nest
  for (var i in target.children_models) {
    spyglassCheckNestingWatch(target, watch, i, target.children_models[i]);
  }
}


function spyglassCheckNestingWatch(target, watch, nesname, items) {
  if (watch.dcl.transport_name !== nesname) {
    return;
  }

  for (var i = 0; i < items.length; i++) {
    if (items[i].state('owner_provoda_id') != watch.view.mpx.md._provoda_id) {
      continue;
    }

    watch.view.collectionChange(watch.view, watch.dcl.transport_name, [items[i]]);
  }
}

// spyglassCheckChange.spyglassCheckNestingWatch = spyglassCheckNestingWatch;
spyglassCheckChange.spyglassCheckChildren = spyglassCheckChildren;

return spyglassCheckChange;
})
