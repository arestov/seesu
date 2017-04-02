define(function (require) {
'use strict';
var spv = require('spv');
var nil = spv.nil;

function probeCheckChange(target, nesname, items) {
  // пришли изменения одного nest. надо проверить существующие watch
  if (nil(target.probe_watchers)) {
    return;
  }

  for (var i = 0; i < target.probe_watchers.list.length; i++) {
    probeCheckNestingWatch(target, target.probe_watchers.list[i], nesname, items)
  }
};

function probeCheckChildren(target, watch) {
  // создан один watch, надо проверить существующие nest
  for (var i in target.children_models) {
    probeCheckNestingWatch(target, watch, i, target.children_models[i]);
  }
}


function probeCheckNestingWatch(target, watch, nesname, items) {
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

// probeCheckChange.probeCheckNestingWatch = probeCheckNestingWatch;
probeCheckChange.probeCheckChildren = probeCheckChildren;

return probeCheckChange;
})
