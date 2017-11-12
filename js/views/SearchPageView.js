define(function(require) {
'use strict';
var spv = require('spv');
var View = require('View');

var SearchPageView = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'search_results-container'
  }
});
return SearchPageView;
});
