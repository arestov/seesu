define(function(require) {
'use strict';
  var spv = require('spv');

  var pv = require('pv');

  var app_serv = require('app_serv');

  var BrowseMap = require('js/libs/BrowseMap');

  var LoadableList = require('./LoadableList');

  var SongsList = require('./SongsList');

  var Mp3Search = require('js/models/Mp3Search/index');

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

      pvUpdate(target, 'lfm_image', target.app.art_images.getImageWrap(params.lfm_image.array));
    }
    if (params.lfm_img) {
      pvUpdate(target, 'lfm_img', params.lfm_img);
    }
  }
}, {
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

  'nest_req-songs-list': [
    [
      {
        is_array: true,
        source: 'album.tracks.track',
        props_map: {
          artist: 'artist.name',
          track: 'name',
          album_image: ['lfm_image', '^album.image'],
          album_name: '^album.name'
        }
      }
    ],
    ['#lfm', 'get', function() {
      return ['album.getInfo', {'artist': this.playlist_artist, album : this.album_name}];
    }]
  ]
});
var ArtistTagsList = spv.inh(LoadableList.TagsList, {}, {
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

  'nest_req-tags_list': [
    [{
      is_array: true,
      source: 'toptags.tag',
      props_map: {
        count: null,
        name: null
      }
    }],
    ['#lfm', 'get', function() {
      return ['artist.getTopTags', {
        artist: this.head.artist_name
      }];
    }]
  ]
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

  'nest_req-songs-list': [
    [function(r) {
      var _this = this;
      var compileArtistsArray = function(array) {
        var result = '';
        if (!array){
          return result;
        }
        for (var i = 0; i < array.length; i++) {
          var cur = array[i];
          var prev = array[i-1];
          if (prev && prev.join){
            result += (" " + prev.join + " ");
          }
          result += (cur.name || '');
        }
        return result;
      };

      var tracks = spv.toRealArray(spv.getTargetField(r, 'tracklist'));
      var track_list = [];
      var release_artist = compileArtistsArray(r.artists);
      var image_url = _this.state('image_url');
      image_url = image_url && image_url.url;
      //var imgs = spv.getTargetField(r, 'album.image');
      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        var song_obj = {
          artist: compileArtistsArray(cur.artists) || release_artist,
          track: cur.title,
          album_image: image_url && {url: image_url},
          album_name: _this.album_name
        };
        track_list.push(song_obj);
      }
      return track_list;

    }],
    ['#discogs', 'get', function() {
      var discogs_url;
      if (this.release_type == 'master'){
        discogs_url = '/masters/';
      } else {
        discogs_url = '/releases/';
      }

      return [discogs_url + this.album_id,{}];
    }]
  ]
});

var DiscogsAlbums = spv.inh(AlbumsList, {}, {
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

  'stch-should_load': function(target, state) {
    if (state) {
      target.preloadStart();
    }
  },

  'stch-mp_show': function(target, state) {
    if (state) {
      // target.map_parent.requestState('discogs_id');
    }
  },

  page_limit: 50,
  manual_previews: false,
  'nest_rqc-albums_list': DiscogsAlbumSongs,

  'nest_req-albums_list': [
    [function(r) {
      return spv.toRealArray(spv.getTargetField(r, 'releases'));
    }, {
      source: 'pagination',
      props_map: {
        page_num: ['num', 'page'],
        items_per_page: ['num', 'per_page'],
        total_pages_num: ['num', 'pages'],
        total: ['num', 'items']
      }
    }],
    ['#discogs', 'get', function() {
      var artist_id = this.state('artist_id');
      return ['/artists/' + artist_id + '/releases', null];
    }]
  ]
});

var ArtistAlbums = spv.inh(AlbumsList, {}, {
  page_limit: 50,
  'nest_req-albums_list': [
    declr_parsers.lfm.getAlbums('topalbums'),
    ['#lfm', 'get', function() {
      return ['artist.getTopAlbums', {
        artist: this.head.artist_name
      }];
    }]
  ],
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
  send_params: {},
  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
      return [path, this.send_params];
    }]
  ]
});
var HypemArtistSeUFavSongs = spv.inh(SongsList.HypemPlaylist, {}, {

  send_params: {
    sortby:'favorite'
  },
  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
      return [path, this.send_params];
    }]
  ]
});
var HypemArtistSeBlogged = spv.inh(SongsList.HypemPlaylist, {}, {
  send_params: {
    sortby:'blogged'
  },
  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/search/' + this.head.artist_name + '/json/' + opts.paging.next_page +'/data.js';
      return [path, this.send_params];
    }]
  ]
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
  'nest_req-songs-list': [
    [declr_parsers.soundcloud.tracksFn, true],
    ['#sc_api', 'get', function() {
      var artist_id = this.state('artist_id');
      return ['users/' + artist_id + '/favorites', null];
    }]

  ]
});
var SoundcloudArtistSongs = spv.inh(SoundcloudArtcardSongs, {}, {
  'nest_req-songs-list': [
    [declr_parsers.soundcloud.tracksFn, true],
    ['#sc_api', 'get', function() {
      var artist_id = this.state('artist_id');
      return ['users/' + artist_id + '/tracks', null];
    }]

  ],
  allow_artist_guessing: true
});

var TopArtistSongs = spv.inh(SongsList, {
  init: function(target) {
    target.playlist_artist = target.map_parent.head.artist;
  }
}, {
  playlist_type: 'artist',
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('toptracks'),
    ['#lfm', 'get', function() {
        return ['artist.getTopTracks', {
        artist: this.head.artist_name
      }];
    }]
  ]
});

var FreeArtistTracks = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    [
      function(r) {
        var tracks = spv.toRealArray(spv.getTargetField(r, 'rss.channel.item'));

        var track_list = [];
        //var files_list = [];
        if (tracks) {

          for (var i = 0; i < tracks.length; i++) {
            var cur = tracks[i];

            var link = spv.getTargetField(cur, 'enclosure.url');
            if (link){
              continue;
            }

            var track_obj = Mp3Search.guessArtist(cur.title, cur['itunes:author']);
            if (!track_obj.track){
              //continue;
            }
            if (!track_obj.artist){
              //track_obj.artist = artist_name;
            }

            track_list.push(track_obj);
            //files_list.push(_this.app.createLFMFile(track_obj.artist, track_obj.track, link));

          }

        }
        return track_list;
      }
    ],
    ['#lfm', 'get', function() {
      return ['artist.getPodcast', {artist: this.playlist_artist}];
    }]
  ]
});

var ArtCardBase = spv.inh(BrowseMap.Model, {}, {
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

  req_map: [
    [
      ['soundcloud_matched', 'soundcloud_profile'],
      function (r) {
        var sorted = r && r.sort(function (a, b) {
          return spv.sortByRules(a, b, [{field: 'followers_count', reverse: true}]);
        });

        var matched = sorted && sorted[0];
        return {
          soundcloud_matched: matched && matched.permalink,
          soundcloud_profile: matched && matched.id
        };
      },
      ['#sc_api', 'get', function() {
        return ['users', {
          q: this.head.artist_name
        }];
      }]
    ],

    // 	['soundcloud_profile'],
    // 	function(r) {
    // 		var soundcloud_profile;
    // 		if (r.location){
    // 			var matched = r.location.match(/users\/(\d+)/);
    // 			var artist_scid = matched[1];
    // 			if (artist_scid){
    // 				soundcloud_profile = artist_scid;
    // 			} else {
    // 			}
    // 		}
    // 		return {
    // 			soundcloud_profile: soundcloud_profile
    // 		};
    //
    // 	},
    // 	[
    // 		['soundcloud_matched'],
    // 		['#sc_api', 'get', function() {
    // 			return ['resolve', {
    // 				'_status_code_map[302]': 200,
    // 				'_status_format': 'json',
    // 				url: 'http://soundcloud.com/' + this.state('googled_sc_name')
    // 			}];
    // 		}]
    // 	]
    // ],
    // [
    // 	['images'],
    // 	function(r) {
    // 		var images = spv.toRealArray(spv.getTargetField(r, 'images.image'));
    // 		return [images];
    // 	},
    // 	['#lfm', 'get', function() {
    // 		return ['artist.getImages', {'artist': this.head.artist_name }];
    // 	}]
    // ],
    [
      ['profile_image', 'bio', 'listeners', 'playcount', 'similar_artists_list', 'tags_list'],
      function(r) {
        var psai = app_serv.parseArtistInfo(r);
        var profile_image = this.app.art_images.getImageWrap(spv.getTargetField(r, 'artist.image'));

        //_this.tags_list.setPreview();
        var artists_list;

        if (psai.similars){
          var data_list = [];
          for (var i = 0; i < psai.similars.length; i++) {
            var cur = psai.similars[i];
            data_list.push({
              artist_name: cur.name,
              lfm_image: this.app.art_images.getImageWrap(cur.image)
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
      ['#lfm', 'get', function() {
        return ['artist.getInfo', {'artist': this.head.artist_name}];
      }]
    ],
    [
      ['discogs_id'],
      function(r) {
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
      ['#discogs', 'get', function() {
        return ['/database/search', {q: this.head.artist_name, type:"artist" }];
      }]

    ]
  ],
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

var ArtistInArtl = spv.inh(ArtCardBase, {}, {
  net_head: ['artist_name'],
  skip_map_init: true,
});

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
    var declr = this.map_parent[ 'nest_req-' + this.map_parent.main_list_name ];
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

  getRqData: function(paging_opts) {
    return {
      artist: this.head.artist_name,
      limit: paging_opts.page_limit
    };
  },

  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('similarartists', true),
    ['#lfm', 'get', function(opts) {
      return ['artist.getSimilar', this.getRqData(opts.paging)];
    }]
  ],

  setPreviewList: function(raw_array) {
    var preview_list = this.getNesting(this.preview_mlist_name);
    if (!preview_list || !preview_list.length){
      preview_list = [];
      for (var i = 0; i < raw_array.length; i++) {
        preview_list.push(this.initSi(ArtistInArtl, {
          network_states: raw_array[i]
        }));

      }
      pv.updateNesting(this, this.preview_mlist_name, preview_list);
    }
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
