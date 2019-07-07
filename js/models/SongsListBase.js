define(function(require) {
'use strict';
var pv = require('pv');
var pvUpdate = require('pv/update');
var spv = require('spv');
var LoadableList = require('./LoadableList');
var modern_base = require('./SongsListModernBase')

var legacyBase = spv.inh(LoadableList, {
  init: function(target, opts){
    target.idx_wplay_song = null;
    target.idx_show_song = null;
    target.idx_player_song = null;

    target.app = opts.app;
    target.player = target.app.p;
    target.mp3_search = target.app.start_page.mp3_search;
  },
}, spv.coe(function(add) {

  var markTracksForFilesPrefinding = function(mdpl){
    var from_collection = + (new Date());
    for (var i=0; i < mdpl.getMainlist().length; i++) {
      mdpl.getMainlist()[i]
        .setPlayableInfo({
          packsearch: from_collection,
          last_in_collection: i == mdpl.getMainlist().length-1
        });

    }
    return mdpl;
  };

  var hndChangedPlaylist = function(e) {
    if (!e.skip_report){
      markTracksForFilesPrefinding(this);
      this.makePlayable();
    }
  };
  var getFindSomeFunc = function(check) {
    return function(array) {
      for (var i = 0; i < array.length; i++) {
        if (check(array[i])) {
          return array[i];
        }
      }
    };
  };

  var findPS = getFindSomeFunc(function(item) {
    return item && item.state('player_song');
  });


  var setWaitingNextSong = function(mdpl, mo) {
    mdpl.waiting_next = mo;
    mdpl.player.setWaitingPlaylist(mdpl);

  };

  function getLastUsableSong(mdpl){
    for (var i = mdpl.getMainlist().length - 1; i >= 0; i--) {
      var cur = mdpl.getMainlist()[i];
      if (cur.canUseAsNeighbour()){
        return cur;
      }

    }
  };


  function getViewingSong(mdpl, exept) {
    //var song = spv.filter(mdpl.getMainlist(), 'states.mp_show', function(v) {return !!v;})[0];
    return mdpl.idx_show_song != exept && mdpl.idx_show_song;
  };
  function getPlayerSong(mdpl, exept) {
    //var song = spv.filter(mdpl.getMainlist(), "states.player_song", true)[0];
    return mdpl.idx_player_song != exept && mdpl.idx_player_song;
  };


  var bindStaCons = LoadableList.prototype.bindStaCons;



  add({
    "+states": {
      "active_use": [
        "compx",
        ['mp_show', 'want_be_played'],
        function (mp_show, want_be_played) {
          return mp_show || want_be_played;
        }
      ]
    },

    model_name: "playlist",

    'stch-pl-shuffle': function(self, state) {
      if (state) {
        throw new Error('feature was degraded')
      }
      // checkNeighboursStatesCh(target);
    },

    // 'compx-idx_player_song': [
    // 	['songs-list']
    // ],
    'stch-player_song@songs-list': function(target, new_state, old, source) {
      if (!source.item) {
        var item = findPS(source.items);
        target.idx_player_song = item;
      } else {
        if (new_state){
          target.idx_player_song = source.item;
        } else if (target.idx_player_song == source.item) {
          target.idx_player_song = null;
        }
      }
      pv.updateNesting(target, 'last_played_song', target.idx_player_song || target.getNesting('last_played_song'));
      pvUpdate(target, 'last_played_song_start', Date.now());
    },

    bindStaCons: function() {
      bindStaCons.call(this);
      this.on('child_change-' + this.main_list_name, hndChangedPlaylist);
    },

    main_list_name: 'songs-list',

    add: function(omo){
      var mo = spv.cloneObj({}, omo, false, ['track', 'artist', 'file']);
      return this.addDataItem(mo);
    },

    isDataItemValid: function(data_item) {
      return !!data_item.artist && !!data_item.artist.trim();
    },

    isDataInjValid: function(obj) {
      if (!obj.track && !obj.artist){
        return;
      } else {
        return true;
      }
    },

    items_comparing_props: [['artist', 'artist'], ['track', 'track']],

    getMainListChangeOpts: function() {
      return {
        last_usable_song: getLastUsableSong(this)
      };
    },

    die: function(){
      this._super();
      for (var i = this.getMainlist().length - 1; i >= 0; i--){
        this.getMainlist()[i].die();
      }

    },

    simplify: function(){
      var list = this.getMainlist();
      var npl = new Array(list && list.length);

      for (var i=0; i < list.length; i++) {
        npl[i] = list[i].simplify();
      }

      return spv.cloneObj({
        length: npl.length,
        playlist_title: this.state('nav_title') || ''
      }, npl);
    },

    markAsPlayable: function() {
      pvUpdate(this, 'can_play', true);
    },

    makePlayable: function(full_allowing) {
      for (var i = 0; i < this.getMainlist().length; i++) {
        var mo = this.getMainlist()[i];
        var pi = mo.playable_info || {};
        mo.makeSongPlayalbe(pi.full_allowing || full_allowing, pi.packsearch, pi.last_in_collection);
      }
    },

    checkChangesSinceFS: function() {
      if (this.player.waiting_playlist && this == this.player.waiting_playlist) {
        if (this.waiting_next){
          if (!this.waiting_next.getNextPreloadSong()){
            this.waiting_next = null;
            this.player.waiting_playlist = null;
          } else if (this.waiting_next.getNextPreloadSong().canPlay()){
            this.waiting_next.getNextPreloadSong().wantSong();
          }
        }
      } else {
        this.waiting_next = null;
      }
    },

    wantListPlaying: function() {
      this.player.removeCurrentWantedSong();
      pvUpdate(this, 'want_be_played', true);

      if (!this.getMainlist()[0]) {
        this.requestMoreData();
      } else {
        this.getMainlist()[0].wantSong();
      }

      var _this = this;
      this.player.once('now_playing-signal', function() {
        pvUpdate(_this, 'want_be_played', false);
      });
    },

    setWaitingNextSong: setWaitingNextSong,

    switchTo: function(mo, direction) {

      var playlist = [];
      for (var i=0; i < this.getMainlist().length; i++) {
        var ts = this.getMainlist()[i].canPlay();
        if (ts){
          playlist.push(this.getMainlist()[i]);
        }
      }
      var current_number  = playlist.indexOf(mo),
        total			= playlist.length || 0;

      if (playlist.length > 1) {
        var s = false;
        if (direction) {
          var possible = mo.getNextPreloadSong();
          var can_repeat = !this.state('dont_rept_pl');
          var shuffle = this.state('pl-shuffle');
          if (possible){
            var real_cur_pos = this.getMainlist().indexOf(mo);
            var nps_pos = this.getMainlist().indexOf(possible);
            if (shuffle || can_repeat || nps_pos > real_cur_pos){
              if (possible.canPlay()){
                s = possible;
              } else {
                return true;
                // setWaitingNextSong(this, mo);
              }
            }

          } else if (this.state('can_load_more')){
            return true;
            // setWaitingNextSong(this, mo);

          } else {
            if (current_number == (total-1)) {
              if (can_repeat){
                s = playlist[0];
              }

            } else {
              s = playlist[current_number+1];
            }
          }


        } else {
          if ( current_number === 0 ) {
            s = playlist[total-1];
          } else {
            s = playlist[current_number-1];
          }
        }
        return s;
        // if (s){
        // 	s.play();
        // }
      } else if (playlist[0]){
        return playlist[0];
        // playlist[0].play();
      }

    },

    checkNavRequestsPriority: function() {
      var i;

      var demonstration = [];

      var waiting_next = this.waiting_next;
      var v_song = getViewingSong(this);
      var p_song = getPlayerSong(this);


      var addToArray = function(arr, item) {
        if (!item || arr.indexOf(item) != -1) {
          return false
        }

        arr.push(item);
        return true;
      };


      if (v_song){
        addToArray(demonstration, v_song);
        if (v_song.getNextSong()){
          addToArray(demonstration, v_song.getNextSong());
        } else if (this.state('can_load_more')){
          addToArray(demonstration, this);
        }
        addToArray(demonstration, v_song.getPrevSong());
      }
      if (p_song){
        addToArray(demonstration, p_song);
        addToArray(demonstration, p_song.getNextSong());
      }
      if (waiting_next){
        addToArray(demonstration, waiting_next);
        addToArray(demonstration, waiting_next.getNextSong());
      }

      addToArray(demonstration, this);

      demonstration.reverse();
      for (i = 0; i < demonstration.length; i++) {
        demonstration[i].setPrio();
      }

    },

    checkRequestsPriority: function() {
      this.checkNavRequestsPriority();
    },

    getSPC: true,

    subPager: function(pstr, string) {
      var parts = this.app.getCommaParts(string);
      var artist = parts[1] ? parts[0] : this.playlist_artist;

      return this.findMustBePresentDataItem({
        artist: artist,
        track: parts[1] ? parts[1] : parts[0]
      });
    },

    requestLastPlayedSong: function() {
      this.getNesting('last_played_song').requestPage();
    }
  });
}));


return spv.inh(legacyBase, {}, modern_base)
});
