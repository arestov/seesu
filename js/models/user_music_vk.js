define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var comd = require('./comd');
var SongsList = require('./SongsList');
var BrowseMap = require('js/libs/BrowseMap');
var LoadableList = require('./LoadableList');
var declr_parsers = require('js/modules/declr_parsers');

var pvUpdate = require('pv/update');
var cloneObj = spv.cloneObj;

var VkAudioLogin = spv.inh(comd.VkLoginB, {}, {
  "+states": {
    "access_desc": [
      "compx",
      ['#locales.to-play-vk-audio']
    ],

    "active": [
      "compx",
      ['has_session', '@one:requested_by:auth'],
      function(has_session, requested_by) {
        return has_session && requested_by == this._provoda_id;
      }
    ]
  },

  beforeRequest: function() {
    var auth = this.getNesting('auth');
    pvUpdate(auth, 'requested_by', this._provoda_id);
  }
});

var no_access_compx = [['userid'], function(userid) {
  return !userid;
}];

var auth_bh = {
  "+states": {
    "has_no_access": //check this compx
    ["compx"].concat(no_access_compx),

    "userid": [
      "compx",
      ['vk_userid', '#vk_userid', 'for_current_user'],
      function(vk_userid, cur_vk_userid, for_current_user) {
        return (for_current_user ? cur_vk_userid : vk_userid) || null;
      }
    ],

    "has_vk_auth": [
      "compx",
      ['for_current_user', '@one:has_session:auth_part'],
      function(for_current_user, sess) {
        return for_current_user && sess;
      }
    ],

    "parent_focus": [
      "compx",
      ['^mp_has_focus']
    ],

    "acess_ready": [
      "compx",
      ['has_no_access', '@one:active:auth_part'],
      function(no_access, active_auth) {
        return !no_access && active_auth;
      }
    ]
  },

  'nest-pmd_switch': ['^'],

  'nest-auth_part': [VkAudioLogin, {
    ask_for: 'for_current_user'
  }],

  'stch-has_vk_auth': function(target, state) {
    if (state) {
      // если появилась авторизация,
      // то нужно выключить предложение авторизоваться
      target.switchPmd(false);
    }
  },

  'stch-parent_focus': function(target, state) {
    if (!state) {
      // если обзорная страница потеряла фокус,
      // то нужно выключить предложение авторизоваться
      target.switchPmd(false);
    }
  },

  'stch-vk_userid': function(target, state) {
    if (state) {
      target.updateNesting('auth_part', null);
    }
  },

  'stch-acess_ready': function(target, state) {
    if (state) {
      target.loadStart();
      // target.showOnMap();
    }
  }
};

var VkSongList = spv.inh(SongsList, {}, pv.mergeBhv({}, auth_bh));

var VkRecommendedTracks = spv.inh(VkSongList, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",

        parse: [declr_parsers.vk.getTracksFn("response"), function(r) {
          return r && r.response && !!r.response.length;
        }],

        api: "#vktapi",

        fn: [["userid"], function(vk_api, opts, userid) {
          return vk_api.get("audio.getRecommendations", {
            user_id: userid
          });
        }]
      }
    }
  },


});

var MyVkAudioList = spv.inh(VkSongList, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",

        parse: [declr_parsers.vk.getTracksFn("response.items"), {
          props_map: {
            total: ["num", "response.count"],
            has_data_holes: [true]
          }
        }],

        api: "#vktapi",

        fn: [["userid"], function(vk_api, opts, userid) {
          return ["audio.get", {
            oid: userid
          }];
        }]
      }
    }
  },


});

var vk_user_tracks_sp = ['my', 'recommended'];

var VkUserTracks = spv.inh(BrowseMap.Model, {}, {
  model_name: 'vk_users_tracks',
  'nest-lists_list':
    [vk_user_tracks_sp],
  'nest-preview_list':
    [vk_user_tracks_sp, {
      preload_on: 'mp_has_focus'
    }],
  sub_page: {
    'my': {
      constr: MyVkAudioList,
      title: [['#locales.vk-audio']]
    },
    'recommended':{
      constr: VkRecommendedTracks,
      title: [['#locales.VK-Recommended']]
    }
  }
});

var VKFriendsList = spv.inh(LoadableList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "list_items": {
        type: "nest_request",

        parse: [{
          is_array: true,
          source: "response.items",

          props_map: {
            userid: "id",
            first_name: "first_name",
            last_name: "last_name",
            photo: "photo",
            "ava_image.url": "photo_medium",
            "selected_image.url": "photo"
          }
        }, {
          props_map: {
            total: ["num", "response.count"]
          }
        }],

        api: "#vktapi",

        fn: [["userid"], function(vk_api, opts, userid) {
          return vk_api.get("friends.get", {
            user_id: userid,

            fields: [
              "id",
              "first_name",
              "last_name",
              "sex",
              "photo",
              "photo_medium",
              "photo_big"
            ].join(",")
          });
        }]
      }
    }
  },

  main_list_name: 'list_items',
  model_name: 'vk_users',
  page_limit: 200,
  'nest_rqc-list_items': '#users/vk:[:userid]',
}, auth_bh));


return {
  VkUserTracks: VkUserTracks,
  VKFriendsList: VKFriendsList
};
});
