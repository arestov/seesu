var soundManager;
(function() {
'use strict';
	var createSoundSample = function(cb) {
		return {
			multiShot: false,
			volume: 100,
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

	window.sm2internal = function(path, opts) {
		var _this = this;

		var sendMsg = function() {
			if (_this.subr){
				_this.subr.apply(this, arguments);
			}
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


		soundManager = new SoundManager(path || 'swf', false, sm2opts);
		soundManager.onready(function() {
			if (soundManager.supported()) {
				console.log(' internal sm2 ok')
				_this.sm2Loaded(soundManager);
			} else {
				_this.sm2Loaded();
				console.log('internal sm2 notok')

			}
		});
		soundManager.ontimeout(function() {
			_this.sm2Loaded();
			console.log('internal sm2 notok')
		})
		this.sm2_newb = soundManager;

		this.c = soundManager.getC();
		this.def = $.Deferred();
	};

	window.sm2internal.prototype = {
		subscribe: function(cb){
			this.subr = cb;
			return this;
		},
		desubscribe: function(cb){
			if (this.subr === cb){
				delete this.subr;
			}
		},
		fail: function(cb) {
			this.def.fail(cb);
			return this;
		},
		done: function(cb) {
			this.def.done(cb);
			return this;
		},
		appended: function() {
			this.sm2_newb.appended();
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
					this.sm2.createSound(sound_options);
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
