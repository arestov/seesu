define(function(require) {
'use strict'
var spv = require('spv');
var map_slice_by_model = require('./pages/index');
var BrowseLevView = require('./BrowseLevViewCore')

var BrowseLevView = spv.inh(BrowseLevView, {}, {
  children_views_by_mn: {
    pioneer: map_slice_by_model
  },
});

return BrowseLevView;
})
