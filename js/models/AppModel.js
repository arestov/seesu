define(function(require) {
"use strict";
var AppModelBase = require('pv/AppModel');
var spv = require('spv');
var pv = require('pv');
var pvUpdate = require('pv/update');
var BrowseMap = require('../libs/BrowseMap');
var routePathByModels = require('pv/routePathByModels');

var AppModel = spv.inh(AppModelBase, {}, (function(){
var props = {
  "+states": {
    "now_playing_text": [
      "compx",
      ['locales.now_playing', 'now_playing'],
      function(lo_now_playing, now_playing) {
        if (!lo_now_playing || !now_playing) {return '';}

        return lo_now_playing + ': ' + now_playing;
      }
    ]
  },

  checkUserInput: function(opts) {
    if (opts.ext_search_query) {
      this.search(opts.ext_search_query);
    }

    var state_recovered;
    if (this.p && this.p.c_song){
      this.showNowPlaying(true);
      state_recovered = true;
    }

    if (state_recovered){
      opts.state_recovered = true;
    }
    if (!state_recovered && !opts.ext_search_query){
      this.trigger('handle-location');
    }

    pvUpdate(this.start_page, 'can_expand', true);

  },

  nowPlaying: function(mo) {
    pvUpdate(this, 'now_playing', mo.getTitle());
    this.current_playing = mo;
    this.matchNav();
    this.updatePlayedListsHistory(mo);
  },

  matchNav: function() {
    if (this.current_playing){
      pvUpdate(this, 'viewing_playing', this.nav_tree.indexOf(this.current_playing) != -1);
    }

  },

  updatePlayedListsHistory: function(mo) {
    var array = this.getNesting('played_playlists');
    if (!array) {
      array = [];
    } else {
      array = array.slice();
    }
    var pos = array.indexOf( mo.map_parent );
    if (pos == -1) {
      array.unshift( mo.map_parent );
    } else {
      spv.removeItem(array, pos);
      array.unshift( mo.map_parent );

    }
    pv.updateNesting(this, 'played_playlists', array);
    pvUpdate(this, 'played_playlists_length', array.length);
  },

  playing: function() {
    pvUpdate(this, 'playing', true);
  },

  notPlaying: function() {
    pvUpdate(this, 'playing', false);
  },

  keyNav: function(key_name) {
    var md = this.map.getCurMapL().getNesting('pioneer');
    if (md.key_name_nav){
      var func = md.key_name_nav[key_name];
      func.call(md);
    }

  },

  showArtcardPage: function(artist_name){
    var md = getArtcard(this, artist_name);
    md.showOnMap();
    return md;
  },

  showArtistAlbum: function(params){
    var artcard = getArtcard(this, params.album_artist);

    var artist_name = params.album_artist || artcard.head.artist_name
    var pl = artcard.getSPI('albums_lfm', true).getSPI(artist_name + ',' + params.album_name, true);

    pl.showOnMap();
    return pl;
  },

  showNowPlaying: function(no_stat) {
    var resolved = this.p.resolved;
    var bwlev = resolved.getNesting('bwlev');
    var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, this.p.c_song.map_parent);
    pl_bwlev.followTo(this.p.c_song._provoda_id);
    // this.p.c_song.showOnMap();
    if (!no_stat){
      this.trackEvent('Navigation', 'now playing');
    }
  },

  showResultsPage: function(query){
    // если нет элемента или элемент не отображается
    // если элемента нет или в элемент детализировали
    var invstg = routePathByModels(this.start_page, 'search/', false, true, {reuse: true});
    invstg.changeQuery(query);
    invstg.showOnMap();
    return invstg;
  },

  show_tag: function(tag){
    var md = this.routePathByModels('tags/' + tag );

    md.showOnMap();
    return md;
  },

  showTopTacks: function(artist, track_name) {
    var artcard = getArtcard(this, artist);
    var target = artcard.getTopTacks(track_name);
    target.showOnMap();
  },

  getVkUser: function(userid) {
    return this.start_page.getSPI('users/vk:' + encodeURIComponent(userid), true);
  },

  getLastfmUser: function(username) {
    return this.start_page.getSPI('users/lfm:' + encodeURIComponent(username), true);
  },

  getSongcard: function(artist_name, track_name) {
    if (!artist_name || !track_name){
      return false;
    }
    return this.start_page.getSPI('tracks/' + this.joinCommaParts([artist_name, track_name]), true);
  },

  getArtcard: function(artist_name) {

    return this.start_page.getSPI('catalog/' + encodeURIComponent(artist_name), true);
  },

  // search: function(query){
  // 	var old_v = this.state('search_query');
  // 	if (query != old_v){
  // 		if (!query) {
  // 			this.showStartPage();
  // 		} else {
  // 			this.showResultsPage(query);
  // 		}
  //
  // 	}
  // 	pvUpdate(this, 'search_query', query);
  // },
  // 'stch-search_request_freshness': function(target) {
  // 	var query = target.state('search_query');
  // 	if (query) {
  // 		target.showResultsPage(query);
  // 	}
  //
  // },
  // refreshSearchRequest: function(time) {
  // 	pvUpdate(this, 'search_request_freshness', time);
  // },
  checkActingRequestsPriority: function() {
    var raw_array = [];
    var acting = [];
    var i;

    var w_song = this.p && this.p.wanted_song;

    var addToArray = function(arr, item) {
      if (arr.indexOf(item) == -1){
        arr.push(item);
      }
    };

    if (w_song){
      addToArray(acting, w_song);
    }
    var imporant_models = [ this.p && this.p.waiting_next, this.getNesting('current_mp_md'), this.p && this.p.c_song ];
    for (i = 0; i < imporant_models.length; i++) {
      var cur = imporant_models[i];
      if (cur){
        if (cur.getActingPriorityModels){
          var models = cur.getActingPriorityModels();
          if (models.length){
            raw_array = raw_array.concat(models);
          }
        } else {
          raw_array.push(cur);
        }
      }
    }

    for (i = 0; i < raw_array.length; i++) {
      addToArray(acting, raw_array[i]);

    }

    acting.reverse();
    for (i = 0; i < acting.length; i++) {
      acting[i].setPrio('acting');
    }

  }
};

return props;
})());

function getArtcard(app, artist_name) {
  return routePathByModels(app.start_page, 'catalog/' + encodeURIComponent(artist_name), false, true);
}

return AppModel;
});
