define(function(require) {
'use strict';
var spv = require('spv');
var SongsList = require('./SongsList');
var ArtCard = require('./ArtCard');
var BrowseMap = require('js/libs/BrowseMap');
var lastfm_data = require('js/lastfm_data');
var declr_parsers = require('js/modules/declr_parsers');
var pv = require('pv');
var pvUpdate = require('pv/update');


var parent_focus = [['^mp_has_focus']];
var heavyInitReactn = function(target, state) {
  if (state) {
    target.heavyInit();
  }
};

var MusicConductor;
//http://hypem.com/latest
var HypemPlaylist = SongsList.HypemPlaylist;
var ArtistsList = ArtCard.ArtistsList;
var AllPHypemLatestSongs = spv.inh(HypemPlaylist, {}, {

  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/latest/all/json/' + opts.paging.next_page +'/data.js';
      return [path, null];
    }]
  ],
  page_limit: 30
});
var AllPHypemLatestRemixesSongs = spv.inh(HypemPlaylist, {}, {

  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/latest/remix/json/' + opts.paging.next_page +'/data.js';
      return [path, null];
    }]
  ]
});

var AllPHypemNowSongs = spv.inh(HypemPlaylist, {}, {

  'nest_req-songs-list': [
    declr_parsers.hypem.tracks,
    ['#hypem', 'get', function(opts) {
      var path = '/playlist/popular/3day/json/' + opts.paging.next_page +'/data.js';
      return [path, null];
    }]
  ]

});
// var AllPHypemWeekSongs = function() {};
// HypemPlaylist.extendTo(AllPHypemWeekSongs, {
// 	'nest_req-songs-list': [
// 		declr_parsers.hypem.tracks,
// 		['#hypem', 'get', function(opts) {
// 			var path = '/playlist/popular/lastweek/json/' + opts.paging.next_page +'/data.js';
// 			return [path, null];
// 		}]
// 	]
// });

var AllPSongsChart = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('tracks'),
    ['#lfm', 'get', function() {
      return ['chart.getTopTracks', null];
    }]
  ]
});

var AllPSongsHyped = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('tracks'),
    ['#lfm', 'get', function() {
      return ['chart.getHypedTracks', null];
    }]
  ]
});

var AllPSongsLoved = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('tracks'),
    ['#lfm', 'get', function() {
      return ['chart.getLovedTracks', null];
    }]
  ]
});



var AllPlacesSongsLists = spv.inh(BrowseMap.Model, {}, {
  'nest-lists_list':[['latest', 'latest:remix', 'topnow_hypem', '_', 'hyped', 'loved'], {
    preload_on: 'mp_has_focus',
  }],
  sub_page: {
    latest: {
      constr: AllPHypemLatestSongs,
      title: [['#locales.Latest Blogged music from hypem_com']]
    },
    'latest:remix': {
      constr: AllPHypemLatestRemixesSongs,
      title: [['#locales.Latest Blogged remixes from hypem_com']]
    },
    'topnow_hypem': {
      constr: AllPHypemNowSongs,
      title: [['#locales.Popular Now on hypem_com']]
    },
    '_': {
      constr: AllPSongsChart,
      title: [['#locales.Top']]
    },
    'hyped': {
      constr: AllPSongsHyped,
      title: [['#locales.Hyped']]
    },
    'loved': {
      constr: AllPSongsLoved,
      title: [['#locales.Most Loved']]
    }
  },
  model_name: 'songs_lists'
});


var AllPArtistsHyped = spv.inh(ArtistsList, {}, {
  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('artists'),
    ['#lfm', 'get', function() {
      return ['chart.getHypedArtists', null];
    }]
  ]
});

var AllPArtistsChart = spv.inh(ArtistsList, {}, {
  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('artists'),
    ['#lfm', 'get', function() {
      return ['chart.getTopArtists', null];
    }]
  ]
});


var AllPlacesArtistsLists = spv.inh(BrowseMap.Model, {}, {
  'nest-lists_list':[ ['hyped', '_'], {
    preload_on: 'mp_has_focus',
  }],
  model_name: 'artists_lists',
  sub_page: {
    '_': {
      constr: AllPArtistsChart,
      title: [['#locales.Top']]
    },
    'hyped': {
      constr: AllPArtistsHyped,
      title: [['#locales.Hyped']]
    }
  }

});



var AllPlaces = spv.inh(BrowseMap.Model, {}, {
  model_name:'allplaces',
  'nest-songs_lists': ['songs'],
  'nest-artists_lists': ['artists'],
  'nest-lists_list': [['songs', 'artists']],
  sub_page: {
    'songs': {
      constr: AllPlacesSongsLists,
      title: [['#locales.Songs']]
    },
    'artists': {
      constr: AllPlacesArtistsLists,
      title: [['#locales.Artists']]
    }
  }
});

var metroP = function(md) {
  return {
    metro: md.head.city_name,
    country: md.head.country_name
  };
};

var CityAritstsTop = spv.inh(ArtistsList, {}, {
  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('topartists'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroArtistChart', metroP(this)];
    }]
  ]
});
var CityArtistsHype = spv.inh(ArtistsList, {}, {
  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('topartists'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroHypeArtistChart', metroP(this)];
    }]
  ]
});
var CityArtistsUnique = spv.inh(ArtistsList, {}, {

  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('topartists'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroUniqueArtistChart', metroP(this)];
    }]
  ]
});

var CityArtistsLists = spv.inh(BrowseMap.Model, {}, {
  model_name: 'artists_lists',
  'nest-lists_list':[ ['_', 'hyped', 'unique'], {
    preload_on: 'mp_has_focus',
  }],
  sub_page: {
    '_': {
      constr: CityAritstsTop,
      title: [['#locales.Top']]
    },
    'hyped': {
      constr: CityArtistsHype,
      title: [['#locales.Hyped']]
    },
    'unique': {
      constr: CityArtistsUnique,
      title: [['#locales.Unique']]
    }
  }
});


var CitySongsTop = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('toptracks'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroTrackChart', metroP(this)];
    }]
  ]
});
var CitySongsHype = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('toptracks'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroHypeTrackChart', metroP(this)];
    }]
  ]
});
var CitySongsUnique = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('toptracks'),
    ['#lfm', 'get', function() {
      return ['geo.getMetroUniqueTrackChart', metroP(this)];
    }]
  ]
});

var CitySongsLists = spv.inh(BrowseMap.Model, {}, {
  model_name: 'songs_lists',
  'nest-lists_list':[ ['_', 'hyped', 'unique'], {
    preload_on: 'mp_has_focus',
  }],
  sub_page: {
    '_': {
      constr: CitySongsTop,
      title: [['#locales.Top']]
    },
    'hyped': {
      constr: CitySongsHype,
      title: [['#locales.Hyped']]
    },
    'unique': {
      constr: CitySongsUnique,
      title: [['#locales.Unique']]
    }
  }
});

var CityPlace = spv.inh(BrowseMap.Model, {}, {
  model_name: 'city_place',
  'nest-lists_list': [['artists', 'songs']],
  sub_page: {
    'artists': {
      constr: CityArtistsLists,
      title: [['#locales.Artists lists']]
    },
    'songs': {
      constr: CitySongsLists,
      title: [['#locales.Songs lists']]
    }
  }
});



var CountryCitiesList = spv.inh(BrowseMap.Model, {}, {
  "+states": {
    "parent_focus": //check this compx
    ["compx"].concat(parent_focus)
  },

  model_name: 'cities_list',
  'stch-parent_focus': heavyInitReactn,
  'stch-mp_has_focus': heavyInitReactn,

  heavyInit: function() {
    if (this.heavy_inited){
      return;
    }
    this.heavy_inited = true;

    var lists_list = [];

    var citiesl = lastfm_data.countries[this.head.country_name];

    for (var i = 0; i < citiesl.length; i++) {
      var name = citiesl[i];
      var instance = this.getSPI(name, true);
      lists_list.push(instance);
    }

    pv.updateNesting(this, 'lists_list', lists_list);
  },

  'nest_posb-lists_list': ['{city_name},{country_name}'],

  //'nest-lists_list': [],
  sub_pager: {
    item: [
      CityPlace,
      [
        ['city_name', 'country_name'],
        function(city_name, country_name) {
          return city_name + ', ' + country_name;
        }
      ], {
        city_name: 'decoded_name'
      }
    ]
  }
});

var CountryTopArtists = spv.inh(ArtistsList, {}, {
  'nest_req-artists_list': [
    declr_parsers.lfm.getArtists('topartists'),
    ['#lfm', 'get', function() {
      return ['geo.getTopArtists', {
        country: this.head.country_name
      }];
    }]
  ]
});
var CountryTopSongs = spv.inh(SongsList, {}, {
  'nest_req-songs-list': [
    declr_parsers.lfm.getTracks('toptracks'),
    ['#lfm', 'get', function() {
      return ['geo.getTopTracks', {
        country: this.head.country_name
      }];
    }]
  ]
});

var CountryPlace = spv.inh(BrowseMap.Model, {}, {
  "+states": {
    "parent_focus": //check this compx
    ["compx"].concat(parent_focus)
  },

  model_name: 'country_place',
  'stch-parent_focus': heavyInitReactn,
  'stch-mp_has_focus': heavyInitReactn,

  'nest-lists_list':[ ['artists_top', 'songs_top', 'cities'], {
    idle_until: 'mp_alhf',
  }],

  'nest-pwis':[ ['artists_top', 'songs_top'], {
    preload_on: 'mp_has_focus',
    idle_until: 'mp_alhf',
  }],

  sub_page: {
    'songs_top': {
      constr: CountryTopSongs,
      title: [['#locales.Top Songs']]
    },
    'artists_top': {
      constr: CountryTopArtists,
      title: [['#locales.Top Artists']]
    },
    'cities': {
      constr: CountryCitiesList,
      title: [
        ['#locales.Cities of %country%', 'country_name'],
        function(state, country_name) {
          return state && state.replace('%country%', country_name);
        }
      ]
    }
  },

  heavyInit: function() {
    if (this.heavy_inited){
      return;
    } else {
      this.heavy_inited = true;
      pvUpdate(this, 'mp_alhf', true);
    }
  }
});

var CountriesList = spv.inh(BrowseMap.Model, {
  init: function(target) {
    var lists_list = [];
    for (var country in lastfm_data.countries){
      var country_place = target.getSPI(country, true);
      lists_list.push(country_place);
    }
    pv.updateNesting(target, 'lists_list', lists_list);
  }
}, {
  model_name: 'countries_list',
  'nest_posb-lists_list': ['{country_name}'],
  sub_pager: {
    item: {
      head: {
        country_name: [spv.capitalize.fn, 'decoded_name']
      },
      constr: CountryPlace,
      title: [['country_name']],
      getKey: spv.capitalize.fn,
    },
  }
});



MusicConductor = spv.inh(BrowseMap.Model, {}, {
  "+states": {
    "can_expand": [
      "compx",
      ['^can_expand'],
      function (can_expand) {
        return can_expand;
      }
    ],

    "can_load_previews": [
      "compx",
      ['^mp_has_focus'],
      function(parent_focus) {
        return !!parent_focus;
      }
    ],

    "preview_images": [
      "compx",
      ['@selected_image:preview_playlists.songs-list'],
      function(images) {
        if (!images) {return;}

        var index = {};
        var result = [];

        for (var i = 0; i < images.length; i++) {
          var cur = images[i];
          if (!cur) {continue;}

          var id = cur.lfm_id || cur.url;
          if (index.hasOwnProperty(id)) {continue;}
          index[id] = true;

          result.push(cur);
        }

        return result;
      }
    ]
  },

  model_name: 'mconductor',

  'nest-preview_playlists': [['world/songs/topnow_hypem', 'world/songs/_'], {
    preload_on: 'can_load_previews',
  }],

  'nest-preview_list':
    [['world/songs', 'world/songs/topnow_hypem', 'world/songs/_', 'world/artists', 'world']],

  'nest-allpas': ['world'],
  'nest-countries': ['countries'],

  sub_page: {
    countries: {
      title: [['#locales.Countries']],
      constr: CountriesList
    },
    world: {
      constr: AllPlaces,
      title: [['#locales.All-a-world']]
    }
  }
});
return MusicConductor;
});
