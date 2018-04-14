define(function(require) {
'use strict';
var pv = require('pv');
var lfmhelp = require('js/modules/lfmhelp');
var app_serv = require('app_serv');
var spv = require('spv');
var cache_ajax = require('cache_ajax');
var hex_md5 = require('hex_md5');
var lastfm_data = require('js/lastfm_data');
var base = require('./Investigation');
var pvUpdate = require('pv/update');

var suParseArtistsResults = lfmhelp.parseArtistsResults
var suParseTracksResults = lfmhelp.parseTracksResults
var suParseTagsResults = lfmhelp.parseTagsResults;
var suParseAlbumsResults = lfmhelp.parseAlbumsResults;

var artistSuggest = spv.inh(base.BaseSuggest, {
  init: function(self, opts, data) {
    self.artist = data.artist;
    self.image = data.image;
    self.text_title = self.getTitle();
    self.updateManyStates({
      artist: data.artist,
      image: data.image,
      text_title: self.text_title
    });
  }
}, {
  valueOf: function(){
    return this.artist;
  },
});

var playlistSuggest = spv.inh(base.BaseSuggest, {
  init: function(self, opts, data) {
    self.pl = data.playlist;
    self.text_title = self.getTitle();
    self.updateManyStates({
      text_title: self.text_title,
      playlist_provoda_id: data.playlist._provoda_id,
    });
  }
}, {
  valueOf: function(){
    return this.pl.state('nav_title');
  },
});

var seesuSection = spv.inh(base.SearchSection, {
  init: function(self) {
    if (!self.loadMore) {
      return
    }

    self.button = self.getSPI('button-more')
      .on('view', function(){
        this.hide();
        self.loadMore();
      })
      .on('state_change-disabled', function(){
        self.trigger('items-change');
      }, {skip_reg: true});
    pv.updateNesting(self, 'button', self.button);
  }
}, {
  "+states": {
    "button_text": [
      "compx",
      ['any_results', 'query', '#locales.fine-more', '#locales.to-search', 'results_desc_yes', 'results_desc_no'],
      function(have_results, q, lo_fine_more, lo_to_search, results_desc_yes, results_desc_no) {
        if (!lo_fine_more || !lo_to_search) {return;}

        if (have_results) {
          return (lo_fine_more || 'find more') + ' «' + q + '» ' + results_desc_yes;
        } else {
          return (lo_to_search || 'Search ') + ( q ? ('«' + q + '» ') : "" ) + results_desc_no;
        }
      }
    ],

    "no_results_text": [
      "compx",
      ['#locales.nothing-found', 'has_no_results'],
      function(desc, no_results) {
        return no_results && desc;
      }
    ]
  },

  no_results_text: true
});

var PlaylistsSection = spv.inh(base.SearchSection, {}, {
  "+states": {
    "section_title": [
      "compx",
      ['#locales.playlists']
    ]
  },

  model_name: 'section-playlist',
  'nest_rqc-items': playlistSuggest,
  sub_page: {
    'button-more': {
      constr: base.BaseSectionButton,
      title:  [[]]
    },
  }
});

var ArtistsSection = spv.inh(seesuSection, {}, {
  "+states": {
    "section_title": [
      "compx",
      ['#locales.Artists']
    ],

    "results_desc_yes": [
      "compx",
      ['#locales.oartists']
    ],

    "results_desc_no": [
      "compx",
      ['#locales.in-artists']
    ]
  },

  model_name: 'section-artist',
  sub_page: {
    'button-more': {
      constr: base.BaseSectionButton,
      title:  [[]]
    },
  },

  loadMore: function() {
    var q = this.r.query;
    if (q) {
      lfmhelp.getLastfmSuggests(this.app, 'artist.search', {artist: q}, q, this, suParseArtistsResults, true);
    }
  },
  'nest_rqc-items': artistSuggest,
});



var trackSuggest = spv.inh(base.BaseSuggest, {
  init: function(self, opts, data) {
    //artist, track, image, duration
    self.artist = data.artist;
    self.track = data.track;
    self.image = data.image;
    pvUpdate(self, 'artist', data.artist);
    pvUpdate(self, 'track', data.track);
    if (self.image){
      pvUpdate(self, 'image', data.image);
    }


    if (data.duration){
      self.duration = data.duration;
      var track_dur = parseInt(self.duration, 10);
      var digits = track_dur % 60;
      track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits );
      pvUpdate(self, 'duration_text', track_dur);
    }
    self.text_title = self.getTitle();
    pvUpdate(self, 'text_title', self.text_title);
  }
}, {
  valueOf: function(){
    return this.artist + ' - ' + this.track;
  },
  onView: function(){
    this.app.trackEvent('Music search', this.q, "track: " + this.artist + ' - ' + this.track );
  }
});





var TracksSection = spv.inh(seesuSection, {}, {
  "+states": {
    "section_title": [
      "compx",
      ['#locales.Tracks']
    ],

    "results_desc_yes": [
      "compx",
      ['#locales.otracks']
    ],

    "results_desc_no": [
      "compx",
      ['#locales.in-tracks']
    ]
  },

  model_name: 'section-track',
  sub_page: {
    'button-more': {
      constr: base.BaseSectionButton,
      title:  [[]]
    },
  },

  loadMore: function() {
    var q = this.r.query;
    if (q) {
      lfmhelp.getLastfmSuggests(this.app, 'track.search', {track: q}, q, this, suParseTracksResults, true);
    }
  },
  'nest_rqc-items': trackSuggest,
});

var tagSuggest = spv.inh(base.BaseSuggest, {
  init: function(self, opts, data) {
    self.tag = data.tag;
    self.image = null;
    if (data.image){
      self.image = data.image;
    }
    self.text_title = self.getTitle();

    self.updateManyStates({
      tag: data.tag,
      image: data.image,
      text_title: self.text_title
    });
  }
}, {
  valueOf: function(){
    return this.tag;
  },
  onView: function(){
    this.app.trackEvent('Music search', this.q, "tag: " + this.tag );
  }
});


var TagsSection = spv.inh(seesuSection, {}, {
  "+states": {
    "section_title": [
      "compx",
      ['#locales.Tags']
    ],

    "results_desc_yes": [
      "compx",
      ['#locales.otags']
    ],

    "results_desc_no": [
      "compx",
      ['#locales.in-tags']
    ]
  },

  model_name: 'section-tag',
  sub_page: {
    'button-more': {
      constr: base.BaseSectionButton,
      title:  [[]]
    },
  },
  loadMore: function() {
    var q = this.r.query;
    if (q) {
      lfmhelp.getLastfmSuggests(this.app, 'tag.search', {tag: q}, q, this, suParseTagsResults, true);
    }
  },
  'nest_rqc-items': tagSuggest,
});

var albumSuggest = spv.inh(base.BaseSuggest, {
  init: function(self, opts, data) {
    //artist, name, image, id
    self.artist = data.artist;
    self.name = data.album;
    pvUpdate(self, 'artist', data.artist);
    pvUpdate(self, 'name', data.album);

    self.image = null;
    if (data.image){
      self.image = data.image;
      pvUpdate(self, 'image', data.image);
    }
    if (data.resid){
      self.aid = data.resid;
      pvUpdate(self, 'aid', data.resid);
    }
    self.text_title = self.getTitle();
    pvUpdate(self, 'text_title', self.text_title);
  }
}, {
  valueOf: function(){
    return '( ' + this.artist + ' ) ' + this.name;
  },
  onView: function(){
    this.app.trackEvent('Music search', this.q, "album: " + this.text_title);
  }
});

var AlbumsSection = spv.inh(seesuSection, {}, {
  "+states": {
    "section_title": [
      "compx",
      ['#locales.Albums']
    ],

    "results_desc_yes": [
      "compx",
      ['#locales.oalbums']
    ],

    "results_desc_no": [
      "compx",
      ['#locales.in-albums']
    ]
  },

  model_name: 'section-album',

  sub_page: {
    'button-more': {
      constr: base.BaseSectionButton,
      title:  [[]]
    },
  },

  loadMore: function() {
    var q = this.r.query;
    if (q) {
      lfmhelp.getLastfmSuggests(this.app, 'album.search', {'album': q}, q, this, suParseAlbumsResults, true);
    }
  },
  'nest_rqc-items': albumSuggest,
});

var SearchPage = spv.inh(base.Investigation, {}, {
  "+states": {
    // init: function(){
    // 	this._super.apply(this, arguments);
    // 	pvUpdate(this, 'mp_detailed', false);
    // },


    // init: function(opts) {
    // 	this._super.apply(this, arguments);

    // },

    "shown": [
      "compx",
      ['mp_detailed', 'shown'],
      function(mp_detailed, shown) {
        return shown || mp_detailed;
      }
    ],

    "url_part": [
      "compx",
      ['query'],
      function(query) {
        return '/search/' + encodeURIComponent(query);
      }
    ],

    "focused": [
      "compx",
      ['focused', 'mp_has_focus'],
      function (focused, mp_has_focus){
        return focused || mp_has_focus;
      }
    ],

    "focus_loosed": [
      "compx",
      ['focus_loosed', 'focused', 'mp_has_focus'],
      function(loosed, focused, mp_has_focus) {
        return loosed || (focused && !mp_has_focus);
      }
    ],

    "mp_detailed": ["compx", ['focus_loosed']],

    "needs_search_from": [
      "compx",
      ['mp_detailed'],
      function() {
        return true;
      }
    ],

    "nav_title": [
      "compx",
      ['query', '#locales.Search-resuls'],
      function(text, original) {
        if (!original) {
          return;
        }
        if (text){
          return original.replace(this.query_regexp, ' «' + text + '» ').replace(/^\ |\ $/gi, '');
        } else{
          var usual_text = original.replace(this.query_regexp, '');
          var cap = usual_text.charAt(0).toLocaleUpperCase();
          return cap + usual_text.slice(1);
        }
      }
    ]
  },

  // 'compx-mp_detailed': [
  // 	['mp_detailed', 'mp_show', 'focused', 'mp_has_focus'],
  // 	function (mp_detailed, mp_show, focused, mp_has_focus) {
  // 		return mp_detailed || (mp_show && focused && !mp_has_focus);
  // 	}
  // ],
  'nest-section': [[PlaylistsSection, ArtistsSection, AlbumsSection, TagsSection, TracksSection]],

  setItemForEnter: function() {

  },

  key_name_nav: {
    'Enter': function() {
      this.pressEnter();
    },
    "Up": function() {
      this.selectEnterItemAbove();
    },
    "Down": function() {
      this.selectEnterItemBelow();
    }
  },

  searchf: function() {
    var playlists = this.app.gena.playlists,
      pl_results = [],
      pl_sec,
      i;
    var serplr;

    var query = this.q || '';

    if (':playlists'.match(spv.getStringPattern(query))){
      this.setInactiveAll('section-playlist');
      pl_sec = this.g('section-playlist');
      pl_sec.setActive();
      pl_sec.changeQuery(query);


      serplr = this.app.getPlaylists();
      if (serplr.length){
        for (i = 0; i < serplr.length; i++) {
          pl_results.push({
            playlist: serplr[i]
          });
        }
      }

      pl_sec.appendResults(pl_results);
      pl_sec.renderSuggests(true);
    } else if (!query.match(/^:/)){
      this.setActiveAll('section-playlist');
      //playlist search


      serplr = this.app.getPlaylists(query);
      if (serplr.length){
        for (i = 0; i < serplr.length; i++) {
          pl_results.push({
            playlist: serplr[i]
          });
        }
      }

      if (pl_results.length){
        pl_sec =  this.g('section-playlist');
        if (pl_sec) {
            pl_sec.setActive();
          pl_sec.appendResults(pl_results);
          pl_sec.renderSuggests(true);
        }

      }

      //===playlists search
      this.searchOffline(query);
      this.searchNetwork(query);
    }
  },

  searchOffline: spv.debounce(function(q){
    var tags = this.g('section-tag');
    var r = this.searchTags(q);
    if (r.length){
      tags.appendResults(r);
      tags.renderSuggests(r);
    }

  },150),

  searchTags: function(q){
    var tags_results = [];

    var tags = spv.searchInArray(lastfm_data.toptags, q);
    for (var i=0; i < tags.length; i++) {
      tags_results.push({
        tag: tags[i]
      });
    }
    return tags_results;
  },

  searchNetwork: (app_serv.app_env.cross_domain_allowed && false) ?
    function(q){
      var _this = this;
      this.loading();
      var hash = hex_md5(q);
      var cache_used = cache_ajax.get('lfm_fs', hash, function(r){

        _this.loaded();
        lfmhelp.fast_suggestion(r, q, _this);
      });
      if (!cache_used) {
        var all_parts = [this.g('section-artist'), this.g('section-track'), this.g('section-tag'), this.g('section-album')];
        for (var i = 0; i < all_parts.length; i++) {
          var el = all_parts[i];
          if (el) {
            el.loading();
          }
        }

        lfmhelp.get_fast_suggests(q, function(r){
          for (var i = 0; i < all_parts.length; i++) {
            var el = all_parts[i];
            if (el) {
              el.loaded();
            }
          }
          lfmhelp.fast_suggestion(r, q, _this);
        }, hash, this);

      }
    }
    :
    spv.debounce(function(q){
      lfmhelp.getLastfmSuggests(this.app, 'artist.search', {artist: q}, q, this.g('section-artist'), suParseArtistsResults);
      lfmhelp.getLastfmSuggests(this.app, 'track.search', {track: q}, q, this.g('section-track'), suParseTracksResults);
      lfmhelp.getLastfmSuggests(this.app, 'tag.search', {tag: q}, q, this.g('section-tag'), suParseTagsResults);
      lfmhelp.getLastfmSuggests(this.app, 'album.search', {album: q}, q, this.g('section-album'), suParseAlbumsResults);
    }, 400)
});


return {
  Investigation: base.Investigation,
  BaseSuggest: base.BaseSuggest,
  SearchSection: base.SearchSection,
  SearchPage: SearchPage
};
});
