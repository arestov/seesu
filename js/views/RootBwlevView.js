define(function(require) {
'use strict';
var View= require('View');
var spv = require('spv');

return function createRootBwlevView (RootView) {
  return spv.inh(View, {}, {
    'collch-pioneer': true,
    children_views: {
      pioneer: RootView
    }
  });
};
});
