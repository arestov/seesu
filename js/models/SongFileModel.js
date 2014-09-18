define(['pv', 'app_serv', 'spv'], function(pv, app_serv, spv){
"use strict";
var app_env = app_serv.app_env;



var MusicFile = function() {};
pv.Model.extendTo(MusicFile, {
	init: function(opts, data) {
		this._super();
		this.updateManyStates(data);
		models: {}
	},
	getSongFileModel: function(mo, player){
		if (!this.models[mo.uid]) {
			this.models[mo.uid] = new SongFileModel();
			this.models[mo.uid].init({file: this, mo: mo}).setPlayer(player);
		}
		return this.models[mo.uid];
	}
});

var FileInTorrent = function(sr_item){
	this.sr_item = sr_item;
	this.init();
};

pv.Model.extendTo(FileInTorrent, {
	model_name: 'file-torrent',
	init: function() {
		this._super();
		this.updateManyStates({
			full_title: this.sr_item.title || app_serv.getHTMLText(this.sr_item.HTMLTitle),
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
		this.updateState('download-pressed', true);
	}
});


	var counter = 0;
	var SongFileModel = function(){};
	pv.Model.extendTo(SongFileModel, {
		model_name: 'file-http',
		init: function(opts) {
			this._super();
			if (opts.mo){
				this.mo = opts.mo;
			}
			if (opts.file){
				var file = opts.file;
				for (var a in file){
					if (typeof file[a] != 'function' && typeof file[a] != 'object'){
						this[a] = file[a];
					}
				}
				this.parent = file;
			}


			this.uid = 'song-file-' + counter++;
			this.createTextStates();
			if (opts.player) {
				this.setPlayer(opts.player);
			}
			return this;
		},
		createTextStates: function() {
			var states = {};
			states['title'] = this.getTitle();
			if (this.from){
				states['source_name'] = this.from;
			}
			if (this.description){
				states['description'] = this.description;
			}
			if (this.duration){
				states['duration'] = this.duration;
			}
			this.updateManyStates(states);
		},
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
		getNiceSeconds: function(state) {
			if (typeof state == 'number'){
				var duration = Math.round(state/1000);
				if (duration){
					var digits = duration % 60;
					return  spv.zerofyString(Math.floor(duration/60), 2) + ':' + spv.zerofyString(digits, 2);
				}
			}
		},
		'compx-visible_duration_text': [
			['visible_duration'],
			function (state) {
				return this.getNiceSeconds(state);
			}
		],
		'compx-play_position_text': [
			['play_position'],
			function (state) {
				return this.getNiceSeconds(state);
			}
		],
		'compx-load_file': [
			['file_to_load-for-player_song', 'file_to_load-for-preload_current_file'],
			function(player_song, preload_current_file) {
				return this.utils.isDepend(player_song) || this.utils.isDepend(preload_current_file);
			}
		],
		'stch-load_file': function(state) {
			if (state) {
				
				this.load();
			} else {
				this.removeCache();
			}
		},
		getTitle: function() {
			var title = [];

			if (this.artist){
				title.push(this.artist);
			}
			if (this.track){
				title.push(this.track);
			}
			return title.join(' - ');
		},
		events: {
			finish: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			play: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', 'play');
					if (!mo.start_time){
						//fixme
						mo.start_time = (Date.now()/1000).toFixed(0);
					}
				}
				this.updateState('play', 'play');
			},
			playing: function(opts){
				var dec = opts.position/opts.duration;
				this.updateState('playing_progress', dec);
				this.updateState('loaded_duration', opts.duration);
			},
			buffering: function(state) {
				this.updateState('buffering_progress', !!state);
			},
			loading: function(opts){
				var factor;
				if (opts.loaded && opts.total){
					factor = opts.loaded/opts.total;
				} else if (opts.duration && opts.fetched){
					factor = opts.fetched/opts.duration;
				}
				if (factor){
					this.updateState('loading_progress', factor);
				}
			},
			pause: function(){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			stop: function(){
				//throw "Do not rely on stop event"
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			error: function() {
				var d = new Date();
				this.updateState("error", d);
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
			this.updateState("unavailable", true);
			if (this.parent){
				this.parent.unavailable = true;
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

				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}

				this.updateState('play', false);
				this.updateState('loading_progress', 0);
				this.updateState('playing_progress', 0);
				
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
			this.updateState('selected', true);
		},
		deactivate: function() {
			this.updateState('selected', false);
		},
		markAsPlaying: function() {
			
		},
		unmarkAsPlaying: function() {
			
		}
	});

SongFileModel.FileInTorrent = FileInTorrent;
return SongFileModel;
});