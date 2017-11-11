define(function(require) {
'use strict';
var spv = require('spv');

	var createAE = function(id, url, cb) {
		var a = new Audio(url);
		a.volume = 1;
		spv.addEvent(a, 'play', function(){
			cb('play', id);
		});
		spv.addEvent(a, 'pause', function(){
			cb('pause', id);
		});
		spv.addEvent(a, 'ended', function(){
			cb('finish', id);
		});

		/*
		spv.addEvent(a, 'suspend', function(){
			console.log('suspend');
		});
		spv.addEvent(a, 'emptied', function(){
			console.log('emptied');
		});
		spv.addEvent(a, 'waiting', function(){
			console.log('waiting');
		});
		*/

		spv.addEvent(a, 'timeupdate', function(){
			var current_time = a.currentTime * 1000;
			var duration = a.duration * 1000;
			cb('playing', id, {
				duration:  duration,
				position: current_time
			});
			if (a.loadme && a.networkState === 1){
				var available = a.buffered.length && (a.buffered.end(0) * 1000);
				if (available && available < duration && (available - current_time < 1.5)){
			//		a.pause();
			//		a.play();
				//	a.load();
				}
			}
		});
		var at_finish;
		var fireProgress = function() {
			cb('loading', id, {
				duration: a.duration * 1000,
				fetched: a.buffered.length && (a.buffered.end(0) * 1000)
			});
		};
		spv.addEvent(a, 'progress', function(){
			clearTimeout(at_finish);
			if (a.buffered.length){
				fireProgress();
				if (a.buffered.end(0)/a.duration != 1){
					at_finish = setTimeout(function() {
						fireProgress();
					}, 5000);
				}
			}
		});
		spv.addEvent(a, 'error', function(){
			cb('error', id);
		});
		return a;
	};
	var Html5Sound = function(opts, cb) {
		this.url = opts.url;
		this.id = opts.id;
		this.cb = cb;
		this.requireAE();

	};
	Html5Sound.prototype = {
		requireAE: function() {
			if (!this.a){
				this.a = createAE(this.id, this.url, this.cb);
			} else if (!this.a.src){
				this.a.src = this.url;
			}
		},
		clearLoad: function() {
			if (this.a && this.a.loadme){
				this.a.loadme = false;
			}
		},
		unload: function() {

			if (this.a){
				this.clearLoad();
				try {
					this.a.pause();
				} catch (e){}
				// this.a.src = null;
				delete this.a.src;
			}
		},
		play: function() {

			this.requireAE();
			var audio = this.a;
			var promise = this.a.play();
			this.a.play_promise = promise;
			if (!promise) {
				return;
			}

			var rem = function() {
				if (audio.play_promise === promise) {
					audio.play_promise = null;
				}
			}

			promise.then(rem, rem);
		},
		load: function() {

			this.requireAE();
			if (this.a.networkState === 0){
				this.a.load();
			}

		},
		stop: function() {

			try{
				this.clearLoad();
				this.a.pause();
				this.a.currentTime = 0;
			} catch(e){}
		},
		pause: function() {
			//this.a.loadme = false;
			var audio = this.a;

			if (!audio.play_promise) {
				audio.pause();
				return;
			}

			var self = this;
			audio.play_promise.then(function() {
				if (self.a === audio) {
					audio.pause();
				}
			});
		},
		setVolume: function(vol, fac) {
			if (fac){
				this.a.volume = fac[0]/fac[1];
			} else {
				this.a.volume = vol/100;
			}

		},
		setPosition: function(pos, fac) {
			/*
			0 = HAVE_NOTHING - no information whether or not the audio/video is ready
			1 = HAVE_METADATA - metadata for the audio/video is ready
			2 = HAVE_CURRENT_DATA - data for the current playback position is available, but not enough data to play next frame/millisecond
			3 = HAVE_FUTURE_DATA - data for the current and at least the next frame is available
			4 = HAVE_ENOUGH_DATA - enough data available to start playing
			*/

			if (this.a.readyState < 2) {
				return;
			}

			var target_pos;
			var available;
			var possible_position;

			try{
				available = this.a.buffered.length && this.a.buffered.end(0);
				if (fac){
					possible_position = this.a.duration * fac[0]/fac[1];
				} else {
					possible_position = pos;
				}
				if (available){
					if (possible_position > available){
						if (available > 2){
							target_pos = Math.min(available - 2, possible_position);
						}

					} else {
						target_pos = Math.max(0, possible_position);
					}

					this.a.currentTime = target_pos;
				}



			} catch(e){}


			}
	};


	var AudioCoreHTML5 = function(path, opts) {
		var _this = this;
		this.sounds_store = {};
		this.feedBack = function() {
			if (_this.subr){
				_this.subr.apply(_this, arguments);
			}
		};
	};

	AudioCoreHTML5.prototype = {
		subscribe: function(cb){
			this.subr = cb;
			return this;
		},
		desubscribe: function(cb){
			if (this.subr === cb){
				delete this.subr;
			}
		},

		createSound: function(opts) {
			if (!this.sounds_store[opts.id]){
				this.sounds_store[opts.id] = new Html5Sound(opts, this.feedBack);
			}
		},
		removeSound: function(id) {
			if (this.sounds_store[id]){
				this.sounds_store[id].unload();
				delete this.sounds_store[id];
			}
		},
		getSound: function(id) {
			return this.sounds_store[id];
		},
		plc: {
			create: function(s, opts){
				if (!s || s.url != opts.url){
					this.removeSound(opts.id);
					this.createSound(opts);
				}
			},
			remove: function(s){
				if (s){
					this.removeSound(s.id);
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
			setVolume: function(s, vol, fac){
				if (s){
					s.setVolume(parseFloat(vol), fac);
				}
			},
			setPosition: function(s, pos, fac){
				if (s){
					s.setPosition(parseFloat(pos), fac);
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

		callCore: function(method, id, opts, more_opts) {
			if (method && this.plc[method] && id){
				if (opts && opts === Object(opts)){
					spv.cloneObj(opts, {id: id});
				}
				this.plc[method].call(this, this.getSound(id), opts, more_opts);
			}
		},
		callSongMethod: function() {
			this.callCore.apply(this, arguments);
		}
	};

return AudioCoreHTML5;
});
