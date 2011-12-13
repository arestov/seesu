
var playerBase = function(){};
cloneObj(playerBase.prototype, {
	global_volume: true,
	init: function(volume){
		this.songFiles = {};
		this.volume = volume || 100;
	},
	setCore: function(core){
		if (!this.subscriber){
			_this = this;
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
	fireCoreEvent: function(id, event_name, opts){
		console.log(arguments);
	},
	attachSong: function(songFile){
		this.songFiles[songFile.uid] = songFile
	},
	dettachSong: function(songFile){
		delete this.songFiles[songFile.uid];
	},


	create: function(songFile){
		if (songFile && this.core){
			this.core.create(songFile.uid, {
				url: songFile.link
			});
		}
	},
	play: function(songFile){
		if (songFile && this.core){
			this.core.play(songFile.uid);
			if (this.global_volume){
				this.setVolume(songFile, this.volume);
			}
			
		}
	},
	stop: function(songFile){
		if (songFile && this.core){
			this.core.stop(songFile.uid);
		}
	},
	pause: function(songFile){
		if (songFile && this.core){
			this.core.pause(songFile.uid);
		}
	},
	setVolume: function(songFile, vol){
		if (songFile && this.core){
			this.core.setVolume(songFile.uid, vol)
		}
	},
	setPosition: function(songFile, pos){
		if (songFile && this.core){
			this.core.setPosition(songFile.uid, pos);
		}
	},
	load: function(songFile){
		if (songFile && this.core){
			this.core.load(songFile.uid);
		}
	},
	unload: function(songFile){
		if (songFile && this.core){
			this.core.unload(songFile.uid);
		}
	},
	remove: function(songFile){
		if (songFile && this.core){
			this.core.remove(songFile.uid);
		}
	}
});
