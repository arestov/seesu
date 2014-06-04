define(['provoda'], function(provoda) {
'use strict';
var PlayerBase = function(){};
provoda.Eventor.extendTo(PlayerBase, {
	constructor: PlayerBase,
	global_volume: true,
	init: function(){
		this._super();
		this.song_files = {};
		this.attached = {};
	},
	'regfr-cready': {
		event_name: 'core-ready',
		fn: function() {
			if (this.core){
				return true;
			}
		}
	},
	'regfr-cfail': {
		event_name: 'core-fail',
		fn: function() {
			if (this.core_failed){
				return true;
			}
		}
	},

	setFail: function() {
		this.core_failed = true;
		this.trigger('core-fail');
	},
	setCore: function(core){
		if (core == this.core){
			return;
		}
		
		if (!this.subscriber){
			var _this = this;
			this.subscriber = function(){
				_this.fireCoreEvent.apply(_this, arguments);
			};
		}
		if (this.core){
			this.core.desubscribe(this.subscriber);
		}

		this.core = core;
		core.subscribe(this.subscriber);
		this.core_failed = null;
		this.trigger('core-ready');
	},
	fireCoreEvent: function(event_name, id, opts){
		var song_file = this.song_files[id],
			attached =  this.attached[id];

			if (song_file && song_file.events && song_file.events[event_name]){
				song_file.events[event_name].call(song_file, opts);
			}

			if (song_file && attached && this.events && this.events[event_name]){
				this.events[event_name].call(this, {
					song_file: song_file,
					song_id: id,
					opts: opts
				});
			}

			this.trigger(event_name, {
				song_file: song_file,
				song_id: id,
				opts: opts
			});
	},
	attachSong: function(song_file){
		this.song_files[song_file.uid] = song_file;
		this.attached[song_file.uid] = true;
	},
	dettachSong: function(song_file){
		delete this.attached[song_file.uid];
	},
	create: function(song_file){
		if (song_file && this.core){
			if (!song_file.link){
				throw new Error('give me url of file!');
			}
			this.core.callSongMethod("create", song_file.uid, {
				url: song_file.link
			});
			return true;
		}
	},
	play: function(song_file){
		if (song_file && this.core){
			this.core.callSongMethod("play", song_file.uid);
			if (this.global_volume && (this.volume || this.volume_fac)){
				this.setVolume(song_file, this.volume, this.volume_fac);
			}
			return true;
		}
	},
	pause: function(song_file){
		if (song_file && this.core){
			this.core.callSongMethod("pause", song_file.uid);
			return true;
		}
	},
	setVolume: function(song_file, vol, fac){
		vol = parseFloat(vol);
		if ((!fac || (fac.length < 2)) && isNaN(vol)){
			vol = 100;
			console.log('wrong volume value')
		}
		if (song_file && this.core){
			this.core.callSongMethod("setVolume", song_file.uid, vol, fac);
		}
		if (this.global_volume){
			this.volume_fac = fac;
			this.volume = vol;
		}
		if (this.core){
			return true;
		}
	},
	setPosition: function(song_file, pos, fac){
		if (song_file && this.core){
			this.core.callSongMethod("setPosition", song_file.uid, pos, fac);
			return true;
		}
	},
	load: function(song_file){
		if (song_file && this.core){
			this.core.callSongMethod("load", song_file.uid);
			return true;
		}
	},
	unload: function(song_file){
		if (song_file && this.core){
			this.core.callSongMethod("unload", song_file.uid);
			return true;
		}
	},
	remove: function(song_file){
		if (song_file && this.core){
			this.core.callSongMethod("remove", song_file.uid);
			return true;
		}
	}
});
return PlayerBase;
});