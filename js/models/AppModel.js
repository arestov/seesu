define(function(require) {
"use strict";
var AppModelBase = require('pv/AppModel');
var spv = require('spv');
var SongsList = require('./SongsList');
var pv = require('pv');
var pvUpdate = require('pv/update');

var updatePlayedListsHistory = function(target, mo) {
  var array = target.getNesting('played_playlists');
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
  pv.updateNesting(target, 'played_playlists', array);
  pv.updateNesting(target.app.map.getNesting('fake_spyglass'), 'played_playlists', array)
};

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

  nowPlaying: function(mo) {
    pvUpdate(this, 'now_playing', mo.getTitle());
    this.current_playing = mo;
    this.matchNav();
    updatePlayedListsHistory(this, mo);
  },

  matchNav: function() {
    if (this.current_playing){
      pvUpdate(this, 'viewing_playing', this.nav_tree.indexOf(this.current_playing) != -1);
    }

  },

  playing: function() {
    pvUpdate(this, 'playing', true);
  },

  notPlaying: function() {
    pvUpdate(this, 'playing', false);
  },

  createSonglist: function(map_parent, params) {
    return this.initSi(SongsList, params);
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


return AppModel;
});
