var sm2_p = function(volume, sm2, iframe){
	var _this = this;
	if (sm2){
		this.core = sm2;
	}
	
	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/
	this.volume = volume;
	if (iframe){
		console.log('sm2 with iframe')
		this.player_container = iframe;
		addEvent(window, "message", function(e){
			_this.listen_commands_of_sandbox.apply(_this,arguments);
		});
		this.sm2_actions = this.sm2_actions_for_sandbox;
	} else if (sm2){
		this.sm2_actions = this.sm2_actions_normal;
	}
	
	if (typeof seesu === 'object') {
		if (seesu.player.c_song){
			this.play_song_by_url(seesu.player.c_song.link);
		}
		
	} else{
		//look like we in iframe, so listen commands
		addEvent(window, "message", function(e){
			_this.listen_commands_of_source.apply(_this,arguments);
		})
	}
	this.songs={};
	
};
sm2_p.prototype = {
	'module_title':'sm2_p',
	
	"set_new_position": function(){
		this.sm2_actions.set_new_position.apply(this, arguments);
	},
	"play_song_by_url": function(){
		this.before_finish_fired = false;
		this.sm2_actions.play_song_by_url.apply(this, arguments);
	},
	"preloadSong": function(){
		return this.sm2_actions.preloadSong.apply(this, arguments);
	},
	'play': function(){
		this.sm2_actions.play.apply(this, arguments);
	},
	'stop': function(){
		this.sm2_actions.stop.apply(this, arguments);
	},
	'pause': function(){
		this.sm2_actions.pause.apply(this, arguments);
	},
	"changhe_volume": function(volume_value){		
		this.sm2_actions.changhe_volume.apply(this, arguments);
	},
	"sm2_actions": null,
	"sm2_actions_normal" :{
		"set_new_position": function(position_factor){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				var total = (current_song.bytesTotal * current_song.duration)/current_song.bytesLoaded;
				current_song.setPosition( position_factor * total )
			}
		},
		preloadSong: function(url){
			var s;
			if (this.songs[url]){
				s = this.core.getSoundById(url);
			} else{
				s = this.core.createSound({
					id: url, // required
					url: url // required
				});
				this.songs[url] = true;
			}
			if (this.songs[url] != this.songs[this.current_song]){
				s.load();
			}
			return s;
		},
		"play_song_by_url" : function(url){
			var _this = this;
			if (this.current_song){
				var current_song = this.core.getSoundById(this.current_song);
				if (current_song) {
					current_song.destruct()
					delete this.songs[this.current_song];
				}
			}
			
			this.preloadSong(url);
			
			this.core.play(url, {
				volume: _this.volume,
				onplay: function(){_this.sm2_p_events.playing(_this)},
				onresume: function(){_this.sm2_p_events.playing(_this)},
				onpause: function(){_this.sm2_p_events.paused(_this)},
				onstop: function(){_this.sm2_p_events.stopped(_this)},
				onfinish : function(){_this.sm2_p_events.finished(_this)},
				whileplaying: function(){
					var total = (this.bytesTotal * this.duration)/this.bytesLoaded;
					_this.sm2_p_events.progress_playing(_this, this.position, total)
				},
				whileloading: function(){
					_this.sm2_p_events.progress_loading(_this, this.bytesLoaded, this.bytesTotal) 
				}
			})
			
		
			
			this.current_song = url;
		},
		"play" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				current_song.resume()
			}
		},
		"stop" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				this.core.stop(this.current_song)
			}
		},
		"pause" : function(){
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				this.core.pause(this.current_song)
			}
		},
		"changhe_volume": function(volume){
			this.volume = volume;
			var current_song = this.core.getSoundById(this.current_song);
			if (current_song) {
				current_song.setVolume(volume);
			}
		}
	},
	"sm2_actions_for_sandbox": {
		"set_new_position": function(position_factor){
			this.send_to_player_sandbox('set_new_position,' + position_factor);
		},
		"play_song_by_url": function(song_url,duration){
			this.send_to_player_sandbox('play_song_by_url,' + song_url + ',' + duration);
		},
		"preloadSong": function(song_url){
			this.send_to_player_sandbox('preloadSong,' + song_url);
		}
		,
		"play":function(){
			this.send_to_player_sandbox('play');
		}
		,
		"stop":function(){
			this.send_to_player_sandbox('stop');
		}
		,
		"pause":function(){
			this.send_to_player_sandbox('pause');
		},
		"changhe_volume": function(volume_value){
			this.send_to_player_sandbox('changhe_volume,' + volume_value);
		}
	},
	"sm2_p_events": 
		(typeof seesu === 'object') ?
		{
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
	  :
		{
			//feedback of iframe flash
			"playing": function(_this){
				_this.send_to_player_source('playing');
			},
			"paused": function(_this){
				_this.send_to_player_source('paused');
			},
			"finished": function(_this){
				_this.send_to_player_source('finished');
			},
			"init": function(_this){
				_this.send_to_player_source('init');
			},
			"created": function(_this){
				_this.send_to_player_source('created');
			},
			"stopped": function(_this){
				_this.send_to_player_source('stopped');
			},
			"volume": function(_this, volume_value){
				_this.volume = volume_value;
				_this.send_to_player_source('volume,'+volume_value);
			},
			"progress_playing": function(_this, progress_value, total){
				_this.send_to_player_source('progress_playing,'+progress_value + ',' + total);
			},
			"progress_loading": function(_this, progress_value, total){
				_this.send_to_player_source('progress_loading,'+progress_value + ',' + total);
			}
			
		},
	"send_to_player_sandbox": function(message){
		//using for sending messages to flash injected in iframe
		this.player_container[0].contentWindow.postMessage('sm2_p_iframe,' + message, '*');
	},
	"send_to_player_source": function(message){
		//using for feedback messages from iframe flash
		this.player_source_window.postMessage('sm2_p_source,' + message, '*');
	},
	"listen_commands_of_source": function(e){
		var _this = this;
		
		if (e.data.match(/sm2_p_iframe/)){
			var commands  = e.data.replace('sm2_p_iframe,','').split(",");
			this[commands.shift()].apply(this, commands);
		}
		
	},
	"listen_commands_of_sandbox": function(e){
		if (e.data.match(/sm2_p_source/)){
			var commands  = e.data.replace('sm2_p_source,','').split(",");
			this.sm2_p_events[commands.shift()].apply(this, [seesu.player.musicbox].concat(commands));
		}
		
	}
};
