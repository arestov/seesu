define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');

	var createAObj = function() {
		var au = window.document.createElement('object');
			au.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95";
			au.width=1;
			au.height=1;
			au.style.display='none';
			$(window.document.body).append(au);
			au.EnableContextMenu = false;
			au.SendPlayStateChangeEvents = true;
			au.ShowControls = false;
			au.autostart = false;
			au.Volume = 0;
		return au;
	};
	var
		r_states = {
			0: 'nothing',
			1: 'loading',
			3: 'enough',
			4: 'complete'
		},
		p_states = {
			0: 'stopped',
			1: 'paused',
			2: 'playing',
			3: 'waiting',
			4: 'scan_forward',
			5: 'scan_reverse',
			6: 'next',
			7: 'prev',
			8: 'closed'

		};

	var createAE = function(id, url, cb) {
		var a = createAObj();//new Audio(url);

		var tplaying;
		var checkPlayingProgress = function() {
			if (tplaying){
				clearTimeout(tplaying);
			}
			tplaying = setInterval(function(){
				if (a.IsDurationValid){
					cb('playing', id, {
						duration:  a.Duration * 1000,
						position: a.CurrentPosition * 1000
					});
				}
			},250);
		};


		a.attachEvent('ReadyStateChange', function(e){
			console.log('ReadyStateChange: ' + r_states[e]);
		//	if (_this.current_song != aud){console.log('wrong event');return false}

			/*
			if (r_states[e] == 'enough' || r_states[e] == 'complete'){
				aud.enough = true;
				if (aud.wantplay){
					aud.play(true);
				}
			} else{
				aud.enough = false;
			}*/
			if (r_states[e] == 'complete'){

			}
		});

		a.attachEvent('Error', function(e){
			cb('error', id);
			console.log(e);
			//if (_this.current_song != aud){console.log('wrong event');return false}


		});


		a.attachEvent('EndOfStream', function(){
			cb('finish', id);
			console.log('EndOfStream');
			//if (_this.current_song != aud){console.log('wrong event');return false}


			//_this.wmp_p_events.finished(_this);


		});
		a.attachEvent('PlayStateChange', function(old_s, new_s){
			var pstate = p_states[new_s];

			console.log('StateChange: ' + pstate);
			//if (_this.current_song != aud){console.log('wrong event');return false}

			if (p_states[old_s] == 'waiting'){
				/*
				aud.canplay = true;
				if (aud.wantplay){
					aud.play(true);
				}
				*/
			}


			if (pstate == 'stopped'){
				cb('stop', id);
				//_this.wmp_p_events.stopped(_this);
			}
			if (pstate == 'paused'){
				cb('pause', id);
				//_this.wmp_p_events.paused(_this);
			}
			if (pstate == 'playing'){
				checkPlayingProgress();
				a.autostart = false;
				cb('play', id);
				//_this.wmp_p_events.playing(_this);
			} else {
				if (tplaying){
					clearTimeout(tplaying);
				}
			}
		});

		//var bf;
		a.attachEvent('Buffering', function(buffering_started){
			cb('buffering', id, buffering_started);
			/*
			console.log('Buffering: ' + a.BufferingProgress)
			//if (_this.current_song != aud){console.log('wrong event');return false}


			if (buffering_started){
				clearTimeout(bf);
				bf = setInterval(function(){
					//_this.wmp_p_events.progress_loading(_this, aud.a.BufferingProgress, 100);
					if (a.BufferingProgress == 100){
						clearTimeout(bf);
					}
				},300)
			} else{
				//_this.wmp_p_events.progress_loading(_this, aud.a.BufferingProgress, 100);
				clearTimeout(bf);
			}*/
		});





		/*
		spv.addEvent(a, 'play', function(){
			cb('play', id);
		});
		spv.addEvent(a, 'pause', function(){
			cb('pause', id);
		});
		spv.addEvent(a, 'ended', function(){
			cb('finish', id);
		});
		spv.addEvent(a, 'timeupdate', function(){
			cb('playing', id, {
				duration:  a.duration,
				position: a.currentTime
			});
		});
		var at_finish;
		var fireProgress = function() {
			cb('loading', id, {
				duration: a.duration,
				fetched: a.buffered.end(0)
			});
		};
		spv.addEvent(a, 'progress', function(e){
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
		});*/
		a.Open(url);
		return a;
	};
	var WmpSound = function(opts, cb) {
		this.url = opts.url;
		this.id = opts.id;
		this.cb = cb;
		//this.requireAE();

	};
	WmpSound.prototype = {
		requireAE: function() {
			if (!this.a){
				this.a = createAE(this.id, this.url, this.cb);
			}
		},
		unload: function() {
			if (this.a){
				this.a.autostart = false;
				this.a.Cancel();
				this.a.FileName = "";
				delete this.a;
			}
		},
		play: function() {
			this.requireAE();
			this.a.autostart = true;
			this.a.Play();
		},
		load: function() {
			this.requireAE();
			this.a.Open(this.url);
		},
		stop: function() {
			this.a.autostart = false;
			this.a.Stop();
		},
		pause: function() {
			this.a.autostart = false;
			this.a.Pause();
		},
		setVolume: function(vol) {
			this.a.Volume = (vol/100 * 10000) - 10000;
		},
		setPosition: function(pos, fac) {
			if (this.a){
				var total = this.a.IsDurationValid && this.a.Duration;
				if (total && this.a.CanSeek){
					//var playable = total * this.a.BufferingProgress;
					//var target = total * pos;
					this.a.CurrentPosition = typeof fac == 'number' ? (this.a.Duration * fac) : pos;
				}
			}
		}
	};


	var AudioCoreWmp = function() {
		var _this = this;
		this.sounds_store = {};
		this.feedBack = function() {
			if (_this.subr){
				_this.subr.apply(_this, arguments);
			}
		};
	};

	AudioCoreWmp.prototype = {
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
				this.sounds_store[opts.id] = new WmpSound(opts, this.feedBack);
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
			setPosition: function(s, pos, fac){
				if (s){
					s.setPosition(parseFloat(pos), parseFloat(fac));
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

		callCore: function(method, id, opts, more) {
			if (method && this.plc[method] && id){
				if (opts && opts === Object(opts)){
					spv.cloneObj(opts, {id: id});
				}
				this.plc[method].call(this, this.getSound(id), opts, more);
			}
		},
		callSongMethod: function() {
			this.callCore.apply(this, arguments);
		}
	};
return AudioCoreWmp;
});
