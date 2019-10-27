define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var app_serv = require('app_serv');
var morph_helpers = require('js/libs/morph_helpers');
var user_music_lfm = require('./user_music_lfm');
var LoadableListBase = require('pv/LoadableList');
var SongsList = require('./SongsList');
var SeesuListening = require('./SeesuListening');

var complexEach = app_serv.complexEach;

var pvUpdate = require('pv/update');
var sortByGif = spv.getSortFunc([{
    field: function(item) {
      var image = item.state('lfm_img');
      image = image && (image.lfm_id || image.url);
      if (image && image.search(/gif$/) == -1){
        return 1;
      } else if (!image) {
        return 2;
      } else {
        return 3;
      }
    }
  }
]);

var SongFansList = spv.inh(user_music_lfm.LfmUsersList, {}, {
  getRqData: function() {
    return {
      artist: this.state('artist_name'),
      track: this.state('track_name')
    };
  },
  // 'nest_req-list_items': [
  // 	declr_parsers.lfm.getUsers('topfans', true),
  // 	['#lfm', 'get', function() {
  // 		return ['track.getTopFans', this.getRqData()];
  // 	}]
  // ],
  beforeReportChange: function(list) {
    list.sort(sortByGif);
    return list;
  }
});

var parseVKPostSong = spv.mmap({
  props_map: {
    artist: 'artist',
    track: 'title',
    // side_file: {
    // 	artist: 'artist',
    // 	track: 'title',
    // 	from: ['vk'],
    // 	_id: [function (cursor) {
    //     return cursor.owner_id + '_' + cursor.id;
    // 	}, '^'],
    // 	media_type: ['mp3'],
    // 	duration: ['seconds', 'duration'],
    // 	link: 'url'
    // }
  }
}, morph_helpers);


var VKPostSongs = spv.inh(SongsList, {
  init: function(target, opts, data) {
    target.initStates(data);

    target.app.watchVKCharacter( target, (data.post_type == 'reply' ? data.from_id : data.owner_id), 'owner_info' );
    if (data.owner_id != data.from_id) {
      target.app.watchVKCharacter(target, data.from_id, 'author_info');
    }
    /*
    date
    */
      //получить информацию о разместившем пользователе
      //получить информацию об авторе
      //дата публикации
  }
}, {
  "+states": {
    "date_desc": [
      "compx",
      ['date'],
      function(date) {
        return date && (new Date(date)).toLocaleString();
      }
    ]
  },

  manual_states_init: true,
  network_data_as_states: false
});


var sortByTypeAndDate = spv.getSortFunc([{
  field: function(obj) {
    return obj.owner_id > 0;
  },
  reverse: true
}, {
  field: 'date'
}]);


var VKPostsList = spv.inh(LoadableListBase, {
  init: function(target) {
    target.on('child_change-lists_list', function(e) {
      var sorted = e.value && e.value.slice().sort(sortByTypeAndDate);
      pv.updateNesting(target, 'sorted_list', sorted);
    });
  }
}, {
  "+effects": {
    "consume": {
      "lists_list": {
        type: "nest_request",

        parse: [{
          is_array: true,
          source: "response.items",

          props_map: {
            props: {
              nav_title: "owner_id",
              url_part: ["urlp", "owner_id"],
              from_id: "from_id",
              owner_id: "owner_id",
              date: ["timestamp", "date"],
              post_type: "post_type",
              text_body: "text",
              likes: "likes.count",
              reposts: "reposts.count",

              photos: [function(array) {
                if (!array) {
                  return;
                }
                var photos = [];
                for (var i = 0; i < array.length; i++) {
                  var cur = array[i];

                  if (cur.type == "photo") {
                    photos.push(cur.photo);
                  }
                }
                return photos;
              }, "attachments"]
            },

            attachments: [function(array) {
              if (!array) {
                return;
              }
              var songs = [];

              for (var i = 0; i < array.length; i++) {
                var cur = array[i];
                if (cur.type == "audio") {
                  songs.push(parseVKPostSong(cur.audio));
                }
              }
              return {
                songs: songs
              };
            }, "attachments"]
          }
        }, //support paging
        true, [//side data
        ["vk_users", function(r) {
          return r.response.profiles;
        }], ["vk_groups", function(r) {
          return r.response.groups;
        }]]],

        api: "#vktapi",

        fn: [
          ["artist_name", "track_name"],
          function(api, opts, artist_name, track_name) {
            return api.get("newsfeed.search", {
              q: artist_name + " " + track_name + " has:audio",
              extended: 1
            }, null);
          }
        ]
      }
    }
  },

  "+states": {
    "image_previews": [
      "compx",
      ['@owner_info:sorted_list'],
      function (array) {
        if (!array) {return;}
        var result = [];
        for (var i = 0; i < array.length; i++) {
          var cur= array[i];
          if (!cur) {
            continue;
          }

          result.push(cur.photo_medium_rec || cur.photo_50);
        }

        return spv.collapseAll(result);
      }
    ]
  },

  model_name: 'vk_posts',

  //splitItemData: ,

  'nest_rqc-lists_list': VKPostSongs,

  'nest_rq_split-lists_list': function(data, source_name) {
    return [data.props, {
      subitems: {
        'songs-list': spv.getTargetField(data, 'attachments.songs')
      },

      subitems_source_name: {
        'songs-list': source_name
      }
    }];
  },


});
var isDepend = pv.utils.isDepend;

var SongCard = spv.inh(LoadableListBase, {}, {
  "+effects": {
    "consume": {
      "listenings": {
        type: "nest_request",

        parse: [function(resp) {
          if (!resp || !resp.done) {
            return;
          }

          var listeners_raw = resp.done;

          return complexEach([listeners_raw[1], listeners_raw[2]], function(result, girl, boy) {
            if (girl) {
              result.push(girl);
            }
            if (boy) {
              result.push(boy);
            }

            return result;
          });
        }, false, [["su_users", function(resp) {
          var girls = resp.done && resp.done[1];
          var boys = resp.done && resp.done[2];
          var arr = [];

          if (girls) {
            arr = arr.concat(girls);
          }

          if (boys) {
            arr = arr.concat(boys);
          }

          for (var i = 0; i < arr.length; i++) {
            var info = arr[i].info;
            info.user = arr[i].user;
            arr[i] = info;
          }
          return arr;
        }]]],

        api: "#sus",

        fn: [["artist_name", "track_name"], function(api, artist_name, track_name) {
          return api.api("track.getListeners", {
            artist: artist_name,
            title: track_name
          });
        }]
      }
    }
  },

  "+states": {
    "nav_title": [
      "compx",
      ['artist_name', 'track_name'],
      function(artist_name, track_name) {
        return artist_name + ' - ' + track_name;
      }
    ],

    "nest_need": [
      "compx",
      ['need_for_song', 'songcard-for-active_song'],
      function(need_for_song, for_asong) {
        return need_for_song || isDepend(for_asong);
      }
    ],

    "wide_need": [
      "compx",
      ['nest_need', 'mp_has_focus'],
      function(nest_need, mp_has_focus) {
        return mp_has_focus || nest_need;
      }
    ],

    "load_listeners": [
      "compx",
      ['wide_need', 'artist_name', 'track_name'],
      function(wide_need, artist_name, track_name) {
        return wide_need && artist_name && track_name && {
          artist_name: artist_name,
          track_name: track_name
        };
      }
    ],

    "vswitched_select": ["compx", ['vswitched']],

    "current_su_user_info": [
      "compx",
      ['#current_su_user_info']
    ]
  },

  model_name: 'songcard',

  'stch-load_listeners': function(target, state) {
    if (state) {
      target.requestMoreData('listenings');
    }
  },

  'stch-vswitched_select': function(target, state) {
    pv.updateNesting(target, 'selected', state && pv.getModelById(target, state));
  },

  'nest_rqc-listenings': SeesuListening,
  'nest-fans': ['fans'],

  'nest-vk_posts': ['vk_posts', {
    preload_on: 'nest_need',
    idle_until: 'nest_need',
  }],

  'nest-artist': ['#catalog/[:artist_name]', {
    idle_until: 'mp_has_focus',
  }],

  sub_page: {
    'fans':{
      constr: SongFansList,
      title: [['#locales.Top fans']]
    },
    'vk_posts': {
      constr: VKPostsList,
      title: [null, 'Posts from vk.com']
    }
  }
});
return SongCard;
});
