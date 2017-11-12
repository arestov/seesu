define(function(require) {
'use strict';
var pv = require('pv');
var app_serv = require('app_serv');
var comd = require('./comd');
var Song = require('./Song');
var SongsListBase = require('./SongsListBase');
var spv = require('spv');

  var app_env = app_serv.app_env;
  var escape = window.escape;

  var ExternalTextedPlaylist = function(array){ //array = [{artist_name: '', track_title: '', duration: '', mp3link: ''}]
    this.result = this.header + '\n';
    for (var i=0; i < array.length; i++) {
      this.result += this.preline + ':' + (array[i].duration || '-1') + ',' + array[i].artist_name + ' - ' + array[i].track_title + '\n' + array[i].mp3link + '\n';
    }
    this.data_uri = this.request_header + escape(this.result);

  };
  ExternalTextedPlaylist.prototype = {
    header : '#EXTM3U',
    preline: '#EXTINF',
    request_header : 'data:audio/x-mpegurl; filename=seesu_playlist.m3u; charset=utf-8,'
  };

  var PlaylistSettingsRow = spv.inh(comd.BaseCRow, {}, {
    'compx-nav_title': [['#locales.playlist-settings']],
    actionsrow_src: '^',
    'compx-dont_rept_pl': [['#settings-dont-rept-pl']],
    setDnRp: function(state) {
      this.app.setSetting('dont-rept-pl', state);
    },
    model_name: 'row-pl-settings'
  });

  var MultiAtcsRow = spv.inh(comd.BaseCRow, {}, {
    'compx-nav_title': [['#locales.playlist-actions']],
    actionsrow_src: '^',
    makePlayable: function() {
      this.map_parent.map_parent.makePlayable(true);
      this.app.trackEvent('Controls', 'make playable all tracks in playlist');
    },
    makeExternalPlaylist: function() {
      this.map_parent.map_parent.makeExternalPlaylist();
      this.app.trackEvent('Controls', 'make *.m3u');
    },
    model_name: 'row-multiatcs'
  });

  var PlARow = spv.inh(comd.PartsSwitcher, {
    init: function(target) {
      target.pl = target.map_parent;

      pv.update(target, 'active_part', false);
    }
  }, {
    'sub_page': {
      'row-pl-settings': PlaylistSettingsRow,
      'row-multiatcs': MultiAtcsRow
    },
    'nest_posb-context_parts': ['row-multiatcs', 'row-pl-settings'],
    'compx-loader_disallowing_desc': [
      ['^loader_disallowing_desc'],
      function(loader_disallowing_desc) {
        return loader_disallowing_desc;
      }
    ]
  });

  // var SongsListBase = function() {};
  // pv.extendFromTo("SongsListBase", LoadableList, SongsListBase);


  var SongsList = spv.inh(SongsListBase, {}, {
    'nest-plarow': [PlARow],
    'compx-dont_rept_pl': [['#settings-dont-rept-pl']],
    'compx-pl-shuffle': [['#settings-pl-shuffle']],
    'nest_rqc-songs-list': Song,
    makeExternalPlaylist: function() {
      var songs_list = this.getMainlist();
      if (!songs_list.length){return false;}
      var simple_playlist = [];
      for (var i=0; i < songs_list.length; i++) {
        var song = songs_list[i].getMFCore().getFirstFile();
        if (song){
          simple_playlist.push({
            track_title: song.track,
            artist_name: song.artist,
            duration: song.duration,
            mp3link: song.link
          });
        }
      }

      if (simple_playlist.length){
        this.current_external_playlist = new ExternalTextedPlaylist(simple_playlist);
        //su.ui.els.export_playlist.attr('href', su.p.current_external_playlist.data_uri);
        if (this.current_external_playlist.result) {
          app_env.openURL(
            'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(this.current_external_playlist.result)
          );
        }

      }
    }
  });


var pvUpdate = pv.update;
var HypemPlaylist = spv.inh(SongsList, {
  init: function(target) {
    target.can_use = target.app.hypem.can_send;
    pvUpdate(target, 'browser_can_load', target.can_use);
  }
}, {
  'compx-possible_loader_disallowing': [['#locales.Hypem-cant-load']],
  page_limit: 20,
  'compx-loader_disallowing_desc': {
    depends_on: ['loader_disallowed', 'possible_loader_disallowing'],
    fn: function(disallowed, desc) {
      if (disallowed){
        return desc;
      }
    }
  },
  'compx-loader_disallowed': {
    depends_on: ['browser_can_load'],
    fn: function(can_load) {
      return !can_load;
    }
  }
});
SongsList.HypemPlaylist = HypemPlaylist;
return SongsList;
});
