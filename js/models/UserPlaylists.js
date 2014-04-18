define(['js/libs/BrowseMap', 'spv'], function(BrowseMap, spv){
"use strict";

var UserPlaylists = function() {};
BrowseMap.Model.extendTo(UserPlaylists, {
	model_name: 'user_playlists',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.playlists = [];
		this.updateNesting('lists_list', this.playlists);
	},
	preview_nesting_source: 'lists_list',
	savePlaylists: function(){
		var _this = this;
		if (this.save_timeout){clearTimeout(this.save_timeout);}

		this.save_timeout = setTimeout(function(){
			var plsts = [];
			var playlists = _this.playlists;
			for (var i=0; i < playlists.length; i++) {
				plsts.push(playlists[i].simplify());
			}
			_this.saveToStore(plsts);

		},10);

	},
	matchTitleStrictly: function(title) {
		var matched;
		for (var i = 0; i < this.playlists.length; i++) {
			var cur = this.playlists[i];
			if (cur.info && cur.info.name == title){
				matched = cur;
				break;
			}
		}
		return matched;
	},
	findAddPlaylist: function(title, mo) {
		var matched = this.matchTitleStrictly(title);
		matched = matched || this.createUserPlaylist(title);
		matched.add(mo);
	},

	createUserPlaylist: function(title){

		var pl_r = this.createEnvPlaylist({
			title: title,
			type: "cplaylist",
			data: {name: title}
		});
		this.watchOwnPlaylist(pl_r);
		this.playlists.push(pl_r);
		this.updateNesting('lists_list', this.playlists);
		this.trigger('playlsits-change', this.playlists);
		return pl_r;
	},
	watchOwnPlaylist: function(pl) {
		var _this = this;
		pl.on('child_change-songs-list', function() {
			this.trigger('each-playlist-change');
			_this.savePlaylists();
		}, {
			skip_reg: true
		});
	},
	removePlaylist: function(pl) {
		var length = this.playlists.length;
		this.playlists = spv.arrayExclude(this.playlists, pl);
		if (this.playlists.length != length){
			this.trigger('playlsits-change', this.playlists);
			this.updateNesting('lists_list', this.playlists);
			this.savePlaylists();
		}

	},
	rebuildPlaylist: function(saved_pl){
		var p = this.createEnvPlaylist({
			title: saved_pl.playlist_title,
			type: saved_pl.playlist_type,
			data: {name: saved_pl.playlist_title}
		});
		for (var i=0; i < saved_pl.length; i++) {
			p.addDataItem(saved_pl[i]);
		}
		this.watchOwnPlaylist(p);
		return p;
	},
	setSavedPlaylists: function(spls) {
		var recovered = [];

		if (spls){
			for (var i=0; i < spls.length; i++) {
				recovered[i] = this.rebuildPlaylist(spls[i]);
			}
		}

		this.playlists = recovered;
		this.trigger('playlsits-change', this.playlists);
		this.updateNesting('lists_list', this.playlists);
	}
});
return UserPlaylists;
});