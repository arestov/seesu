define(['./UserPlaylists', 'app_serv'], function(UserPlaylists, app_serv){
"use strict";
var localize = app_serv.localize;
var SuUsersPlaylists = function() {};
UserPlaylists.extendTo(SuUsersPlaylists, {
	init: function(opts) {
		this._super(opts);
		this
			.on('each-playlist-change', function() {
				su.trackEvent('song actions', 'add to playlist');
			});
		this.updateManyStates({
			'nav_title':  localize('playlists'),
			'url_part': '/playlists'
		});
	},
	saveToStore: function(value) {
		app_serv.store('user_playlists', value, true);
	},
	createEnvPlaylist: function(params) {
		return su.createSonglist(this, params);
	}
});

return SuUsersPlaylists;
});