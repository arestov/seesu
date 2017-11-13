define(function(require) {
'use strict';
var coct = require('./coct');
var env = require('env');
var $ = require('jquery');
var spv = require('spv');
var View = require('View');

var app_env = env;
var LULAPageVIew = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'lula_page'
  },
  children_views: {
    all_time: coct.ImagedListPreview
  }

});

var LULAsPageVIew = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'lulas_page'
  }
});


var UserTagsPageView = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'user_tags_page'
  }
});

var LfmFriendPreview = spv.inh(View, {}, {
  tpl_events: {
    open_link: function(e, node) {
      e.preventDefault();
      e.stopPropagation();
      app_env.openURL($(node).attr('href'));
      this.root_view.trackEvent('Links', 'just link');
    }
  }
});

var LfmUsersPageView = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'lfm_users_page'
  },
  children_views: {
    list_items: LfmFriendPreview
  }
});

return {
  LULAPageVIew: LULAPageVIew,
  LULAsPageVIew: LULAsPageVIew,
  UserTagsPageView: UserTagsPageView,
  LfmUsersPageView: LfmUsersPageView
};
});
