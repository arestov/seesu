define(function(require) {
'use strict';
var UserPlaylists = require('./UserPlaylists');
var app_serv = require('app_serv');
var spv = require('spv');

var SuUsersPlaylists = spv.inh(UserPlaylists, {
  init: function(target) {
    target
      .on('each-playlist-change', function() {
        target.app.trackEvent('song actions', 'add to playlist');
      });

    target.app.gena = target;

    var plsts_str = app_serv.store('user_playlists');
    if (plsts_str){
      target.setSavedPlaylists(plsts_str);
    }
  }
}, {
  saveToStore: function(value) {
    app_serv.store('user_playlists', value, true);
  },
  createEnvPlaylist: function(params) {
    return this.app.createSonglist(this, params);
  }
});

return SuUsersPlaylists;
});
