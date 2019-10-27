define(function(require){
"use strict";
var pv = require('pv');
var app_serv = require('app_serv');
var spv = require('spv');
var PlayRequest = require('../PlayRequest');

var app_env = app_serv.app_env;

var isStoped = function (play) {
  return !play && play !== false;
};

var finup = function(callback) {
  callback.finup = true;
  return callback;
};

var pvState = pv.state;
var pvUpdate = require('pv/update');

var FileInTorrent = spv.inh(pv.Model, {
  init: function(target, opts, states, params) {
    target.sr_item = params.file;
    target.updateManyStates({
      full_title: target.sr_item.title,
      torrent_link: target.sr_item.torrent_link
    });
  }
}, {
  model_name: 'file-torrent',

  setPlayer: function() {
    return this;
  },
  activate: function() {
    return this;
  },
  deactivate: function() {
    return this;
  },
  download: function() {
    if (!window.btapp){
      app_env.openURL(this.sr_item.torrent_link);
    } else {
      btapp.add.torrent(this.sr_item.torrent_link);
    }
    pvUpdate(this, 'download-pressed', true);
  }
});

var zerofyString = spv.zerofyString;
var getNiceSeconds = function(state) {
  if (typeof state == 'number'){
    var duration = Math.round(state/1000);
    if (duration){
      var digits = duration % 60;
      return  zerofyString(Math.floor(duration/60), 2) + ':' + zerofyString(digits, 2);
    }
  }
};

  var isDepend = pv.utils.isDepend;


  var initSFModel = function(self, opts, states, params) {
    self.mo = self.map_parent.map_parent;

    if (params.file){
      var file = params.file;
      for (var a in file){
        if (typeof file[a] != 'function' && typeof file[a] != 'object'){
          if (self.hasComplexStateFn(a)) {
            continue;
          }
          // self[a] = file[a];
          pvUpdate(self, a, file[a]);
        }
      }
      self.parent = file;
    }

    return self;
  };

var SongFileModelBase = spv.inh(pv.Model, {
  naming: function(fn) {
    return function SongFileModel(opts, states, params) {
      fn(this, opts, states, params);
    };
  },
  init: function (self) {
    self.sound = null;
    self.mo = null;
    self.setPlayer(self.app.p);
  },
  props: props()
});

function props() {
  return {
    "+states": {
      "title": [
        "compx",
        ['artist', 'track'],
        function(artist, track) {
          if (artist && track) {
            return artist + ' - ' + track;
          } else if (artist) {
            return artist;
          } else if (track) {
            return track;
          }
        }
      ],

      "source_name": ["compx", ['from']],

      "visible_duration": [
        "compx",
        ['duration', 'loaded_duration'],
        function(duration, loaded_duration) {
          return duration || loaded_duration;
        }
      ],

      "play_position": [
        "compx",
        ['visible_duration', 'playing_progress'],
        function(duration, playing_progress) {
          return Math.round(duration * playing_progress);
        }
      ],

      "visible_duration_text": [
        "compx",
        ['visible_duration'],
        function (state) {
          return getNiceSeconds(state);
        }
      ],

      "play_position_text": [
        "compx",
        ['play_position'],
        function (state) {
          return getNiceSeconds(state);
        }
      ],

      "load_file": [
        "compx",
        ['file_to_load-for-player_song', 'file_to_load-for-preload_current_file'],
        function(player_song, preload_current_file) {
          return isDepend(player_song) || isDepend(preload_current_file);
        }
      ],

      "last_play": [
        "compx",
        ['playing_progress', 'play'],
        function (playing_progress, play) {
          if (isStoped(play) || typeof playing_progress !== 'number') {
            return null;
          }
          if (play === false) {
            return 0;
          }
          return Date.now();
        }
      ],

      "played_amount": [
        "compx",
        ['played_amount', 'last_play', 'play'],
        function (played_amount, last_play, play) {
          if (isStoped(play)) {
            return null;
          }

          if (last_play == undefined) {
            return played_amount;
          }

          var amount = played_amount && played_amount.value || 0;
          var prev = played_amount && played_amount.last_play;

          if (last_play === 0) {
            return {
              last_play: 0,
              value: amount || 0
            };
          }

          var to_add = prev ? (last_play - prev) : 0;

          return {
            last_play: last_play,
            value: amount + to_add,
          };
        }
      ],

      "current_scrobbles": [
        "compx",
        ['current_scrobbles', 'duration', 'played_amount.value'],
        function(current_scrobbles, duration, current_amount) {
          if (!duration ||!current_amount) {
            return null;
          }

          var count = 0;
          count += Math.floor( current_amount / duration );

          if (current_amount % duration > (duration * 0.35)) {
            count++;
          }

          if (current_scrobbles && current_scrobbles.length === count) {
            return current_scrobbles;
          }

          var result = current_scrobbles ? current_scrobbles.slice() : [];
          if (result.length < count) {
            result.push(Date.now());
          }

          return result;
        }
      ]
    },

    model_name: 'file-http',

    requestPlay: function(bwlev_id) {
      this.mo.getMFCore().selectMopla(this);

      var bwlev = pv.getModelById(this, bwlev_id);

      var play_request = pv.create(PlayRequest, {
        wanted_file: this
      }, {
        nestings: {
          bwlev: bwlev
        }
      }, bwlev, this.app);

      if (this.player) {
        this.player.requestPlay(play_request);
      }

      // this.map_parent.playSelectedByUser(this);

      // this.makeSongPlayalbe(true);
    },

    switchPlay: function(bwlev_id) {
      //

      if (this.state('selected')){

        if (this.state('play') == 'play'){
          this.pause();
        } else {
          this.requestPlay(bwlev_id);
          // this.RPCLegacy('trigger', 'want-to-play-sf');
          //_this.RPCLegacy('play');
        }
      } else {
        this.requestPlay(bwlev_id);
        // this.RPCLegacy('trigger', 'want-to-play-sf');
      }
    },

    getTitle: function() {
      return this.state('title');
    },

    'stch-load_file': finup(function(target, state) {
      if (state) {

        target.load();
      } else {
        target.removeCache();
      }
    }),

    events: {
      finish: function(){
        pvUpdate(this, 'play', null);
      },
      play: function(){
        pvUpdate(this, 'play', 'play');
      },
      playing: function(opts){
        var dec = opts.position/opts.duration;
        pvUpdate(this, 'playing_progress', dec);
        pvUpdate(this, 'loaded_duration', opts.duration);
      },
      buffering: function(state) {
        pvUpdate(this, 'buffering_progress', !!state);
      },
      loading: function(opts){
        var factor;
        if (opts.loaded && opts.total){
          factor = opts.loaded/opts.total;
        } else if (opts.duration && opts.fetched){
          factor = opts.fetched/opts.duration;
        }
        if (factor){
          pvUpdate(this, 'loading_progress', factor);
        }
      },
      pause: function(){
        if (this.state('play') === null) {
          // `stoped` should not become `paused`
          return;
        }
        pvUpdate(this, 'play', false);
      },
      stop: function(){
        pvUpdate(this, 'play', null);
      },
      error: function() {
        var d = new Date();
        pvUpdate(this, "error", d);
        if (this.parent){
          this.parent.error = d;
        }

        var _this = this;
        app_serv.getInternetConnectionStatus(function(has_connection) {
          if (has_connection) {
            var pp = _this.state("playing_progress");
            if (!pp){
              _this.failPlaying();
            } else {

              setTimeout(function() {
                if (_this.state("playing_progress") == pp){
                  _this.failPlaying();
                }
              }, 3500);
            }

          }
        });
      }
    },

    failPlaying: function() {
      var old_fails = pvState(this, 'unavailable') || 0;

      var fails = old_fails + 1;

      pvUpdate(this, 'unavailable', fails);

      this.markParentFailed(fails);

      this.trigger("unavailable");
    },

    markParentFailed: function (fails) {
      if (this.parent){
        this.parent.unavailable = fails;
      }
    },

    setPlayer: function(player){
      if (player){
        this.player = player;
        player.attachSong(this);
      }
      return this;
    },

    _createSound: function(){
      if (!this.sound){
        this.sound = !!this.player.create(this);
      }
    },

    play: function(){
      if (this.player){
        if (this.mo.state('forbidden_by_copyrh')) {
          return;
        }
        this._createSound();
        if (this.sound){
          this.player.play(this);
          return true;
        }

      }
    },

    removeCache: function(){
      if (this.unloadOutBox){
        this.unloadOutBox();
      }
      this.player.remove(this);
      this.sound = null;
    },

    stop: function(){
      if (this.player){
        this.pause();
        this.setPosition(0, false, true);
        this.removeCache();

        pvUpdate(this, 'play', null);
        pvUpdate(this, 'loading_progress', 0);
        pvUpdate(this, 'playing_progress', 0);

        this.sound = null;
      }
    },

    pause: function(){
      if (this.player){
        this.player.pause(this);
      }
    },

    setVolumeByFactor: function(fac){
      this.setVolumeByFactor(false, fac);
    },

    setVolume: function(vol, fac){
      if (this.player){
        this.player.setVolume(this, vol, fac);
      }
    },

    getDuration: function(){
      return this.duration || this.state('loaded_duration');
    },

    setPositionByFactor: function(fac){
      this.setPosition(false, fac);
    },

    setPosition: function(pos, fac, not_submit){
      if (this.player){
        this.player.setPosition(this, pos, fac);
        if (!not_submit){
          this.mo.posistionChangeInMopla(this);
        }



      }
    },

    load: function(){
      if (this.player){
        if (this.loadOutBox){
          this.loadOutBox();
        }
        this._createSound();
        if (this.sound){
          this.player.load(this);
        }

      }
    },

    activate: function() {
      pvUpdate(this, 'selected', true);
    },

    deactivate: function() {
      pvUpdate(this, 'selected', false);
    },

    markAsPlaying: function() {

    },

    unmarkAsPlaying: function() {

    }
  };
}
var SongFileModel = spv.inh(SongFileModelBase, {
  init: initSFModel,
});

SongFileModel.FileInTorrent = FileInTorrent;
SongFileModel.SongFileModelBase = SongFileModelBase;
return SongFileModel;
});
