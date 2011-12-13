(function(){
	var counter = 0;
	songFileModel = function(file, mo){
		servModel.prototype.init.call(this);
		this.mo = mo;
		for (var a in file){
			if (typeof file[a] != 'function' && typeof file[a] != 'object'){
				this[a] = file[a];
			}
		}
		this.uid = counter++;
	};
	songFileModel.prototype = new servModel();
	cloneObj(songFileModel.prototype, {
		events: {
			finish: function(opts){
				
			},
			play: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					if (!mo.start_time){
						//fixme
						mo.start_time = ((new Date()).getTime()/1000).toFixed(0);
					}
				}
				
			},
			playing: function(opts){
				var dec = opts.total/opts.duration;
				this.updateState('playing-progress', dec);
			},
			loading: function(opts){
				var dec = opts.total/opts.duration;
				this.updateState('loading-progress', dec);

				
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.waitToLoadNext(dec > 0.8);
				}

				
				
			},
			pause: function(opts){
				
			},
			stop: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					delete mo.start_time;
				}
			}
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
				this.player.create(this);
				this.sound = true;
			}
		},
		play: function(){
			if (this.player){
				this._createSound();
				this.player.play(this);
			}
		},
		stop: function(){
			if (this.player){
				this.player.stop(this);
				this.player.remove(this);
				delete this.sound;
			}
		},
		pause: function(){
			if (this.player){
				this.player.pause(this);
			}
		},
		setVolume: function(vol){
			if (this.player){
				this.player.setVolume(this, vol);
			}
		},
		setPosition: function(pos){
			if (this.player){
				this.player.setPosition(this, pos);
			}
		},
		load: function(){
			if (this.player){
				this._createSound();
				this.player.load(this);
			}
		}
	});
})()


