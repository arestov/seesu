define(['pv', 'app_serv', 'spv', './PlayRequest'], function(pv, app_serv, spv, PlayRequest){
"use strict";
var app_env = app_serv.app_env;

var finup = function(callback) {
	callback.finup = true;
	return callback;
};

var pvState = pv.state;
var pvUpdate = pv.update;

var FileInTorrent = function(){};
pv.Model.extendTo(FileInTorrent, {
	model_name: 'file-torrent',
	init: function(opts, states, params) {
		this._super.apply(this, arguments);
		this.sr_item = params.file;
		this.updateManyStates({
			full_title: this.sr_item.title,
			torrent_link: this.sr_item.torrent_link
		});
	},
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
		pv.update(this, 'download-pressed', true);
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
		self.sound = null;

		self.mo = self.map_parent.map_parent;

		if (params.file){
			var file = params.file;
			for (var a in file){
				if (typeof file[a] != 'function' && typeof file[a] != 'object'){
					// self[a] = file[a];
					pvUpdate(self, a, file[a]);
				}
			}
			self.parent = file;
		}

		self.setPlayer(self.app.p);

		return self;
	};

var SongFileModel = spv.inh(pv.Model, {
	naming: function(fn) {
		return function SongFileModel(opts, states, params) {
			fn(this, opts, states, params);
		};
	},
	init: initSFModel,
	props: props()
});

function props() {
	return {
		model_name: 'file-http',
		requestPlay: function(bwlev_id) {
			this.map_parent.selectMopla(this);

			var bwlev = pv.getModelById(bwlev_id);

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
		'compx-title': [
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
		'compx-source_name': [['from']],
		'compx-visible_duration': [
			['duration', 'loaded_duration'],
			function(duration, loaded_duration) {
				return duration || loaded_duration;
			}
		],
		'compx-play_position': [
			['visible_duration', 'playing_progress'],
			function(duration, playing_progress) {
				return Math.round(duration * playing_progress);
			}
		],

		'compx-visible_duration_text': [
			['visible_duration'],
			function (state) {
				return getNiceSeconds(state);
			}
		],
		'compx-play_position_text': [
			['play_position'],
			function (state) {
				return getNiceSeconds(state);
			}
		],
		'compx-load_file': [
			['file_to_load-for-player_song', 'file_to_load-for-preload_current_file'],
			function(player_song, preload_current_file) {
				return isDepend(player_song) || isDepend(preload_current_file);
			}
		],
		'stch-load_file': finup(function(target, state) {
			if (state) {

				target.load();
			} else {
				target.removeCache();
			}
		}),
		events: {
			finish: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				// if (mo){
				// 	pv.update(mo, 'play', false);
				// }
				pv.update(this, 'play', false);
			},
			play: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					// pv.update(mo, 'play', 'play');
					if (!mo.start_time){
						//fixme
						mo.start_time = (Date.now()/1000).toFixed(0);
					}
				}
				pv.update(this, 'play', 'play');
			},
			playing: function(opts){
				var dec = opts.position/opts.duration;
				pv.update(this, 'playing_progress', dec);
				pv.update(this, 'loaded_duration', opts.duration);
			},
			buffering: function(state) {
				pv.update(this, 'buffering_progress', !!state);
			},
			loading: function(opts){
				var factor;
				if (opts.loaded && opts.total){
					factor = opts.loaded/opts.total;
				} else if (opts.duration && opts.fetched){
					factor = opts.fetched/opts.duration;
				}
				if (factor){
					pv.update(this, 'loading_progress', factor);
				}
			},
			pause: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				// if (mo){
				// 	// pv.update(mo, 'play', false);
				// }
				pv.update(this, 'play', false);
			},
			stop: function(){
				//throw "Do not rely on stop event"
				var mo = ((this == this.mo.mopla) && this.mo);
				// if (mo){
				// 	pv.update(mo, 'play', false);
				// }
				pv.update(this, 'play', false);
			},
			error: function() {
				var d = new Date();
				pv.update(this, "error", d);
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

			if (this.parent){
				this.parent.unavailable = fails;
			}

			this.trigger("unavailable");
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

				pv.update(this, 'play', false);
				pv.update(this, 'loading_progress', 0);
				pv.update(this, 'playing_progress', 0);

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
			pv.update(this, 'selected', true);
		},
		deactivate: function() {
			pv.update(this, 'selected', false);
		},
		markAsPlaying: function() {

		},
		unmarkAsPlaying: function() {

		}
	};
}

SongFileModel.FileInTorrent = FileInTorrent;
return SongFileModel;
});
