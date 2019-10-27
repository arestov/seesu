define(function(require) {
'use strict';
var pv = require('pv');
var pvUpdate = require('pv/update');
var spv = require('spv');
var BrowseMap = require('js/libs/BrowseMap');
var UserAcquaintancesLists = require('./UserAcquaintancesLists');
var SuUsersPlaylists = require('./SuUsersPlaylists');
var user_music_lfm = require('./user_music_lfm');
var user_music_vk = require('./user_music_vk');

var UserCard = spv.inh(BrowseMap.Model, {
  init: function(target) {
    //плейлисты
    var gena = target.getSPI('playlists', true);
    var hasPlaylistCheck = function(items) {
      pvUpdate(target, 'has_playlists', !!items.length);
    };
    hasPlaylistCheck(target.app.gena.playlists);
    target.app.gena.on('playlists-change', hasPlaylistCheck);
  }
}, {
  "+states": {
    "can_expand": [
      "compx",
      ['^can_expand', 'for_current_user'],
      function(can_expand, for_current_user) {
        return for_current_user && can_expand;
      }
    ]
  },

  model_name: 'usercard',

  sub_page: {
    // 'vk:tracks': {
    // 	constr: user_music_vk.VkUserTracks,
    // 	title: [
    // 		['#locales.%site% tracks'],
    // 		function(state) {
    // 			return state && state.replace('%site%', 'vk.com');
    // 		}
    // 	]
    // },
    'vk:friends': {
      constr: user_music_vk.VKFriendsList,
      title: [
        ['#locales.%site% friends'],
        function(state) {
          return state && state.replace('%site%', 'vk.com');
        }
      ]
    },
    'playlists': [SuUsersPlaylists, [['#locales.playlists']]],
    'acquaintances':{
      constr: UserAcquaintancesLists,
      title: [['#locales.Acquaintances']]
    },
    'lfm:friends': {
      constr: user_music_lfm.LfmFriendsList,
      title: [
        ['#locales.%site% friends'],
        function(state) {
          return state && state.replace('%site%', 'last.fm');
        }
      ]
    },
    'lfm:neighbours':{
      constr: user_music_lfm.LfmNeighboursList,
      title: [['#locales.Neighbours']]
    },
    'lfm:artists':{
      constr: user_music_lfm.LfmUserArtists.LfmUserArtistsForCU,
      title: [['#locales.Artists']]
    },
    'lfm:tracks':{
      constr: user_music_lfm.LfmUserTracks,
      title: [['#locales.Tracks']]
    },
    'lfm:tags':{
      constr: user_music_lfm.LfmUserTags,
      title: [['#locales.Tags']]
    },
    'lfm:albums':{
      constr: user_music_lfm.LfmUserAlbums,
      title: [['#locales.Albums']]
    }
  },

  nest: (function() {
    var result = {
      'user-playlists': ['playlists'],
      'users_acqutes': ['acquaintances'],
      'preload_list': [['vk:friends', 'lfm:tags', 'lfm:friends', 'lfm:neighbours'], {
        preload_on: 'mp_has_focus',
      }]
    };


    var networks_pages = ['vk:friends', 'lfm:friends', 'lfm:neighbours', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
    for (var i = 0; i < networks_pages.length; i++) {
      var cur = networks_pages[i];
      result[cur.replace(':', '__')] = [cur];
    }

    return result;
  })()
});
var VkUserCard = spv.inh(BrowseMap.Model, {}, {
  "+effects": {
    "consume": {
      0: {
        type: "state_request",
        states: ['first_name', 'last_name', 'photo', 'ava_image', 'selected_image'],

        parse: {
          source: 'response.0',
          props_map: {

            first_name: 'first_name',
            last_name: 'last_name',
            photo: 'photo',
            'ava_image.url': 'photo_medium',
            'selected_image.url': 'photo'
          }
        },

        api: '#vktapi',

        fn: [['vk_userid'], function(api, opts, vk_userid) {
          return api.get('users.get', {
            user_ids: [vk_userid],
            fields: ['id', 'first_name', 'last_name', 'sex', 'photo', 'photo_medium', 'photo_big'].join(',')
          });
        }]
      }
    }
  },

  "+states": {
    "big_desc": [
      "compx",
      ['first_name', 'last_name'],
      function(first_name, last_name){
        return [first_name, last_name].join(' ');
      }
    ],

    "p_nav_title": [
      "compx",
      ['vk_userid'],
      function(vk_userid) {
        return 'Vk.com user: ' + vk_userid;
      }
    ],

    "nav_title": [
      "compx",
      ['big_desc', 'p_nav_title'],
      function(big_desc, p_nav_title){
        return big_desc || p_nav_title;
      }
    ]
  },

  model_name: 'vk_usercard',

  sub_page: {
    // 'tracks': {
    // 	constr: user_music_vk.VkUserTracks,
    // 	title: [['#locales.Tracks']]
    // },
    'friends': {
      constr: user_music_vk.VKFriendsList,
      title: [['#locales.Friends']]
    }
  },

  nest: (function() {
    var result = {};

    var networks_pages = ['friends'];
    for (var i = 0; i < networks_pages.length; i++) {
      var cur = networks_pages[i];
      result[ 'vk__' + cur ] = [cur];
    }

    return result;

  })(),


  'stch-mp_has_focus': function(target, state) {
    if (state){

      target.requestState('first_name', 'last_name', 'photo', 'ava_image');


      var list_to_preload = [
        target.getNesting('vk__friends')

      ];
      for (var i = 0; i < list_to_preload.length; i++) {
        var cur = list_to_preload[i];
        if (cur){
          cur.preloadStart();
        }
      }
    }
  }
});

var LfmUserCard = spv.inh(BrowseMap.Model, {}, {
  "+effects": {
    "consume": {
      0: {
        type: "state_request",
        states: ['userid', 'realname', 'country', 'age', 'gender', 'playcount', 'playlists', 'lfm_img', 'registered', 'scrobblesource', 'recenttrack'],

        parse: {
          source: 'user',
          props_map: {
            userid: 'name',
            realname: null,
            country: null,
            age: ['num', 'age'],
            gender: null,
            playcount: ['num', 'playcount'],
            playlists: ['num', 'playlists'],
            lfm_img: ['lfm_image', 'image'],
            registered: ['timestamp', 'registered'],
            scrobblesource: null,
            recenttrack: null
          }
        },

        api: '#lfm',

        fn: [['lfm_userid'], function(api, opts, lfm_userid) {
          return api.get('user.getInfo', {'user': lfm_userid});
        }]
      }
    }
  },

  "+states": {
    "nav_title": ["compx", ['lfm_userid']],

    "big_desc": [
      "compx",
      ['realname', 'age', 'gender', 'country'],
      function(realname, age, gender, country)  {
        var big_desc = [];
        var bide_items = [realname, age, gender, country];
        for (var i = 0; i < bide_items.length; i++) {
          if (bide_items[i]){
            big_desc.push(bide_items[i]);
          }
        }
        return big_desc.join(', ');
      }
    ]
  },

  model_name: 'lfm_usercard',

  nest: (function() {
    var result = {};
    var networks_pages = ['friends', 'neighbours', 'artists', 'tracks', 'tags', 'albums'];
    for (var i = 0; i < networks_pages.length; i++) {
      var cur = networks_pages[i];
      result[ 'lfm__' + cur ] = [cur];
    }

    return result;
  })(),

  sub_page: {
    'friends': {
      constr: user_music_lfm.LfmFriendsList,
      title: [['#locales.Friends']]
    },
    'neighbours':{
      constr: user_music_lfm.LfmNeighboursList,
      title: [['#locales.Neighbours']]
    },
    'artists':{
      constr: user_music_lfm.LfmUserArtists,
      title: [['#locales.Artists']]
    },
    'tracks':{
      constr: user_music_lfm.LfmUserTracks,
      title: [['#locales.Tracks']]
    },
    'tags':{
      constr: user_music_lfm.LfmUserTags,
      title: [['#locales.Tags']]
    },
    'albums':{
      constr: user_music_lfm.LfmUserAlbums,
      title: [['#locales.Albums']]
    }
  },


  'stch-mp_has_focus': function(target, state) {
    if (state){
      target.requestState('realname', 'country', 'age', 'gender');
      var list_to_preload = [
        target.getNesting('lfm__tags'),
        target.getNesting('lfm__friends'),
        target.getNesting('lfm__neighbours')

      ];
      for (var i = 0; i < list_to_preload.length; i++) {
        var cur = list_to_preload[i];
        if (cur){
          cur.preloadStart();
        }
      }
    }
  }
});
UserCard.LfmUserCard = LfmUserCard;
UserCard.VkUserCard = VkUserCard;

return UserCard;
});
