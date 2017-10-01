define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
// var morph_helpers = require('js/libs/morph_helpers');
// var BrowseMap = require('../libs/BrowseMap');

return spv.inh(pv.Model, {}, {
  'compx-show_search_form': [['#show_search_form']],
  'stch-query_value': function(target, value) {
    target.updateState('query_face', value);

    if (!value) {
      target.app.showStartPage();
    } else {
      target.app.showResultsPage(value);
    }
  },
});
});
