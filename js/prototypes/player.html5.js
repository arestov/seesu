(function() {
	var createAE = function(id, url, cb) {
		var a = new Audio(url);
		a.volume = 1;
		addEvent(a, 'play', function(){
			cb('play', id);
		});
		addEvent(a, 'pause', function(){
			cb('pause', id);
		});
		addEvent(a, 'ended', function(){
			cb('finish', id);
		});

		/*
		addEvent(a, 'suspend', function(){
			console.log('suspend');
		});
		addEvent(a, 'emptied', function(){
			console.log('emptied');
		});
		addEvent(a, 'waiting', function(){
			console.log('waiting');
		});
		*/
		
		addEvent(a, 'timeupdate', function(){
			var current_time = a.currentTime;
			var duration = a.duration;
			cb('playing', id, {
				duration:  duration,
				position: current_time
			});
			if (a.loadme && a.networkState === 1){
				var available = a.buffered.length && a.buffered.end(0);
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
				duration: a.duration,
				fetched: a.buffered.end(0)
			});
		};
		addEvent(a, 'progress', function(e){
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
		addEvent(a, 'error', function(){
			cb('error', id);
		});
		return a;
	};
	var html5Sound = function(opts, cb) {
		this.url = opts.url;
		this.id = opts.id;
		this.cb = cb;
		this.requireAE();
		
	};
	html5Sound.prototype = {
		requireAE: function() {
			if (!this.a){
				this.a = createAE(this.id, this.url, this.cb);
			}
		},
		unload: function() {

			if (this.a){
				this.a.loadme = false;
				try {
					this.a.pause();
				} catch (e){}
				this.a.url = null;
				delete this.a;
			}
		},
		play: function() {
			
			this.requireAE();
			this.a.loadme = true;
			this.a.play();
		},
		load: function() {
			
			this.requireAE();
			this.a.loadme = true;
			if (this.a.networkState === 0){
				this.a.load();
			}
			
		},
		stop: function() {
			
			try{
				this.a.loadme = false;
				this.a.pause();
				this.a.currentTime = 0;
			} catch(e){}
		},
		pause: function() {
			this.a.loadme = false;
			this.a.pause();
		},
		setVolume: function(vol) {
			this.a.volume = vol/100;
		},
		setPosition: function(pos) {
			var target_pos;
			var available;
			
			try{
				available = this.a.buffered.end(0);
				if (available){
					if (pos > available){
						if (available > 2){
							target_pos = Math.min(available - 2, pos);
						}
						
					} else {
						target_pos = Math.max(0, pos);
					}

					this.a.currentTime = target_pos;
				}
				
				
				
			} catch(e){}
			
			
		}
	};


	html5AudioCore = function(path, opts) {
		var _this = this;
		this.sounds_store = {};
		this.feedBack = function() {
			if (_this.subr){
				_this.subr.apply(_this, arguments);
			}
		};
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

		createSound: function(opts) {
			if (!this.sounds_store[opts.id]){
				this.sounds_store[opts.id] = new html5Sound(opts, this.feedBack);
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
			if (method && this.plc[method] && id){
				if (opts && opts === Object(opts)){
					cloneObj(opts, {id: id});
				}
				this.plc[method].call(this, this.getSound(id), opts);
			}	
		},
		callSongMethod: function() {
			this.callCore.apply(this, arguments);
		}
	};
})();

