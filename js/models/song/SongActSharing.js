define(function(require) {
"use strict";
var pv = require('pv');
var spv = require('spv');
var app_serv = require('app_serv');
var invstg = require('../invstg');
var comd = require('../comd');
var LfmAuth = require('js/LfmAuth');
var pvUpdate = require('pv/update');
var getImageWrap = require('js/libs/helpers/getLFMImageWrap')

var app_env = app_serv.app_env;
var pvState = pv.state;

var struserSuggest = spv.inh(invstg.BaseSuggest, {
  init: function(self, opts, params) {
    self.app = params.app;
    self.mo = params.mo;
    self.row = params.row;

    var user = params.user;

    self.user_id = user.state('userid');
    self.photo = user.state('photo');
    // self.online = self.online;
    //self.name = user.name;
    self.text_title = user.state('first_name') + " " + user.state('last_name');
    self.updateManyStates({
      photo: user.state('photo'),
      text_title: self.text_title
    });
  }
}, {
  valueOf: function(){
    return this.user_id;
  },
  onView: function(){
    this.mo.postToVKWall(this.user_id);
    this.row.hide();
  }
});

var VKLoginFSearch = spv.inh(comd.VkLoginB, {}, {
  "+states": {
    "access_desc": [
      "compx",
      ['#locales.to-find-vk-friends', '#locales.to-post-and-find-vk', '#env.vkontakte'],
      function(friends, to_post, is_vk) {
        return is_vk ? friends: to_post;
      }
    ]
  },

  config: {
    open_opts: {settings_bits: 2}
  }
});



var StrusersRSSection = spv.inh(invstg.SearchSection, {
  init: function(self) {
    self.mo = self.map_parent.mo;
    self.rpl = self.map_parent.map_parent;

    self.updateManyStates({
      vk_env: !!app_env.vkontakte,
      has_vk_api: !!self.app.vk_api,
      vk_opts: !!app_env.vkontakte && self.app._url.api_settings
    });

    self.app.on("vk-api", function(api) {
      pvUpdate(self, "has_vk_api", !!api);
    });

    if (app_env.vkontakte) {
      self.app.vk_auth.on('settings-change', function(vk_opts) {
        pvUpdate(self, 'vk_opts', vk_opts);
      });
    }

    var cu_info = self.app.s.getInfo('vk');
    if (cu_info){
      if (cu_info.photo){
        pvUpdate(self, "own_photo", cu_info.photo);
      }
    } else {
      self.app.s.once("info-change-vk", function(cu_info) {
        if (cu_info.photo){
          pvUpdate(self, "own_photo", cu_info.photo);
        }
      });
    }


    self.friends_page = self.app.routePathByModels('/users/me/vk:friends');

    self.friends_page.on('child_change-list_items', function(e) {
      pv.updateNesting(this, 'friends', e.value);
      this.changeQuery('');
      this.searchByQuery(this.state('query'));
    }, self.getContextOpts());

    self.lwch(self, 'can_search', function(state) { //load
      if (!state){return;}

      this.useMotivator(this.friends_page, preloadStart);
      this.searchByQuery('');
    });
  }
}, {
  "+states": {
    "can_searchf_vkopt": [
      "compx",
      ['vk_opts'],
      function(vk_opts) {
        return (vk_opts & 2) * 1;
      }
    ],

    "can_post_to_own_wall": [
      "compx",
      ['vk_env', 'has_vk_api'],
      function(vk_env, has_vk_api) {
        return vk_env || has_vk_api;
      }
    ],

    "can_search": [
      "compx",
      ['can_search_friends']
    ],

    "can_search_friends": [
      "compx",
      ['vk_env', 'has_vk_api', 'can_searchf_vkopt'],
      function(vk_env, has_vk_api, can_searchf_vkopt) {
        if (vk_env) {
          return !!can_searchf_vkopt;
        } else {
          return !!has_vk_api;
        }
      }
    ],

    "needs_vk_auth": [
      "compx",
      ['can_search_friends'],
      function(can_search_friends) {
        return !can_search_friends;
      }
    ]
  },
  'nest_rqc-items': struserSuggest,
  model_name: "section-vk-users",

  //desc: improve ?
  'nest-vk_auth': [VKLoginFSearch, {
    ask_for: 'needs_vk_auth',
  }],

  'stch-can_search_friends': function(target, state) {
    if (state){
      target.searchByQuery(pvState(target, 'query'));
    }
  },

  searchByQuery: function(query) {
    this.changeQuery(query);
    this.searchFriends();
  },

  searchFriends: function(){
    var list = this.getNesting('friends') || [];
    var query = this.state('query');
    if (!this.state('can_search')){
      return;
    }
    var r = (query ? spv.searchInArray(list, query, ["states.first_name", "states.last_name"]) : list);
    if (r.length){
      r = r.slice();
      for (var i = 0; i < r.length; i++) {
        r[i] = {
          mo: this.mo,
          user: r[i],
          row: this.rpl
        };
      }
    }
    this.appendResults(r, true);
  },

  postToVKWall: function() {
    this.mo.postToVKWall();
  }
});






var LFMUserSuggest = spv.inh(invstg.BaseSuggest, {
  init: function(target, opts, params) {
    var user = params.user;
    target.app = params.app;
    target.mo = params.mo;
    target.row = params.row;

    target.userid = user.state('userid');
    target.text_title = target.userid;
    target.updateManyStates({
      selected_image: user.state('lfm_img'),
      text_title: target.text_title
    });
  }
}, {
  valueOf: function(){
    return this.userid;
  },
  onView: function(){
    this.mo.shareWithLFMUser(this.userid);
    this.row.hide();
  }
});

function preloadStart(item) {
  item.preloadStart();
}

var LFMFriendsSection = spv.inh(invstg.SearchSection, {
  'nest-friends': ['#/users/me/lfm:friends', 'can_share', 'can_share'],
  init: function(target) {
    target.mo = target.map_parent.mo;
    target.rpl = target.map_parent.map_parent;

    target.friends_page = target.app.routePathByModels('/users/me/lfm:friends');

    target.friends_page.on('child_change-list_items', function(e) {
      pv.updateNesting(this, 'friends', e.value);
      this.changeQuery('');
      this.searchByQuery(this.state('query'));
    }, target.getContextOpts());

    target.lwch(target, 'can_search', function(state) { //load
      if (!state){return;}

      this.useMotivator(this.friends_page, preloadStart);
      this.searchByQuery('');
    });
  },
}, {
  "+states": {
    "can_search": ["compx", ['can_share']],

    "can_share": [
      "compx",
      ['^^active_view', '#lfm_userid'],
      function(active_view, lfm_userid) {
        return lfm_userid && active_view;
      }
    ]
  },

  searchByQuery: function(query) {
    this.changeQuery(query);
    this.searchFriends();
  },

  searchFriends: function(){
    var list = this.getNesting('friends') || [];
    var query = this.state('query');
    if (!this.state('can_search')){
      return;
    }
    var r = (query ? spv.searchInArray(list, query, ["states.userid", "states.realname"]) : list);
    if (r.length){
      r = r.slice();
      for (var i = 0; i < r.length; i++) {
        r[i] = {
          mo: this.mo,
          user: r[i],
          row: this.rpl
        };
      }
    }
    this.appendResults(r, true);
  },

  'nest_rqc-items': LFMUserSuggest,
  model_name: "section-lfm-friends"
});



var LFMOneUserSuggest = spv.inh(invstg.BaseSuggest, {
  init: function(target, opts, params) {
    var user = params.user;
  //
    target.app = params.app;
    target.mo = params.mo;
    target.row = params.row;


    target.userid = user.name;
    target.text_title = target.userid;
    target.updateManyStates({
      selected_image: getImageWrap(user.image),
      text_title: target.text_title
    });
  }
}, {
  valueOf: function(){
    return this.userid;
  },
  onView: function(){
    var _this = this;
    this.mo.shareWithLFMUser(this.userid);
    _this.row.hide();
    /*.done(function() {
      _this.row.hide();
    });*/

  }
});




var LFMOneUserSection = spv.inh(invstg.SearchSection, {
  init: function(target) {
    target.mo = target.map_parent.mo;
    target.rpl = target.map_parent.map_parent;

    target.lwch(target, 'can_share', function(state) { //load
      if (!state){return;}

      this.searchByQuery('');
    });
  }
}, {
  "+states": {
    "can_share": [
      "compx",
      ['^^active_view', '#lfm_userid'],
      function(active_view, lfm_userid) {
        return lfm_userid && active_view;
      }
    ]
  },

  searchByQuery: function(query) {
    this.changeQuery(query);
    this.searchOneUser();
  },

  searchOneUser: spv.debounce(function() {
    var _this = this;

    var q = this.state('query');
    if (!q){
      return;
    }
    if (!this.state('can_share')){
      return;
    }

    this.loading();
    this.addRequest(
      this.app.lfm
        .get('user.getInfo', {user: q})
          .then(function(r){
            if (!_this.doesNeed(q)){return;}
            _this.loaded();

            var result = [];
            if (r.user && r.user.name){
              result.push({
                mo: _this.mo,
                row: _this.rpl,
                app: _this.app,

                user: r.user

              });

            }
            //r = r && parser(r, this.resItem, method);
            _this.appendResults(result, true);

          }, function(){
            if (!_this.doesNeed(q)){return;}
            _this.loaded();
          }));
  }, 200),

  searchFriends: function(){
    var list = this.getNesting('friends') || [];
    var query = this.state('query');
    var r = (query ? spv.searchInArray(list, query, ["states.userid", "states.realname"]) : list);
    if (r.length){
      r = r.concat();
      for (var i = 0; i < r.length; i++) {
        r[i] = {
          mo: this.mo,
          user: r[i],
          row: this.rpl
        };
      }
    }
    this.appendResults(r, true);
  },
  'nest_rqc-items': LFMOneUserSuggest,
  model_name: "section-lfm-user"
});


var LfmSharingAuth = spv.inh(LfmAuth.LfmLogin, {}, {
  "+states": {
    "access_desc": [
      "compx",
      ['#locales.lastfm-sharing-access']
    ]
  }
});

var StrusersRowSearch = spv.inh(invstg.Investigation, {
  init: function(target) {
    target.mo = target.map_parent.mo;
  }
}, {
  skip_map_init: true,
  'nest-lfm_auth': [LfmSharingAuth],
  'nest-section': [[StrusersRSSection, LFMFriendsSection, LFMOneUserSection]],


  searchf: function() {
    var query = this.q;
    var _this = this;
    ['section-vk-users', 'section-lfm-friends', 'section-lfm-user'].forEach(function(el) {
      var section = _this.g(el);
      if (!section) {
        return;
      }
      section.setActive();
      section.searchByQuery(query);
    });
  }
});


var SongActSharing = spv.inh(comd.BaseCRow, {
  init: function(target){
    target.mo = target.map_parent.map_parent;
    target.search('');
  }
}, {
  "+states": {
    "share_url": ["compx", ['^^share_url']]
  },

  actionsrow_src: '^',
  'nest-searcher': [StrusersRowSearch],

  search: function(q) {
    pvUpdate(this, 'query', q);
    var searcher = this.getNesting('searcher');
    if (searcher) {
      searcher.changeQuery(q);
    }
  },

  model_name: 'row-share'
});



return SongActSharing;
});
