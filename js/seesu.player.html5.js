var html5_p = function(volume){
	console.log('using html5 audio')
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
html5_p.prototype = {
	'module_title':'html5_p',
	"set_new_position": function(){
		this.html5_actions.set_new_position.apply(this, arguments);
	},
	"play_song_by_url": function(){
		this.html5_actions.play_song_by_url.apply(this, arguments);
	},
	'play': function(){
		this.html5_actions.play.apply(this, arguments);
	},
	'stop': function(){
		this.html5_actions.stop.apply(this, arguments);
	},
	'pause': function(){
		this.html5_actions.pause.apply(this, arguments);
	},
	"changhe_volume": function(volume_value){		
		this.html5_actions.changhe_volume.apply(this, arguments);
	},
	preloadSong: function(){
		this.html5_actions.preloadSong.apply(this, arguments);
	},
	getAud: function(url) {
		return this.songs[url] || (this.songs[url] = {
			a: new Audio(url),
			addE: function(type, f){
				addEvent(this.a, type, f);
				this.events.push({
					type: type,
					f: f
				});
			},
			removeAllE:function(){
				for (var i = this.events.length - 1; i >= 0; i--){
					var eve = this.events.pop();
					removeEvent(this.a, eve.type, eve.f);
				};
			},
			events: []
		})
	},
		
	"html5_actions" :{
		preloadSong: function(url){
			var au = this.getAud(url).a;
			if (au.buffered.length && au.buffered.end(0) == au.duration){
				
				return true;
				
			} else{
				
				au.load();
			}
			
			
		},
		"set_new_position": function(position_factor){
			var au = this.current_song && this.current_song.a;
			if (au){
				var total = au.duration;
				try{
					var playable = au.buffered.end(0);
					var target = total * position_factor;
					au.currentTime = Math.min(playable, target);
				} catch(e){
					
				}
				
			}
		},
		
		"play_song_by_url" : function(url){
			var _this = this;
			
			if (this.current_song){
				this.stop();
			}
			var aud = this.current_song = this.getAud(url);
			var au = aud.a;
			
			au.load();
			au.volume = Math.min(1, this.volume);
			
			aud.addE('play', function(){_this.html5_p_events.playing(_this)});
			aud.addE('pause', function(){_this.html5_p_events.paused(_this)});
			aud.addE('stop', function(){_this.html5_p_events.stopped(_this)});
			aud.addE('ended', function(){_this.html5_p_events.finished(_this)});
			aud.addE('timeupdate', function(){
				_this.html5_p_events.progress_playing(_this, au.currentTime, au.duration);
			});
			
			var atfinish;
			aud.addE('progress', function(e){
				
				clearTimeout(atfinish);
				if (e.loaded && e.total){
					_this.html5_p_events.progress_loading(_this, e.loaded, e.total);
				} else if (au.buffered.length && (au.buffered.length > 0)){
					if (au.buffered.end(0)/au.duration > 0.8){
						atfinish = setTimeout(function(){
							_this.html5_p_events.progress_loading(_this, au.buffered.end(0), au.duration);
						},5000)
					}
					_this.html5_p_events.progress_loading(_this, au.buffered.end(0), au.duration);

				}
			});
			
			au.play();
		},
		"play" : function(){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				au.play();
			}
		},
		"stop" : function(){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				this.current_song.removeAllE();
				try{
					au.pause();
					au.currentTime = 0;
				} catch(e){
					if (e){
						console.log(e)
					}
					
					$(au).remove();
				}
				
			}
		},
		"pause" : function(){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				au.pause();
			}
		},
		"changhe_volume": function(volume){
			var au = this.current_song && this.current_song.a;
			
			if (au){
				au.volume = this.volume = volume/100;
			}
		}
	},
	"html5_p_events": {
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
