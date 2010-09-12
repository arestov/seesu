var html5_p = function(player_holder,volume){
	log('using html5 audio')
	var _this = this;
	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/
	if (player_holder){
		this.player_holder = player_holder;
		var get_click_position = function(e, node){
			var pos ;
			if (!node){
				pos = e.offsetX;
			}
			
			if (!pos){
				pos = e.pageX - $(node).offset().left;
			}
			return pos
		}
		
		
		
		this.track_progress_total = $('<div class="track-progress"></div>').click(function(e){
			e.stopPropagation();
			var pos = get_click_position(e, this);
			var new_play_position_factor = pos/_this.track_progress_width;
			_this.set_new_position(new_play_position_factor);
			
		}).appendTo(player_holder);
		this.track_progress_load = $('<div class="track-load-progress"></div>').appendTo(this.track_progress_total);
		this.track_progress_play = $('<div class="track-play-progress"></div>').appendTo(this.track_progress_total);
		
		this.track_node_text = $('<div class="track-node-text"><div>').appendTo(this.track_progress_total);
		
		
		this.volume_state = $('<div class="volume-state"></div>').click(function(e){
			var pos = get_click_position(e);
			var new_volume_factor = pos/50;
			_this.changhe_volume(new_volume_factor);
			_this.volume = new_volume_factor;
			seesu.player.call_event(VOLUME, new_volume_factor * 100);
			
			_this.volume_state_position.css('width', pos + 'px')
		}).prependTo(playlist_panel);
		this.volume_state_position = $('<div class="volume-state-position"></div>').css('width',((volume * 50)/100) + 'px' ).appendTo(this.volume_state);
		
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
		if (this.track_progress_total){
			this.track_progress_play[0].style.width = this.track_progress_load[0].style.width = '0';
		}
		
		var parent_node = node.parent()
		/**
		var top = parent_node.position().top;
		
		
		this.player_holder[0].style.top = top + 'px';
**/
		
		if (this.track_progress_total){
			this.track_progress_width = parent_node.outerWidth();
			//this.track_node_text.html(node.html());
			//log('width: '  + this.track_progress_width)
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
			/*
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				var total = (current_song.bytesTotal * current_song.duration)/current_song.bytesLoaded;
				current_song.setPosition( position_factor * total )
			}*/
		},
		"play_song_by_url" : function(url){
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
				_this.html5_p_events.progress_playing(_this, _this.current_song.currentTime, _this.current_song.duration)
			});
			addEvent(this.current_song, 'progress', function(e){
				_this.html5_p_events.progress_loading(_this, e.loaded, e.total) 
				log('progress: ' + e.loaded + ' ' + e.total)
			});
			addEvent(this.current_song, 'canplaythrough', function(e){
				setTimeout(function(){
					if (_this.current_song.buffered.length && (_this.current_song.buffered.length > 0)){
						_this.html5_p_events.progress_loading(_this, _this.current_song.buffered.end(0), _this.current_song.duration)
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
				this.current_song.pause();
				this.current_song.currentTime = 0;
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
			
			var current = Math.round((progress_value/total) * _this.track_progress_width);
			
			_this.track_progress_play[0].style.width = current + 'px';
		},
		"progress_loading": function(_this, progress_value, total){
			if (_this.ignore_position_change) {return false;}
			var current = Math.round((progress_value/total) * _this.track_progress_width);
			
			_this.track_progress_load[0].style.width = current + 'px';
		}
	}
	
};
