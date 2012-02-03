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
				sendMsg('error', this.sID);
			}
		};
	};

	sm2internal = function(path, opts) {
		var sendMsg = function() {
			
		};


		this.soundSample = createSoundSample(sendMsg);

		var sm2opts = {
			flashVersion : 9,
			useFlashBlock : true,
			debugMode : false,
			wmode : 'opaque',
			useHighPerformance : true
		};
		if (opts && opts === Object(opts)){
			cloneObj(  sm2opts, opts  );
		}
		var _this = this;
		var soundManager = new SoundManager(path || 'swf', false, sm2opts);
		soundManager.onready(function() {
			if (soundManager.supported()) {
				console.log(' internal sm2 ok')
				_this.sm2Loaded(soundManager);
			} else {
				_this.sm2Loaded();
				console.log('internal sm2 notok')
		
			}
		});
		this.c = soundManager.getC();
	};

	sm2internal.prototype = {
		fail: function() {
			this.def.fail(cb);
			return this;
		},
		done: function() {
			this.def.done(cb);
			return this;
		},
		getC: function() {
			return this.c;
		},
		sm2Feedback: function() {
			if (this.subr){
				this.subr.apply(this, arguments);
			}
		},
		sm2Loaded: function(sm2) {
			if (sm2){
				this.sm2 = sm2;
				this.def.resolve()
			} else {
				this.def.reject()
			}
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
				this.plc[method](this.sm2.getSoundById(id), opts);
			}	
		},

		create: function(id, opts){
			this.callCore('create', id, opts);
		},
		play: function(id){
			this.callCore('play', id);
		},
		stop: function(id){
			this.callCore('stop', id);
		},
		pause: function(id){
			this.callCore('pause', id);
		},
		setVolume: function(id, vol){
			this.callCore('setVolume', id, vol);
		},
		setPosition: function(id, pos){
			this.callCore('setPosition', id, pos);
		},
		remove: function(id){
			this.callCore('remove', id);
		},
		load: function(id){
			this.callCore('load', id);
		},
		unload: function(id){
			this.callCore('load', id);
		}
	};



})();

