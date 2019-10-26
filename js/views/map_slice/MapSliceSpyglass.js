define(function(require) {
'use strict';

var spv = require('spv')
var View = require('View');
var Core = require('./MapSliceSpyglassCore')
var BrowseLevNavView = require('./BrowseLevNavView');
var BrowseLevView = require('./BrowseLevView');


var SearchCriteriaView = spv.inh(View, {}, {
  "+states": {
    "startpage_autofocus": [
      "compx",
      ['^startpage_autofocus']
    ]
  },

  tpl_events: {
    preventSubmit: function (e) {
      e.preventDefault();
    }
  },

  'stch-startpage_autofocus': function(target, value) {
    if (!value) {
      return;
    }

    target.nextLocalTick(target.tickCheckFocus);
  },

  tickCheckFocus: function() {
    this.getCusomAncs()['search_face'][0].focus();
  }
});


return spv.inh(Core, {}, {
  children_views: {
    map_slice: {
      main: BrowseLevView,
    },
    navigation: BrowseLevNavView,
    search_criteria: SearchCriteriaView,
  },
  'collch-search_criteria': true,
});
// return MapSliceSpyglassCore
})
