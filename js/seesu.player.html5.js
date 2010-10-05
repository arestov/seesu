var html5_p = function(c, volume){
	console.log('using html5 audio')
	var _this = this;
	if (c){
		this.c = c;
	}
	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/

	this.before_finish = function(){
		this.before_finish_fired = true;
		console.log('before finish')
		if (seesu.player.current_next_song && !seesu.player.current_next_song.data('mp3link')){
			get_track(seesu.player.current_next_song, false, true);
			
		}
		
	}
	this.volume = volume/100;
	if (seesu.player.current_song){
		this.play_song_by_node(current_song);
	}

	
	
};
html5_p.prototype = {
	'module_title':'html5_p',
	"play_song_by_node" : function(node){
		this.ignore_position_change = true;
		if (this.c.track_progress_total){
			this.c.track_progress_play[0].style.width = this.c.track_progress_load[0].style.width = '0';
		}
		var parent_node = node.parent();
		if (this.c.track_progress_total){
			this.c.track_progress_width = parent_node.outerWidth() - 12;
		}
		
		this.play_song_by_url(node.data('mp3link'), node.data('duration'));
		this.ignore_position_change = false;
		
		
		
	},
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
	"html5_actions" :{
		"set_new_position": function(position_factor){
			if (this.current_song){
				var total = this.current_song.duration;
				var playable = this.current_song.buffered.end(0);
				var target = total * position_factor;
				this.current_song.currentTime = Math.min(playable, target);
			}
		},
		"play_song_by_url" : function(url){
			this.before_finish_fired = false;
			var _this = this;
			
			if (this.current_song){
				this.stop();
			}
			this.current_song = new Audio(url);
			this.current_song.load();
			this.current_song.volume = this.volume;
			addEvent(this.current_song, 'play', function(){_this.html5_p_events.playing(_this)});
			addEvent(this.current_song, 'pause', function(){_this.html5_p_events.paused(_this)});
			addEvent(this.current_song, 'stop', function(){_this.html5_p_events.stopped(_this)});
			addEvent(this.current_song, 'ended', function(){_this.html5_p_events.finished(_this)});
			addEvent(this.current_song, 'timeupdate', function(){
				_this.html5_p_events.progress_playing(_this, _this.current_song.currentTime, _this.current_song.duration);
			});
			addEvent(this.current_song, 'progress', function(e){
				if (e.loaded && e.total){
					_this.html5_p_events.progress_loading(_this, e.loaded, e.total);
				}
			});
			addEvent(this.current_song, 'canplaythrough', function(e){
				setTimeout(function(){
					if (_this.current_song.buffered.length && (_this.current_song.buffered.length > 0)){
						_this.html5_p_events.progress_loading(_this, _this.current_song.buffered.end(0), _this.current_song.duration);
					}
				},300)
			});
			this.current_song.play();
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
				this.current_song.volume = volume;
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
			if (_this.ignore_position_change) {return false;}
			
			var current = Math.round((progress_value/total) * _this.c.track_progress_width);
			
			_this.c.track_progress_play[0].style.width = current + 'px';
			if (!_this.before_finish_fired){
				if (total - progress_value < 20){
					if (_this.before_finish){
						_this.before_finish();
					}
				}
			}
			
		},
		"progress_loading": function(_this, progress_value, total){
			if (_this.ignore_position_change) {return false;}
			var current = Math.round((progress_value/total) * _this.c.track_progress_width);
			
			_this.c.track_progress_load[0].style.width = current + 'px';
		}
	}
	
};
