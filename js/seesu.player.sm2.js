soundManager.url = 'http://seesu.heroku.com/swf/';
soundManager.flashVersion = 9; // optional: shiny features (default = 8)
soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
soundManager.debugMode = false;
soundManager.wmode = 'transparent';


var sm2_p = function(player_holder,volume,sm2, iframe){
	this.core = sm2;
	/*
		musicbox.play_song_by_node
		musicbox.play()
		musicbox.stop()
		musicbox.pause
		musicbox.play_song_by_url
	*/
	this.volume = volume;
	
	var _this = this;
	if (iframe) {
		this.player_container = iframe;
		window.addEventListener("message", function(e){
			_this.listen_commands_of_sandbox.apply(_this,arguments);
		}, false);
		this.sm2_actions = this.sm2_actions_for_sandbox;
	} else{
		this.sm2_actions = this.sm2_actions_normal;
		this.player_container = player_holder;

	}
	if (typeof seesu === 'object') {

	} else{
		//look like we in iframe, so listen commands
		window.addEventListener("message", function(e){
			_this.listen_commands_of_source.apply(_this,arguments);
		}, false)
	}
	
};
sm2_p.prototype = {
	'module_title':'sm2_p',
	"play_song_by_node" : function(node){
		this.play_song_by_url(node.attr('href'), node.data('duration'));
	},
	"play_song_by_url": function(){
		this.sm2_actions.play_song_by_url.apply(this, arguments);
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
	"sm2_actions": null,
	"sm2_actions_normal" :{
		"play_song_by_url" : function(url){
			var _this = this;
			this.core.stopAll();
			var current_song = this.core.getSoundById(url);
			if (current_song) {
				this.core.play(url);
			} else{
				this.core
				.createSound({
					id: url, // required
					url: url, // required
					// optional sound parameters here, see Sound Properties for full list
					volume: 50,
					autoPlay: true,
					onplay: function(){_this.sm2_p_events.playing(_this)},
					onresume: function(){_this.sm2_p_events.playing(_this)},
					onpause: function(){_this.sm2_p_events.paused(_this)},
					onstop: function(){_this.sm2_p_events.stopped(_this)},
					onfinish : function(){_this.sm2_p_events.finished(_this)}
				});
			}
			
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
		}
	},
	"sm2_actions_for_sandbox": {
		"play_song_by_url": function(song_url,duration){
			this.send_to_player_sandbox('play_song_by_url,' + song_url + ',' + duration);
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
		if (e.origin.indexOf('widget://') == -1) {
			return
		} else {
			if (e.data.match(/sm2_p_iframe/)){
				var commands  = e.data.replace('sm2_p_iframe,','').split(",");
				this[commands.shift()].apply(this, commands);
			}
		}
	},
	"listen_commands_of_sandbox": function(e){
		if (e.data.match(/sm2_p_source/)){
			var commands  = e.data.replace('sm2_p_source,','').split(",");
			this.sm2_p_events[commands.shift()].apply(this, [seesu.player.musicbox].concat(commands));
		}
		
	}
};