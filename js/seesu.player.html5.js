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
	"html5_actions" :{
		preloadSong: function(url){
			var au = this.songs[url] || (this.songs[url] = new Audio(url));
			if (au.buffered.length && au.buffered.end(0) == au.duration){
				console.log('will not preload ' + url)
				return true;
				
			} else{
				console.log('preloading ' + url)
				au.load();
			}
			
			
		},
		"set_new_position": function(position_factor){
			if (this.current_song){
				var total = this.current_song.duration;
				var playable = this.current_song.buffered.end(0);
				var target = total * position_factor;
				this.current_song.currentTime = Math.min(playable, target);
			}
		},
		"play_song_by_url" : function(url){
			var _this = this;
			
			if (this.current_song){
				this.stop();
			}
			var au = this.current_song = this.songs[url] || (this.songs[url] = new Audio(url));
			
			au.load();
			au.volume = this.volume;

			addEvent(au, 'play', function(){_this.html5_p_events.playing(_this)});
			addEvent(au, 'pause', function(){_this.html5_p_events.paused(_this)});
			addEvent(au, 'stop', function(){_this.html5_p_events.stopped(_this)});
			addEvent(au, 'ended', function(){_this.html5_p_events.finished(_this)});
			addEvent(au, 'timeupdate', function(){
				_this.html5_p_events.progress_playing(_this, au.currentTime, au.duration);
			});
			
			var atfinish;
			addEvent(au, 'progress', function(e){
				
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
			addEvent(au, 'canplaythrough', function(e){
				setTimeout(function(){
					if (au.buffered.length){
						_this.html5_p_events.progress_loading(_this, au.buffered.end(0), au.duration);
					}
				},30)
			});
			au.play();
		},
		"play" : function(){
			if (this.current_song){
				this.current_song.play();
			}
		},
		"stop" : function(){
			if (this.current_song){
				try{
					this.current_song.pause();
					this.current_song.currentTime = 0;
				} catch(e){
					if (e){
						console.log(e)
					}
					
					$(this.current_song).remove();
				}
				
			}
		},
		"pause" : function(){
			if (this.current_song){
				this.current_song.pause();
			}
		},
		"changhe_volume": function(volume){
			if (this.current_song){
				this.current_song.volume = this.volume = volume/100;
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
