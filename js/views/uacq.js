define(function(require) {
'use strict';
var coct = require('./coct');
var spv = require('spv');
var View = require('View');

var UserAcquaintanceView = spv.inh(View, {}, {
  "+states": {
    "lo_accept_inv": [
      "compx",
      ['#locales.accept-inv']
    ]
  }
});

var UserAcquaintancesListView = spv.inh(coct.PageView, {}, {
  "+states": {
    "lo_from_people": [
      "compx",
      ['#locales.rels-people-you']
    ],

    "lo_from_you": [
      "compx",
      ['#locales.rels-you-people']
    ]
  },

  base_tree: {
    sample_name: 'relations_page'
  },

  children_views: {
    acqs_from_someone: UserAcquaintanceView,
    acqs_from_me: UserAcquaintanceView
  }
});

var UserAcquaintancesListPreview = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'user_acqes-preview'
  }
});


return {
  UserAcquaintanceView:UserAcquaintanceView,
  UserAcquaintancesListView:UserAcquaintancesListView,
  UserAcquaintancesListPreview:UserAcquaintancesListPreview
};

});
