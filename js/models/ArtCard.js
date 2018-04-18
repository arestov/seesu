define(function(require) {
'use strict';
var spv = require('spv');

var pv = require('pv');

var app_serv = require('app_serv');

var BrowseMap = require('js/libs/BrowseMap');

var LoadableList = require('./LoadableList');

var SongsList = require('./SongsList');

var Mp3Search = require('js/models/Mp3Search/index');

var getImageWrap = require('js/libs/helpers/getLFMImageWrap')

var declr_parsers = require('js/modules/declr_parsers');

var Song = require('./Song');
var ArtCard;
var pvUpdate = require('pv/update');

var ArtistAlbumSongs = spv.inh(SongsList, {
  init: function(target, opts, params) {
    target.playlist_artist = target.album_artist = params.album_artist;
    target.album_name = params.album_name;
    target.original_artist = params.original_artist;

    target.updateManyStates({
      'album_artist': target.playlist_artist,
      'album_name': target.album_name,
      'original_artist': target.original_artist,
      'nav_title': '(' + params.album_artist + ') ' + params.album_name,
      'url_part': '/' + target.getAlbumURL()
    });

    target.playlist_type = 'album';
    if (params.lfm_image){

      pvUpdate(target, 'lfm_image', getImageWrap(params.lfm_image.array));
    }
    if (params.lfm_img) {
      pvUpdate(target, 'lfm_img', params.lfm_img);
    }
  }
}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",

        parse: [{
          is_array: true,
          source: "album.tracks.track",

          props_map: {
            artist: "artist.name",
            track: "name",
            album_image: ["lfm_image", "^album.image"],
            album_name: "^album.name"
          }
        }],

        api: "#lfm",

        fn: [
          ["album_artist", "album_name"],
          function(api, opts, album_artist, album_name) {
            return api.get("album.getInfo", {
              "artist": album_artist,
              album: album_name
            }, opts);
          }
        ]
      }
    }
  },

  "+states": {
    "can_hide_artist_name": [
      "compx",
      ['album_artist', 'original_artist'],
      function(alb_artist, orgn_artist) {
        return alb_artist == orgn_artist;
      }
    ],

    "selected_image": [
      "compx",
      ['lfm_img', 'lfm_image', 'profile_image'],
      function(lfm_img, lfmi_wrap, pi_wrap) {
        return pi_wrap || lfm_img || lfmi_wrap;
      }
    ]
  },

  network_data_as_states: false,

  getURLPart: function(params, app){
    if (params.album_artist == params.original_artist){
      return app.encodeURLPart(params.album_name);
    } else {
      return app.encodeURLPart(params.album_artist) + ',' + app.encodeURLPart(params.album_name);
    }
  },

  getAlbumURL: function() {
    return this.getURLPart({
      original_artist: this.original_artist,
      album_artist: this.playlist_artist,
      album_name: this.album_name
    }, this.app);
  },


});
var ArtistTagsList = spv.inh(LoadableList.TagsList, {}, {
  "+effects": {
    "consume": {
      "tags_list": {
        type: "nest_request",

        parse: [{
          is_array: true,
          source: "toptags.tag",

          props_map: {
            count: null,
            name: null
          }
        }],

        api: "#lfm",

        fn: [["artist_name"], function(api, opts, artist_name) {
          return api.get("artist.getTopTags", {
            artist: artist_name
          }, opts);
        }]
      }
    }
  },

  "+states": {
    // init: function(opts, params) {
    // 	this._super.apply(this, arguments);
    // 	this.artist_name = params.artist;
    // },
    "preview_loading": [
      "compx",
      ['^tags_list__loading'],
      function(state) {
        return state;
      }
    ],

    "preview_list": [
      "compx",
      ['^tags_list'],
      function(state) {
        return state;
      }
    ]
  },


});

var AlbumsList = spv.inh(LoadableList, {}, {
  model_name: 'albslist',
  main_list_name: 'albums_list',
  'nest_rqc-albums_list': ArtistAlbumSongs,
  items_comparing_props: [
    ['album_artist', 'album_artist'],
    ['album_name', 'album_name'],
    ['original_artist', 'original_artist']]
});

var DiscogsAlbumSongs = spv.inh(SongsList, {
  init: function(target, opts, params) {
    target.playlist_artist = target.album_artist = params.artist;
    target.album_name = params.title;
    target.album_id = params.id;

    target.release_type = params.type;

    //this.original_artist = params.original_artist;

    var image_url = params.thumb && params.thumb.replace('api.discogs.com', 's.pixogs.com').replace('s.pixogs.com/images/', 's.pixogs.com/image/');


    target.updateManyStates({
      'release_type': params.type,
      'album_id': target.album_id,
      'album_artist': target.playlist_artist,
      'album_name': target.album_name,
      'album_year': params.year,
    //	'original_artist': target.original_artist,
      'image_url': image_url && {url: image_url},
      'nav_title': '(' + target.album_artist + ') ' + target.album_name,
      'url_part': '/' + target.album_id
    });
  }
}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",

        parse: [function(r) {
          var _this = this;
          var compileArtistsArray = function(array) {
            var result = "";
            if (!array) {
              return result;
            }
            for (var i = 0; i < array.length; i++) {
              var cur = array[i];
              var prev = array[i - 1];
              if (prev && prev.join) {
                result += " " + prev.join + " ";
              }
              result += cur.name || "";
            }
            return result;
          };

          var tracks = spv.toRealArray(spv.getTargetField(r, "tracklist"));
          var track_list = [];
          var release_artist = compileArtistsArray(r.artists);
          var image_url = _this.state("image_url");
          image_url = image_url && image_url.url;
          //var imgs = spv.getTargetField(r, 'album.image');
          for (var i = 0; i < tracks.length; i++) {
            var cur = tracks[i];
            var song_obj = {
              artist: compileArtistsArray(cur.artists) || release_artist,
              track: cur.title,

              album_image: image_url && {
                url: image_url
              },

              album_name: _this.album_name
            };
            track_list.push(song_obj);
          }
          return track_list;
        }],

        api: "#discogs",

        fn: [
          ["release_type", "album_id"],
          function(api, opts, release_type, album_id) {
            var discogs_url;
            if (release_type == "master") {
              discogs_url = "/masters/";
            } else {
              discogs_url = "/releases/";
            }
            return api.get(discogs_url + album_id, {});
          }
        ]
      }
    }
  },

  "+states": {
    "can_hide_artist_name": [
      "compx",
      ['album_artist', 'original_artist'],
      function(alb_artist, orgn_artist) {
        return alb_artist == orgn_artist;
      }
    ],

    "selected_image": [
      "compx",
      ['lfm_image', 'profile_image', 'image_url'],
      function(lfmi_wrap, pi_wrap, image_url) {
        return pi_wrap || lfmi_wrap || image_url;
      }
    ]
  },

  getAlbumURL: function() {
    return '';
  },


});

var DiscogsAlbums = spv.inh(AlbumsList, {}, {
  "+effects": {
    "consume": {
      "albums_list": {
        type: "nest_request",

        parse: [function(r) {
          return spv.toRealArray(spv.getTargetField(r, "releases"));
        }, {
          source: "pagination",

          props_map: {
            page_num: ["num", "page"],
            items_per_page: ["num", "per_page"],
            total_pages_num: ["num", "pages"],
            total: ["num", "items"]
          }
        }],

        api: "#discogs",

        fn: [["artist_id"], function(api, opts, artist_id) {
          return api.get("/artists/" + artist_id + "/releases", null);
        }]
      }
    },
    "produce": {
      'should_load': {
        trigger: 'should_load',
        api: 'self',
        require: ["should_load"],

        fn: function(self, value) {
          if (value) {
            self.preloadStart();
          }
        }
      }
    },
  },

  "+states": {
    "should_load": [
      "compx",
      ['^mp_has_focus', 'mp_show', 'artist_id'],
      function(pfocus, mp_show, artist_id) {
        return artist_id && (mp_show || pfocus);
      }
    ],

    "possible_loader_disallowing": [
      "compx",
      ['#locales.no-dgs-id']
    ],

    "profile_searching": [
      "compx",
      ['^discogs_id__loading']
    ],

    "artist_id": ["compx", ['^discogs_id']],

    "loader_disallowing_desc": [
      "compx",
      ['profile_searching', 'loader_disallowed', 'possible_loader_disallowing'],
      function(searching, disallowed, desc) {
        if (disallowed && !searching){
          return desc;
        }
      }
    ],

    "loader_disallowed": [
      "compx",
      ['artist_id'],
      function(artist_id) {
        return !artist_id;
      }
    ]
  },

  page_limit: 50,
  manual_previews: false,
  'nest_rqc-albums_list': DiscogsAlbumSongs,

});

var ArtistAlbums = spv.inh(AlbumsList, {}, {
  "+effects": {
    "consume": {
      "albums_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getAlbums("topalbums"),
        api: "#lfm",

        fn: [["artist_name"], function(api, opts, artist_name) {
          return api.get("artist.getTopAlbums", {
            artist: artist_name
          }, opts);
        }]
      }
    }
  },

  page_limit: 50,
  getSPC: true,

  subPager: function(pstr, string) {
    var parts = this.app.getCommaParts(string);
    var artist = parts[1] ? parts[0] : this.head.artist_name;

    return this.findMustBePresentDataItem({
      original_artist: this.head.artist_name,
      album_artist: artist,
      album_name: parts[1] ? parts[1] : parts[0]
    });
  }
});




var HypemArtistSeFreshSongs = spv.inh(SongsList.HypemPlaylist, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.hypem.tracks,
        api: "#hypem",

        fn: [
          ["send_params", "artist_name"],
          function(api, opts, send_params, artist_name) {
            var path = "/playlist/search/" + artist_name + "/json/" + opts.paging.next_page + "/data.js";
            return api.get(path, send_params);
          }
        ]
      }
    }
  },

  '+states': {
    'send_params': ['compx', [], function() {return {

    }}]
  },


});
var HypemArtistSeUFavSongs = spv.inh(SongsList.HypemPlaylist, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.hypem.tracks,
        api: "#hypem",

        fn: [
          ["send_params", "artist_name"],
          function(api, opts, send_params, artist_name) {
            var path = "/playlist/search/" + artist_name + "/json/" + opts.paging.next_page + "/data.js";
            return api.get(path, send_params);
          }
        ]
      }
    }
  },

  '+states': {
    'send_params': ['compx', [], function() {return {
      sortby:'favorite'
    }}]
  },


});
var HypemArtistSeBlogged = spv.inh(SongsList.HypemPlaylist, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.hypem.tracks,
        api: "#hypem",

        fn: [
          ["send_params", "artist_name"],
          function(api, opts, send_params, artist_name) {
            var path = "/playlist/search/" + artist_name + "/json/" + opts.paging.next_page + "/data.js";
            return api.get(path, send_params);
          }
        ]
      }
    }
  },

  '+states': {
    'send_params': ['compx', [], function() {return {
      sortby:'blogged'
    }}]
  },


});



var SoundcloudArtcardSongs = spv.inh(SongsList, {}, {
  "+states": {
    "profile_searching": [
      "compx",
      ['^sc_profile__loading']
    ],

    "artist_id": [
      "compx",
      ['^soundcloud_profile']
    ],

    "id_searching": [
      "compx",
      ['profile_searching'],
      function(profile_searching) {
        return profile_searching;
      }
    ],

    "possible_loader_disallowing": [
      "compx",
      ['^no_soundcloud_profile', 'artist_id', '^soundcloud_profile', '#locales.no-soundcloud-profile', '#locales.Sc-profile-not-found'],
      function(no_soundcloud_profile, artist_id, profile, desc_no_preofile, desc_not_found) {
        if (no_soundcloud_profile) {
          return desc_no_preofile;
        }
        if (!artist_id) {
          return desc_not_found;
        }
      }
    ],

    "loader_disallowing_desc": [
      "compx",
      ['profile_searching', 'loader_disallowed', 'possible_loader_disallowing'],
      function(searching, disallowed, desc) {
        if (disallowed && !searching){
          return desc;
        }
      }
    ],

    "loader_disallowed": [
      "compx",
      ['artist_id'],
      function(artist_id) {
        return !artist_id;
      }
    ]
  }
});
var SoundcloudArtistLikes = spv.inh(SoundcloudArtcardSongs, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: [declr_parsers.soundcloud.tracksFn, true],
        api: "#sc_api",

        fn: [["artist_id"], function(api, opts, artist_id) {
          return api.get("users/" + artist_id + "/favorites", null);
        }]
      }
    }
  },


});
var SoundcloudArtistSongs = spv.inh(SoundcloudArtcardSongs, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: [declr_parsers.soundcloud.tracksFn, true],
        api: "#sc_api",

        fn: [["artist_id"], function(api, opts, artist_id) {
          return api.get("users/" + artist_id + "/tracks", null);
        }]
      }
    }
  },
  allow_artist_guessing: true
});

var TopArtistSongs = spv.inh(SongsList, {
  init: function(target) {
    target.playlist_artist = target.map_parent.head.artist;
  }
}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getTracks("toptracks"),
        api: "#lfm",

        fn: [["artist_name"], function(api, opts, artist_name) {
          return api.get("artist.getTopTracks", {
            artist: artist_name
          }, opts);
        }]
      }
    }
  },

  playlist_type: 'artist',

});

var FreeArtistTracks = spv.inh(SongsList, {}, {
  "+effects": {
    "consume": {
      "songs-list": {
        type: "nest_request",

        parse: [function(r) {
          var tracks = spv.toRealArray(spv.getTargetField(r, "rss.channel.item"));

          var track_list = [];
          //var files_list = [];
          if (tracks) {
            for (var i = 0; i < tracks.length; i++) {
              var cur = tracks[i];

              var link = spv.getTargetField(cur, "enclosure.url");
              if (link) {
                continue;
              }

              var track_obj = Mp3Search.guessArtist(cur.title, cur["itunes:author"]);
              if (!track_obj.track)
                {}
              if (!track_obj.artist)
                {}

              track_list.push(track_obj);
              //files_list.push(_this.app.createLFMFile(track_obj.artist, track_obj.track, link));
            }
          }
          return track_list;
        }],

        api: "#lfm",

        fn: [["playlist_artist"], function(api, opts, playlist_artist) {
          return api.get("artist.getPodcast", {
            artist: playlist_artist
          }, opts);
        }]
      }
    }
  },


});

var ArtCardBase = spv.inh(BrowseMap.Model, {}, {
  net_head: ['artist_name'],
  "+effects": {
    "consume": {
      0: {
        type: "state_request",
        states: ['soundcloud_matched', 'soundcloud_profile'],

        parse: function (r) {
          var sorted = r && r.sort(function (a, b) {
            return spv.sortByRules(a, b, [{field: 'followers_count', reverse: true}]);
          });

          var matched = sorted && sorted[0];
          return {
            soundcloud_matched: matched && matched.permalink,
            soundcloud_profile: matched && matched.id
          };
        },

        api: '#sc_api',

        fn: [['artist_name'], function(api, opts, artist_name) {
          return api.get('users', {
            q: artist_name
          });
        }]
      },

      1: {
        type: "state_request",
        states: ['profile_image', 'bio', 'listeners', 'playcount', 'similar_artists_list', 'tags_list'],

        parse: function(r) {
          var psai = app_serv.parseArtistInfo(r);
          var profile_image = getImageWrap(spv.getTargetField(r, 'artist.image'));

          //_this.tags_list.setPreview();
          var artists_list;

          if (psai.similars){
            var data_list = [];
            for (var i = 0; i < psai.similars.length; i++) {
              var cur = psai.similars[i];
              data_list.push({
                artist_name: cur.name,
                lfm_image: getImageWrap(cur.image)
              });

            }
            artists_list = data_list;
            //_this.similar_artists.setPreviewList(data_list);
          }

          return [
            profile_image,
            psai.bio,
            spv.getTargetField(r, 'artist.stats.listeners'),
            spv.getTargetField(r, 'artist.stats.playcount'),
            artists_list, psai.tags
          ];
        },

        api: '#lfm',

        fn: [['artist_name'], function(api, opts, artist_name) {
          return api.get('artist.getInfo', {'artist': artist_name}, opts);
        }]
      },

      2: {
        type: "state_request",
        states: ['discogs_id'],

        parse: function(r) {
          var artist_name = this.head.artist_name;
          var simplifyArtistName = function(name) {
            return name.replace(/\([\s\S]*?\)/, '').split(/\s|,/).sort().join('').toLowerCase();
          };

          var artists_list = r && r.results;
          var artist_info;
          var simplified_artist = simplifyArtistName(artist_name);
          for (var i = 0; i < artists_list.length; i++) {
            var cur = artists_list[i];
            if (simplified_artist == simplifyArtistName(cur.title)){
              if (cur.thumb && cur.thumb.indexOf('images/record90') == -1){
                artist_info = {
                  artist_name: cur.title,
                  image_url: cur.thumb,
                  id: cur.id
                };
                break;
              }
            }
          }

          return {
            discogs_id: artist_info && artist_info.id
          };

          // return {
          // 	discogs_id: ''
          // };
          //this.app.discogs.get('/database/search', {q: artist_name, type:"artist"}
        },

        api: '#discogs',

        fn: [['artist_name'], function(api, opts, artist_name) {
          return api.get('/database/search', {q: artist_name, type:"artist" });
        }]
      }
    }
  },

  model_name: 'artcard',
  getURL: function() {
    return '/catalog/' + this.app.encodeURLPart(this.head.artist_name);
  },
  '+states': {
    'nav_title': ['compx', ['artist_name']],

    'selected_image': [
      'compx',
      ['lfm_image', 'lfm_img', 'profile_image'],
      function(lfmi_wrap, lfm_img, pi_wrap) {
        return pi_wrap || lfm_img || lfmi_wrap;
      },
    ],
    'available_images': [
      'compx',
      ['selected_image', 'images'],
      function (selected_image, images) {
        return images || (selected_image && [selected_image]);
      }
    ],
    'ext_exposed': [
      'compx',
      ['init_ext', 'mp_has_focus'],
      function(init_ext, mp_has_focus) {
        return init_ext || mp_has_focus;
      }
    ],
    //soundcloud_nickname
    'no_soundcloud_profile': [
      'compx',
      ['soundcloud_profile__$complete', 'soundcloud_profile'],
      function(two_complete, two) {
        return two_complete && !two;
      }
    ],
  },
  sub_page: {
    '_': {
      constr: TopArtistSongs,
      title:  [['#locales.Top-tracks']]
    },
    'tags': {
      constr: ArtistTagsList,
      title: [['#locales.Tags']]
    },
    'albums': {
      constr: DiscogsAlbums,
      title: [['#locales.Albums from Discogs']]
    },
    'albums_lfm': {
      constr: ArtistAlbums,
      title: [
        ['#locales.Albums of %artist% from last.fm', 'artist_name'],
        function(albums, artist_name) {
          if (!albums) {return artist_name;}
          return albums.replace('%artist%', artist_name);
        }
      ]
    },
    'soundcloud': {
      constr: SoundcloudArtistSongs,
      title: [['#locales.Art-sc-songs']]
    },
    'soundcloud_likes': {
      constr: SoundcloudArtistLikes,
      title: [['#locales.Art-sc-likes']]
    },
    'fresh': {
      constr: HypemArtistSeFreshSongs,
      title: [['#locales.Fresh songs']]
    },
    'most_favorites': {
      constr: HypemArtistSeUFavSongs,
      title: [['#locales.Most Favorites']]
    },
    'blogged': {
      constr: HypemArtistSeBlogged,
      title: [['#locales.Most Reblogged']]
    }
  },
  'nest-tags_list': ['tags', {
    idle_until: 'ext_exposed',
  }],
  'nest-similar_artists': ['+similar', {
    idle_until: 'ext_exposed',
  }],

  'nest-top_songs': ['_', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-dgs_albums': ['albums', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-albums_list': ['albums_lfm', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-soundc_prof': ['soundcloud', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-soundc_likes': ['soundcloud_likes', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-hypem_new': ['fresh', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-hypem_fav': ['most_favorites', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],
  'nest-hypem_reblog': ['blogged', {
    idle_until: 'mp_has_focus',
    preload_on: 'mp_has_focus',
  }],

  getTagsModel: function() {
    return this.getSPI('tags', true);
  },
  getTopTacks: function(track_name) {
    var pl = this.getTopTracks();
    if (!track_name) {
      return pl;
    }

    var start_song = {
      artist: this.head.artist_name,
      track: track_name
    };

    var song = pl.findMustBePresentDataItem(start_song);
    return song;
  },

  getTopTracks: function() {
    if (this.top_songs){
      return this.top_songs;
    }
    var pl = this.getSPI('_', true);
    this.top_songs = pl;
    pv.updateNesting(this, 'top_songs', pl);
    return pl;
  },
});


ArtCard = spv.inh(ArtCardBase, {}, {});

var RandomSong = spv.inh(Song, {}, {
  "+states": {
    "track": [
      "compx",
      ['track_name_provided', 'random_lfm_track_name'],
      function (provied, random) {
        return provied || random;
      }
    ]
  }
});

var ArtistsListPlaylist = spv.inh(SongsList, {}, {
  "+states": {
    // items_comparing_props: [['artist_name', 'artist_name']],
    "has_data_loader": [
      "compx",
      ['^has_data_loader'],
      function(state) {
        return state;
      }
    ]
  },

  'nest_rqc-songs-list': RandomSong,
  page_limit: null,
  items_comparing_props: [['artist', 'artist']],

  requestMoreData: function() {
    var declr = this.map_parent._nest_reqs && this.map_parent._nest_reqs[this.map_parent.main_list_name]
    if (declr) {
      this.requestNesting( declr, this.main_list_name );
    } else {
      this._super();
    }
  },

  getRqData: function() {
    return this.map_parent.getRqData.apply(this.map_parent, arguments);
  }
});


var ArtistsList = spv.inh(LoadableList, {}, {
  model_name: 'artslist',
  main_list_name: 'artists_list',
  createRPlist: function() {
    if (!this.ran_playlist){
      var pl = this.getSPI('~', true);
      this.ran_playlist = pl;
    }
    return this.ran_playlist;
  },
  'sub_page-~': {
    constr: ArtistsListPlaylist,
    title: [['^nav_title']]
  },
  'nest_rqc-artists_list': '#catalog/[:artist]'
});

// var SimilarArtists = function() {};//must be here

var SimilarArtists = spv.inh(ArtistsList, {
  init: function(target) {

    target.lwch(target, 'preview_list', function(value) {
      // results is nesting
      if (value) {
        this.setPreviewList(value);
      }
    });
  }
}, {
  "+effects": {
    "consume": {
      "artists_list": {
        type: "nest_request",
        parse: declr_parsers.lfm.getArtists("similarartists", true),
        api: "#lfm",

        fn: [["artist_name"], function(api, opts, artist_name) {
          return api.get("artist.getSimilar", {
            artist: artist_name,
            limit: opts.paging.page_limit
          }, opts);
        }]
      }
    }
  },

  "+states": {
    // init: function(opts, params) {
    // 	this._super.apply(this, arguments);
    // 	// this.original_artist = params.artist;



    // },
    "preview_loading": [
      "compx",
      ['^similar_artists_list__loading'],
      function(state) {
        return state;
      }
    ],

    "preview_list": [
      "compx",
      ['^similar_artists_list'],
      function(state) {
        return state;
      }
    ]
  },

  page_limit: 100,
  'nest_rqc-more_previews': '#catalog/[:artist_name]',
  setPreviewList: function(raw_array) {
    var preview_base = this.getNesting(this.preview_mlist_name);
    if (preview_base && preview_base.length) {
      return
    }

    var preview_list = this.insertDataAsSubitems(this, 'more_previews', raw_array);


    pv.updateNesting(this, this.preview_mlist_name, preview_list);
  }
});

pv.addSubpage(ArtCardBase.prototype, '+similar', {
  constr: SimilarArtists,
  title: [
    ['#locales.Similar to «%artist%» artists', 'artist_name'],
    function(similar, artist_name) {
      if (!similar) { return artist_name; }

      return similar.replace('%artist%', artist_name);
    }
  ]
});

ArtCard.AlbumsList = AlbumsList;
ArtCard.ArtistsList = ArtistsList;
return ArtCard;
});
