define(function(require) {
'use strict';
var app_serv = require('app_serv');
var BrowseMap = require('js/libs/BrowseMap');
var LoadableList = require('./LoadableList');
var spv = require('spv');
var SongsList = require('./SongsList');
var ArtCard = require('./ArtCard');
var LfmAuth = require('js/LfmAuth');
var declr_parsers = require('js/modules/declr_parsers');
var $ = require('jquery');
var pv = require('pv');

var ArtistsList = ArtCard.ArtistsList;
var AlbumsList = ArtCard.AlbumsList;

var pvUpdate = require('pv/update');
var cloneObj = spv.cloneObj;
//
var UserCardLFMLogin = spv.inh(LfmAuth.LfmLogin, {}, {
  "+states": {
    "access_desc": ["compx", ['^access_desc']],

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
      ['lfm_userid', '#lfm_userid', 'for_current_user'],
      function(lfm_userid, cur_lfm_userid, for_current_user) {
        return (for_current_user ? cur_lfm_userid : lfm_userid) || null;
      }
    ],

    "has_lfm_auth": [
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

  'nest-auth_part': [UserCardLFMLogin, {
    ask_for: 'for_current_user'
  }],

  'stch-has_lfm_auth': function(target, state) {
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

  'stch-lfm_userid': function(target, state) {
    if (state) {
      target.updateNesting('auth_part', null);
    }
  },

  'stch-acess_ready': function(target, state) {
    if (state) {
      target.loadStart();
      target.showOnMap();
    }
  }
};

//LULA - LfmUserLibraryArtist
//непосредственно список композиций артиста, которые слушал пользователь
var LULATracks = spv.inh(SongsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("tracks"),
        api: "#lfm",

        fn: [["userid", "artist_name"], function(lfm, opts, userid, artist_name) {
          return lfm.get("library.getTracks", {
            user: userid,
            artist: artist_name
          });
        }]
      }
    }
  },


}, auth_bh));

var slashPrefix = function(src) {
  return '/' + src;
};

//artist, один артист с треками
var LULA = spv.inh(BrowseMap.Model, {}, pv.mergeBhv({
  "+states": {
    "selected_image": [
      "compx",
      ['lfm_image'],
      function(lfm_i) {
        return lfm_i;
      }
    ]
  },

  model_name: 'lula',

  netdata_as_states: {
    url_part: [slashPrefix, 'artist'],
    nav_title: 'artist',
    artist_name: 'artist',
    playcount: null,
    lfm_image: 'lfm_img'
  },

  net_head: ['artist_name'],

  'nest-all_time': ['all_time', {
    preload_on: 'mp_has_focus',
  }],

  'sub_page-all_time': [LULATracks, [null, 'All Time']]
}, auth_bh));


var UserArtists = spv.inh(LoadableList, {}, {
  "+states": {
    "has_no_access": //check this compx
    ["compx"].concat(no_access_compx)
  },

  model_name: 'lulas',
  main_list_name: 'artists',
  'nest_rqc-artists': LULA
});

// var LULAs = function() {};//artists, список артистов
// UserArtists.extendTo(LULAs, pv.mergeBhv({
// 	'nest_req-artists': [
// 		declr_parsers.lfm.getArtists('artists'),
// 		['#lfm', 'get', function() {
// 			return ['library.getArtists', {
// 				user: userid
// 			}];
// 		}]
// 	]

// }, auth_bh));

var TopLUArt = spv.inh(UserArtists, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "artists": {
        type: "nest_request",
        parse: declr_parsers.lfm.getArtists("topartists"),
        api: "#lfm",

        fn: [["userid", "timeword"], function(lfm, opts, userid, timeword) {
          return lfm.get("user.getTopArtists", {
            user: userid,
            period: timeword
          });
        }]
      }
    }
  },

  'nest_rqc-artists': LULA,

}, auth_bh));

var TopUserTracks = spv.inh(SongsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("toptracks"),
        api: "#lfm",

        fn: [["userid", "timeword"], function(lfm, opts, userid, timeword) {
          return lfm.get("user.getTopTracks", {
            user: userid,
            period: timeword
          });
        }]
      }
    }
  },


}, auth_bh));


var LfmLovedList = spv.inh(SongsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("lovedtracks"),
        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getLovedTracks", {
            user: userid
          });
        }]
      }
    }
  },

  "+states": {
    "access_desc": [
      "compx",
      ['#locales.grant-love-lfm-access']
    ]
  },


}, auth_bh));

var RecommArtList = spv.inh(ArtistsList, {}, pv.mergeBhv({
  "+effects": {
    "api": {
      "last_fm_xml": function() {
        return {
          api_name: "last_fm_xml",
          source_name: "last.fm",

          get: function(url) {
            return $.ajax({
              url: "http://ws.audioscrobbler.com/1.0/" + url,
              type: "GET",
              dataType: "xml"
            });
          },

          errors_fields: []
        };
      }
    },

    "consume": {
      "artists_list": {
        type: "nest_request",

        parse: [function(xml) {
          var data_list = [];
          var artists = $(xml).find("channel item title");
          if (artists && artists.length) {
            for (var i = 0, l = artists.length < 30 ? artists.length : 30; i < l; i++) {
              var artist = $(artists[i]).text();
              data_list.push({
                artist: artist
              });
            }
          }
          return data_list;
        }],

        api: "last_fm_xml",

        fn: [["userid"], function(last_fm_xml, opts, userid) {
          return last_fm_xml.get("user/" + userid + "/systemrecs.rss");
        }]
      }
    }
  },

  "+states": {
    "access_desc": [
      "compx",
      ['#locales.lastfm-reccoms-access']
    ],

    "loader_disallowed": [
      "compx",
      ['loader_disallowed'],
      function() {
        return !app_serv.app_env.cross_domain_allowed;
      }
    ]
  },

  page_limit: 30,

}, auth_bh));

var RecommArtListForCurrentUser = spv.inh(RecommArtList, {}, {
  "+effects": {
    "consume": {
      "artists_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getArtists("recommendations"),
        api: "#lfm",

        fn: [[], function(lfm) {
          return lfm.get("user.getRecommendedArtists", {
            sk: lfm.sk
          });
        }]
      }
    }
  },

  "+states": {
    "loader_disallowed": //check this compx
    ["compx"].concat(null)
  },


});

var user_artists_sp = ['recommended', /*'library',*/ 'top:7day', /* 'top:1month',*/
  'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var timeword_head = {
  timeword: 'name_spaced',
}

var LfmUserArtists = spv.inh(BrowseMap.Model, {}, {
  model_name: 'lfm_listened_artists',
  'nest-lists_list':
    [user_artists_sp],
  'nest-preview_list':
    [user_artists_sp, {
      preload_on: 'mp_has_focus',
    }],
  sub_page: {
    'recommended': {
      constr: RecommArtList,
      title: [
        ['#locales.reccoms-for', 'userid'],
        function(recomms, userid) {
          return recomms && recomms + ' ' + userid;
        }
      ]
    },
    // 'library': {
    // 	constr: LULAs,
    // 	title: 'library'
    // },
    'top:7day': {
      constr: TopLUArt,
      title: [null, 'top of 7day'],
      head: timeword_head
    },
    /*'top:1month':{
      constr: TopLUArt,
      title: 'top of month',
      head: timeword_head,
    },*/
    'top:3month':{
      constr: TopLUArt,
      title: [null, 'top of 3 months'],
      head: timeword_head
    },
    'top:6month':{
      constr: TopLUArt,
      title: [null, 'top of 6 months'],
      head: timeword_head
    },
    'top:12month':{
      constr: TopLUArt,
      title: [null, 'top of 12 months'],
      head: timeword_head
    },
    'top:overall':{
      constr: TopLUArt,
      title: [null, 'overall top'],
      head: timeword_head
    }
    //артисты в библиотеке
    //недельный чарт
    //
    //лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
    //недельные чарты - отрезки по 7 дней
  }
});

LfmUserArtists.LfmUserArtistsForCU = spv.inh(LfmUserArtists, {}, {
  'sub_page-recommended': {
    constr: RecommArtListForCurrentUser,
    title: [['#locales.reccoms-for-you']]
  }
});



var LfmRecentUserTracks = spv.inh(SongsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("recenttracks"),
        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getRecentTracks", {
            user: userid,
            extended: 1,
            to: (new Date() / 1000).toFixed(),
            nowplaying: true
          });
        }]
      }
    }
  },


}, auth_bh));

var user_tracks_sp = [
  'loved', 'recent', 'top:7day', /*'top:1month',*/
  'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserTracks = spv.inh(BrowseMap.Model, {}, {
  model_name: 'lfm_listened_tracks',
  'nest-lists_list':
    [user_tracks_sp],
  'nest-preview_list':
    [user_tracks_sp, {
      preload_on: 'mp_has_focus',
    }],
  sub_page: {
    'loved': {
      constr: LfmLovedList,
      title: [['#locales.loved-tracks']]
    },
    'recent':{
      constr: LfmRecentUserTracks,
      title: [null, "Recently listened"]
    },
    'top:7day': {
      constr: TopUserTracks,
      title: [null, 'top of 7day'],
      head: timeword_head,
    },
    /*'top:1month':{
      constr: TopUserTracks,
      title: 'top of month',
      head: timeword_head,
    },*/
    'top:3month':{
      constr: TopUserTracks,
      title: [null, 'top of 3 months'],
      head: timeword_head,
    },
    'top:6month':{
      constr: TopUserTracks,
      title: [null, 'top of 6 months'],
      head: timeword_head,
    },
    'top:12month':{
      constr: TopUserTracks,
      title: [null, 'top of 12 months'],
      head: timeword_head,
    },
    'top:overall':{
      constr: TopUserTracks,
      title: [null, 'overall top'],
      head: timeword_head,
    }
    //лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
    //недельные чарты - отрезки по 7 дней
  }
});


var UserNewReleases = spv.inh(AlbumsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "albums_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getAlbums("albums"),
        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getNewReleases", {
            user: userid,
            userecs: this.recomms ? 1 : 0
          });
        }]
      }
    }
  },

  "+states": {
    "access_desc": [
      "compx",
      ['#locales.lastfm-reccoms-access']
    ]
  },

  page_limit: 50,

}, auth_bh));

var UserLibNewReleases = spv.inh(UserNewReleases, {}, {});

var RecommNewReleases = spv.inh(UserNewReleases, {}, {
  recomms: true
});


var LfmUserTopAlbums = spv.inh(AlbumsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "albums_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getAlbums("topalbums"),
        api: "#lfm",

        fn: [["userid", "timeword"], function(lfm, opts, userid, timeword) {
          return lfm.get("user.getTopAlbums", {
            user: userid,
            period: timeword
          });
        }]
      }
    }
  },


}, auth_bh));



var user_albums_sp = ['recommended', 'new_releases', 'top:7day', /*'top:1month',*/
    'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserAlbums = spv.inh(BrowseMap.Model, {}, {
  model_name: 'lfm_listened_albums',
  'nest-lists_list':
    [user_albums_sp],
  'nest-preview_list':
    [user_albums_sp, {
      preload_on: 'mp_has_focus',
    }],

  sub_page: {
    'recommended': {
      constr: RecommNewReleases,
      title: [
        ['for_current_user', 'lfm_userid'],
        function(for_current_user, lfm_userid) {
          var base = 'new releases of artists recommended for ';
          return base + (for_current_user ? 'you' : lfm_userid);
        }
      ]
    },
    'new_releases': {
      constr: UserLibNewReleases,
      title: [
        ['for_current_user', 'lfm_userid'],
        function(for_current_user, lfm_userid) {
          var base = 'new releases of artists from %user% library';
          return base.replace('%user%', for_current_user ? 'your' : lfm_userid);
        }
      ]
    },
    'top:7day':{
      constr: LfmUserTopAlbums,
      title: [null, 'Top of 7 days'],
      head: timeword_head,
    },
    /*'top:1month':{
      constr: LfmUserTopAlbums,
      title: 'Top of 1 month',
      head: timeword_head,

    },*/
    'top:3month':{
      constr: LfmUserTopAlbums,
      title: [null, 'Top of 3 months'],
      head: timeword_head,
    },
    'top:6month':{
      constr: LfmUserTopAlbums,
      title: [null, 'Top of 6 months'],
      head: timeword_head,
    },
    'top:12month':{
      constr: LfmUserTopAlbums,
      title: [null, 'Top of 12 months'],
      head: timeword_head,
    },
    'top:overall':{
      constr: LfmUserTopAlbums,
      title: [null, 'Overall top'],
      head: timeword_head,
    }
  }
});



var TaggedSongs = spv.inh(SongsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("taggings.tracks", false, "taggings"),
        api: "#lfm",

        fn: [["userid", "tag_name"], function(lfm, opts, userid, tag_name) {
          return lfm.get("user.getPersonalTags", {
            user: userid,
            taggingtype: "track",
            tag: tag_name
          });
        }]
      }
    }
  },


}, auth_bh));

var TaggedArtists = spv.inh(ArtistsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "artists_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getArtists("taggings.artists", false, "taggings"),
        api: "#lfm",

        fn: [["userid", "tag_name"], function(lfm, opts, userid, tag_name) {
          return lfm.get("user.getPersonalTags", {
            user: userid,
            taggingtype: "artist",
            tag: tag_name
          });
        }]
      }
    }
  },


}, auth_bh));


var TaggedAlbums = spv.inh(AlbumsList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "albums_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getAlbums("taggings.albums", false, "taggings"),
        api: "#lfm",

        fn: [["userid", "tag_name"], function(lfm, opts, userid, tag_name) {
          return lfm.get("user.getPersonalTags", {
            user: userid,
            taggingtype: "album",
            tag: tag_name
          });
        }]
      }
    }
  },

  page_limit: 50,

}, auth_bh));

var user_tag_sp = ['artists', 'tracks', 'albums'];
var UserTag = spv.inh(BrowseMap.Model, {}, {
  model_name: 'lfm_user_tag',
  net_head: ['tag_name'],
  'nest-lists_list':
    [user_tag_sp],
  'nest-preview_list':
    [user_tag_sp, {
      preload_on: 'mp_has_focus',
    }],
  sub_page: {
    'tracks': {
      constr: TaggedSongs,
      title: [null, 'Tracks']
    },
    'artists': {
      constr: TaggedArtists,
      title: [null, 'Artists']
    },
    'albums': {
      constr: TaggedAlbums,
      title: [null, "Albums"]
    }
  }
});

var LfmUserTags = spv.inh(LoadableList, {}, pv.mergeBhv({
  "+effects": {
    "consume": {
      "tags": {
        type: "nest_request",

        parse: [{
          is_array: true,
          source: "toptags.tag",

          props_map: {
            nav_title: "name",
            url_part: "name",
            tag_name: "name",
            count: null
          }
        }],

        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getTopTags", {
            user: userid
          });
        }]
      }
    }
  },

  model_name: 'lfm_listened_tags',
  main_list_name: 'tags',
  page_limit: 3000,
  'nest_rqc-tags': UserTag,

  tagsParser: function(r, field_name) {
    var result = [];
    var array = spv.toRealArray(spv.getTargetField(r, field_name));
    for (var i = 0; i < array.length; i++) {
      result.push({
        tag_name: array[i].name,
        count: array[i].count
      });
    }
    return result;
    //console.log(r);
  }
}, auth_bh));


var LfmUsersList = spv.inh(LoadableList, {}, {
  'nest_rqc-list_items': '#users/lfm:[:userid]',

  main_list_name: 'list_items',
  model_name: 'lfm_users',
  page_limit: 200
});

var LfmUsersListOfUser = spv.inh(LfmUsersList, {}, pv.mergeBhv({}, auth_bh));

var LfmFriendsList = spv.inh(LfmUsersListOfUser, {}, {
  "+effects": {
    "consume": {
      "list_items": {
        type: "nest_request",
        parse: declr_parsers.lfm.getUsers("friends"),
        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getFriends", {
            recenttracks: true,
            user: userid
          });
        }]
      }
    }
  },

  beforeReportChange: function(list) {
    list.sort(function(a,b ){return spv.sortByRules(a, b, [
      {
        field: function(item) {
          switch (item.states.gender) {
            case 'f'://female
              return 1;
            case 'm'://male
              return 2;
            default:
              return 3;
          }
        }
      },
      {
        field: 'states.song_time_raw',
        reverse: true
      }
    ]);});
    return list;
  },


});
var LfmNeighboursList = spv.inh(LfmUsersListOfUser, {}, {
  "+effects": {
    "consume": {
      "list_items": {
        type: "nest_request",
        parse: declr_parsers.lfm.getUsers("neighbours"),
        api: "#lfm",

        fn: [["userid"], function(lfm, opts, userid) {
          return lfm.get("user.getNeighbours", {
            user: userid
          });
        }]
      }
    }
  },


});

return {
  LfmUserArtists:LfmUserArtists,
  LfmUserTracks:LfmUserTracks,
  LfmUserTags:LfmUserTags,
  LfmUserAlbums:LfmUserAlbums,
  LfmUsersList: LfmUsersList,
  LfmFriendsList: LfmFriendsList,
  LfmNeighboursList: LfmNeighboursList
};

});
