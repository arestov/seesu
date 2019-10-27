define(function(require) {
'use strict';
var spv = require('spv');
var View = require('View');

var ArtistListView = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'artists_list'
  }
});

return ArtistListView;
});
