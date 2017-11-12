define(function(require) {
'use strict';
var spv = require('spv');
var View = require('View');

var baseNavUI = spv.inh(View, {}, {
  dom_rp: true,
  base_tree: {
    sample_name: 'common-nav'
  },

  'compx-nav_clickable': [['^nav_clickable']],
  tpl_events:{
    zoomOut: function() {
      if (this.state('nav_clickable')){
        this.parent_view.RPCLegacy('zoomOut');
      }
    }
  }
});

var StartPageNavView = spv.inh(baseNavUI, {}, {
  base_tree: {
    sample_name: 'start_page-nav'
  }
});

var investgNavUI = spv.inh(baseNavUI, {}, {
  base_tree: {
    sample_name: 'search_page-nav'
  }
});

return {
  baseNavUI:baseNavUI,
  StartPageNavView:StartPageNavView,
  investgNavUI:investgNavUI
};
});
