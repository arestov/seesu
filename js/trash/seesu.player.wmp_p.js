var wmp_p = function(volume){
	console.log('using wmp audio')
	var _this = this;

	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/


	this.volume = volume/100;
	if (seesu.player.c_song){
		this.play_song_by_url(seesu.player.c_song.link);
	}

	this.songs={};
	
};
wmp_p.prototype = {
	'module_title':'wmp_p',
	"set_new_position": function(){
		this.wmp_actions.set_new_position.apply(this, arguments);
	},
	"play_song_by_url": function(){
		this.wmp_actions.play_song_by_url.apply(this, arguments);
	},
	'play': function(){
		this.wmp_actions.play.apply(this, arguments);
	},
	'stop': function(){
		this.wmp_actions.stop.apply(this, arguments);
	},
	'pause': function(){
		this.wmp_actions.pause.apply(this, arguments);
	},
	"changhe_volume": function(volume_value){		
		this.wmp_actions.changhe_volume.apply(this, arguments);
	},
	preloadSong: function(){
		this.wmp_actions.preloadSong.apply(this, arguments);
	},
	createAu: function(){
		var au = document.createElement('object');
			au.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95";
			au.width=1;
			au.height=1;
			au.style.display='none';
			$(document.body).append(au);	
			au.EnableContextMenu = false;
			au.SendPlayStateChangeEvents = true;
			au.ShowControls = false;
			au.autostart = false;
			
		return au;
	},
	getAud: function(url) {
		var _this = this;
		return this.songs[url] || (this.songs[url] = {
			a: this.createAu(),
			url: url,
			play: function(carefully){
				if (!carefully || (this.enough && this.canplay)){
					if (_this.p_states[this.a.PlayState] != 'playing'){
						this.a.Play();
						if (carefully){
							this.wantplay = false;
						}
						
					}	
				}
				
			},
			wantplay: false,
			enough: false,
			canplay: false,
			addE: function(type, f){
				this.a.attachEvent(type, f);
				this.events.push({
					type: type,
					f: f
				});
			},
			removeAllE:function(){
				for (var i = this.events.length - 1; i >= 0; i--){
					var eve = this.events.pop();
					this.a.detachEvent(eve.type, eve.f);
				};
				clearTimeout(this.tplaying)
			},
			events: []
		})
	},
	r_states: {
		0: 'nothing',
		1: 'loading',
		3: 'enough',
		4: 'complete'
	},
	p_states: {
		0: 'stopped',
		1: 'paused',
		2: 'playing',
		3: 'waiting',
		4: 'scan_forward',
		5: 'scan_reverse',
		6: 'next',
		7: 'prev',
		8: 'closed'
			
	},
	bindEvents: function(aud){
		var _this = this;
	
		
		
		aud.addE('ReadyStateChange', function(e){
			console.log('ReadyStateChange: ' + _this.r_states[e])
			if (_this.current_song != aud){console.log('wrong event');return false}
			
			
			if (_this.r_states[e] == 'enough' || _this.r_states[e] == 'complete'){
				aud.enough = true;
				if (aud.wantplay){
					aud.play(true);
				}
			} else{
				aud.enough = false;
			}
		});
		
		aud.addE('Error', function(e){
			console.log(e);
			if (_this.current_song != aud){console.log('wrong event');return false}
			
			
		});
		
		
		aud.addE('EndOfStream', function(e){
			console.log('EndOfStream')
			if (_this.current_song != aud){console.log('wrong event');return false}
			
			
			_this.wmp_p_events.finished(_this);
			
			
		});
		aud.addE('PlayStateChange', function(old_s, new_s){
			var pstate = _this.p_states[new_s];
			
			console.log('StateChange: ' + pstate);
			if (_this.current_song != aud){console.log('wrong event');return false}
			
			if (_this.p_states[old_s] == 'waiting'){
				aud.canplay = true;
				if (aud.wantplay){
					aud.play(true);
				}
			}
			
			
			if (pstate == 'stopped'){
				//_this.wmp_p_events.stopped(_this);
			}
			if (pstate == 'paused'){
				_this.wmp_p_events.paused(_this);
			}
			if (pstate == 'playing'){
				_this.wmp_p_events.playing(_this);
			}
		});
			
		var bf;
		aud.addE('Buffering', function(buffering_started){
			console.log('Buffering: ' + aud.a.BufferingProgress)
			if (_this.current_song != aud){console.log('wrong event');return false}
			
			
			if (buffering_started){
				clearTimeout(bf);
				bf = setInterval(function(){
					_this.wmp_p_events.progress_loading(_this, aud.a.BufferingProgress, 100);
					if (aud.a.BufferingProgress == 100){
						clearTimeout(bf);
					}
				},300)
			} else{
				_this.wmp_p_events.progress_loading(_this, aud.a.BufferingProgress, 100);
				clearTimeout(bf);
			}
		});
	
	
		aud.tplaying = setInterval(function(){
			if (aud.a.IsDurationValid){
				if (_this.current_song != aud){console.log('wrong event');return false}
				
				
				//console.log('playing: ' + aud.a.CurrentPosition)
				
				_this.wmp_p_events.progress_playing(_this, aud.a.CurrentPosition, aud.a.Duration);
					
			}
		},250);
	},
	"wmp_actions" :{
		preloadSong: function(url){
			var aud = this.getAud(url);
			aud.a.Open(aud.url);
			
			
		},
		"set_new_position": function(position_factor){
			
			var aud = this.current_song;
			if (aud && aud.a){
				var total = aud.a.IsDurationValid && aud.a.Duration;
				if (total && aud.a.CanSeek){
					var playable = total * aud.a.BufferingProgress;
					var target = total * position_factor;
					aud.a.CurrentPosition = Math.min(playable, target);
				}
			
				
			}
		},
		
		"play_song_by_url" : function(url){
			var _this = this;
			
			if (this.current_song){
				this.current_song.removeAllE();
				this.stop();
			}
			var aud = this.current_song = this.getAud(url);
			var au = aud.a;
			
			this.bindEvents(aud);
			
			
			au.Open(aud.url);
			
			
			var tvolume = Math.min(1, this.volume);
			au.Volume = (tvolume * 10000) - 10000;
			this.play();
			
			
		},
		"play" : function(){
			var aud = this.current_song && this.current_song;
			
			aud.wantplay = true;
			aud.play(true);
		},
		"stop" : function(){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				
				this.current_song.wantplay = false;
				
				try{
					au.Stop();
					
				} catch(e){
					if (e){
						console.log(e)
					}
					
					
				}
				
			}
		},
		"pause" : function(){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				au.Pause();
			}
		},
		"changhe_volume": function(volume){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				au.Volume = (volume/100 * 10000) - 10000;
			}
		}
	},
	"wmp_p_events": {
		"playing": function(_this){
			seesu.player.call_event(PLAYED);
		},
		"paused": function(_this){
			seesu.player.call_event(PAUSED);
		},
		"finished": function(_this){
			seesu.player.call_event(FINISHED);
		},
		"init": function(_this){
			seesu.player.call_event(INIT);
		},
		"created": function(_this){
			seesu.player.call_event(CREATED);
		},
		"stopped": function(_this){
			seesu.player.call_event(STOPPED);
		},
		"volume": function(_this,volume_value){
			_this.volume = volume_value;
			seesu.player.call_event(VOLUME, volume_value);
		},
		"progress_playing": function(_this, progress_value, total){
			seesu.player.call_event('progress_playing', progress_value, total);
			
		},
		"progress_loading": function(_this, progress_value, total){
			seesu.player.call_event('progress_loading', progress_value, total);
		}
	}
	
};
