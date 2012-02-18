(function() {
	var createSoundSample = function(cb) {
		return {
			onplay: function(){
				cb('play', this.sID)
			},
			onresume: function(){
				cb('play', this.sID)
			},
			onpause: function(){
				cb('pause', this.sID)
			},
			onstop: function(){
				cb('stop', this.sID)
			},
			onfinish: function(){
				cb('finish', this.sID)
			},
			whileplaying: function(){
				cb('playing', this.sID, {
					duration:  (this.bytesTotal * this.duration)/this.bytesLoaded,
					position: this.position
				});
			},
			whileloading: function(){
				cb('loading', this.sID, {
					total: this.bytesTotal,
					loaded: this.bytesLoaded
				});
			},
			ondataerror: function(){
				cb('error', this.sID);
			}
		};
	};

	html5AudioCore = function(path, opts) {
		var _this = this;
		this.sounds_store = {};
	};

	html5AudioCore.prototype = {
		subscribe: function(cb){
			this.subr = cb;
			return this;
		},
		desubscribe: function(cb){
			if (this.subr === cb){
				delete this.subr;
			}
		},
		getSound: function(id) {
			return this.sounds_store[id];
		},
		plc: {
			create: function(s, opts){
				if (!s || s.url != opts.url){
					if (s){
						s.destroySound()
					}
					var sound_options = cloneObj({}, this.soundSample);
					sound_options.id = opts.id;
					sound_options.url = opts.url;

					if (opts.volume){
						sound_options.volume = parseFloat(opts.volume);
					}
					this.sm2.createSound(this.sound_options);
				}
			},
			play: function(s){
				s.play();
			},
			stop: function(s){
				if (s){
					s.stop();
				}
			},
			pause: function(s){
				if (s){
					s.pause();
				}
			},
			setVolume: function(s, vol){
				if (s){
					s.setVolume(parseFloat(vol));
				}
			},
			setPosition: function(s, pos){
				if (s){
					s.setPosition(parseFloat(pos));
				}
			},
			remove: function(s){
				if (s){
					s.destruct();
				}
			},
			load: function(s){
				if (s){
					s.load();
				}
			},
			unload: function(s){
				if (s){
					s.unload();
				}
			}
		},

		callCore: function(method, id, opts) {
			if (this.sm2 && method && this.plc[method] && id){
				if (opts && opts === Object(opts)){
					cloneObj(opts, {id: id});
				}
				this.plc[method].call(this, this.sm2.getSoundById(id), opts);
			}	
		},
		callSongMethod: function() {
			this.callCore.apply(this, arguments)
		}
	};
})();

