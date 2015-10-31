define(['./UserPlaylists', 'app_serv'], function(UserPlaylists, app_serv){
"use strict";
var localize = app_serv.localize;
var SuUsersPlaylists = function() {};
UserPlaylists.extendTo(SuUsersPlaylists, {
	init: function(opts) {
		this._super.apply(this, arguments);
		this
			.on('each-playlist-change', function() {
				su.trackEvent('song actions', 'add to playlist');
			});
		this.updateManyStates({
			'nav_title':  localize('playlists'),
			'url_part': '/playlists'
		});
		this.app.gena = this;

		var plsts_str = app_serv.store('user_playlists');
		if (plsts_str){
			this.setSavedPlaylists(plsts_str);
		}
	},
	saveToStore: function(value) {
		app_serv.store('user_playlists', value, true);
	},
	createEnvPlaylist: function(params) {
		return this.app.createSonglist(this, params);
	}
});

return SuUsersPlaylists;
});
