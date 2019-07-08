define(function (require) {
'use strict';
var spv = require('spv');
var nil = spv.nil;
var getModelById = require('../../utils/getModelById');


var getRootBwlevView = require('./getRootBwlevView');
var getBwlevView = require('../getBwlevView')

function getModel(view, _provoda_id) {
  var proxies_space = view.proxies_space || view.root_view.proxies_space;
  var mpx = view._highway.views_proxies.spaces[proxies_space].mpxes_index[_provoda_id]
  return mpx.md;
}

function watchAndRequest(root_bwlev_view, self, spyglass) {
  var key = spyglass.nest_name + '---' + self.view_id;

  self.lwch(root_bwlev_view, 'spyglasses_requests', function handleChange(index) {
    var value = index[key] || null;

    self.collectionChange(self, spyglass.nest_name, value && getModel(self, value));
    // TODO if (value) {unsubscribe()}
  })

  var parent_bwlev_view = spyglass.bwlev === true && getBwlevView(self)
  root_bwlev_view.RPCLegacy('requestSpyglass', {
    key: key,
    bwlev: spyglass.bwlev && parent_bwlev_view.mpx.md._provoda_id,
    context_md: spyglass.context_md && getContextId(self, parent_bwlev_view, spyglass.context_md),
    name: spyglass.name,
  });
  // TODO remove key value from index on this view/self destroy
}

function getContextId(view, parent_bwlev_view, steps) {
  if (steps === true) {
    return parent_bwlev_view.children_models.pioneer._provoda_id;
  }

  if (steps.startsWith('.')) {
    throw new Error('implement local context getting')
    // could be specially usefull inside `nest_borrow`
  }

  throw new Error('implement steps (^^^^) context getting')
}

return function (self) {
  if (nil(self._spyglass)) {
    return;
  }
  var root_view = self.root_view || (self.isRootView && self)
  var root_bwlev_view = root_view.parent_view;
  if (nil(root_bwlev_view)) {
    throw new Error('cant find bwlev_view');
  }

  for (var key in self._spyglass) {
    var cur = self._spyglass[key];
    watchAndRequest(root_bwlev_view, self, cur)
  }
};
});
