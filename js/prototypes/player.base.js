
var playerBase = function(){};
playerBase.prototype = new servModel();

cloneObj(playerBase.prototype, {
	constructor: playerBase,
	global_volume: true,
	init: function(volume){
		servModel.prototype.init.call(this);
		this.song_files = {};
		this.attached = {};
	},
	volume: 100,
	setCore: function(core){
		if (!this.subscriber){
			var _this = this;
			this.subscriber = function(){
				_this.fireCoreEvent.apply(_this, arguments);
			};
		}
		if (this.core){
			this.core.desubscribe(this.subscriber)
		}

		this.core = core;
		core.subscribe(this.subscriber);
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

			this.fire(event_name, {
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
			this.core.create(song_file.uid, {
				url: song_file.link
			});
		}
	},
	play: function(song_file){
		if (song_file && this.core){
			this.core.play(song_file.uid);
			if (this.global_volume){
				this.setVolume(song_file, this.volume);
			}
			
		}
	},
	stop: function(song_file){
		if (song_file && this.core){
			this.core.stop(song_file.uid);
		}
	},
	pause: function(song_file){
		if (song_file && this.core){
			this.core.pause(song_file.uid);
		}
	},
	setVolume: function(song_file, vol){
		if (song_file && this.core){
			this.core.setVolume(song_file.uid, vol)
		}
		if (this.global_volume){
			if (this.saveVolume){
				this.saveVolume(vol)
			}
			this.volume = vol;
		}
	},
	setPosition: function(song_file, pos){
		if (song_file && this.core){
			this.core.setPosition(song_file.uid, pos);
		}
	},
	load: function(song_file){
		if (song_file && this.core){
			this.core.load(song_file.uid);
		}
	},
	unload: function(song_file){
		if (song_file && this.core){
			this.core.unload(song_file.uid);
		}
	},
	remove: function(song_file){
		if (song_file && this.core){
			this.core.remove(song_file.uid);
		}
	}
});
