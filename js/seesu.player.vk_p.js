//vkontakte.ru player
var vk_p = function(flash_node_holder,start_volume,iframe){
	this.volume = start_volume;
	var _this = this;
	if (flash_node_holder) {this.player_holder = flash_node_holder};
	if (iframe) {
		this.player_container = iframe;
		window.addEventListener("message", function(e){
			_this.listen_commands_of_sandbox.apply(_this,arguments);
		}, false);
		this.flash_actions = this.flash_actions_for_sandbox;
	} else{
		this.flash_actions = this.flash_actions_normal;
		this.player_container = flash_node_holder;
		
		vk_flash_player_DoFSCommand = function(){
			_this.flash_js(arguments[1]);
		};
	}
	if (typeof seesu === 'object') {
		this.pl_h_style = $('<style></style>');
		$(document.documentElement.firstChild).append(this.pl_h_style);
	} else{
		//look like we in iframe, so listen commands
		window.addEventListener("message", function(e){
			_this.listen_commands_of_source.apply(_this,arguments);
		}, false)
	}
	
	this.init_timeout;
	log('using vkontakte player');
};
vk_p.prototype = {
	'module_title':'vk_p',
	'html': 
		('<embed width="342" height="8" ' + 
		'flashvars="debug=false&amp;volume=:volume&amp;duration=210&amp;' +
		'url=:url" allowscriptaccess="always" wmode="transparent" quality="low" ' +
		'name="vk_flash_player" class="vk_flash_player" ' +
		'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf" ' +
		'type="application/x-shockwave-flash"/>'),
	'html_events' : {
		creating: function(_this){
			_this.player_container.addClass('vk-p-initing');
			_this.init_timeout = setTimeout(function(){
				_this.player_container.removeClass('vk-p-initing');
			},1500)
		},
		init: function(_this){
			clearTimeout(_this.init_timeout);
			_this.player_container.removeClass('vk-p-initing');
		},
		moving: function(_this,node){
			var parent_node = node.parent()
			var top = parent_node.position().top + parent_node.height();
			_this.pl_h_style.html('.player-holder,#i_f {top: ' + top + 'px}');
		}
		
	},
	'flash_js': function(args){
		log(args);
		if(args.match('playing')) 
			{this.vk_player_events.playing(this);}
		else 
		if(args.match('paused'))
		 	{this.vk_player_events.paused(this);}
		else
		if(args.match('finished')) 
			{this.vk_player_events.finished(this);}
		else
		if(args.match('init')) 
			{this.vk_player_events.init(this);}
		else
		if(args.match('created')) 
			{this.vk_player_events.created(this);}
		else
		if(args.match('stopped')) 
			{this.vk_player_events.stopped(this);}
		else
		if(args.match('volume'))
			{this.vk_player_events.volume(this, this.parse_volume_value(args));}
	},
	'create_player':function(song_url,duration){
		var _this = this;
		this.player_holder.append(
			_this.html
			  .replace(':url', song_url)
			  .replace(':volume', _this.volume)
			  .replace('duration=210', ('duration=' + duration))
		);
	},
	'parse_volume_value': function(volume_value_raw){
		var volume_level_regexp = /\"((\d{1,3}\.?\d*)|(NaN))\"/,
		pre_pesult = volume_level_regexp.exec(volume_value_raw);
		return pre_pesult.slice(1, pre_pesult.length - 1)[0];
	},
	'set_var': function(variable, value) {
	  $(".vk_flash_player",this.player_holder)[0].SetVariable("audioPlayer_mc." + variable, value);

	},
	"play_song_by_node": function (node){
	  this.play_song_by_url(node.attr('href'), node.data('duration'));
	  this.html_events.moving(this,node);
	},
	'vk_player_events':
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
				_this.html_events.init(_this);
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
		}
	,
	"flash_actions": null,
	"flash_actions_normal":{
		"play_song_by_url": function (song_url,duration){
		  	this.player_holder.html('');
		  	this.create_player(song_url,duration);
			this.html_events.creating(this);
		},
		"play":function () {
			this.set_var('buttonPressed', 'true');
		}
		,
		"stop":function () {
			this.set_var('setState', 'stop');
		}
		,
		"pause":function () {
			this.set_var('buttonPressed', 'true');
		}
	},
	"flash_actions_for_sandbox":{
		"play_song_by_url": function(song_url,duration){
			this.send_to_player_sandbox('play_song_by_url,' + song_url + ',' + duration);
			this.html_events.creating(this);
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
	"play_song_by_url": function(){
		this.flash_actions.play_song_by_url.apply(this, arguments);
	},
	'play': function(){
		this.flash_actions.play.apply(this, arguments);
	},
	'stop': function(){
		this.flash_actions.stop.apply(this, arguments);
	},
	'pause': function(){
		this.flash_actions.pause.apply(this, arguments);
	},
	"send_to_player_sandbox": function(message){
		log('to sandbox')
		//using for sending messages to flash injected in iframe
		this.player_container[0].contentWindow.postMessage('vk_p_iframe,' + message, '*');
	},
	"send_to_player_source": function(message){
		//using for feedback messages from iframe flash
		this.player_source_window.postMessage('vk_p_source,' + message, '*');
	},
	"listen_commands_of_source": function(e){
		
		var _this = this;
		if (e.origin.indexOf('widget://') == -1) {
			return
		} else {
			if (e.data.match(/vk_p_iframe/)){
				log('from source')
				var commands  = e.data.replace('vk_p_iframe,','').split(",");
				this[commands.shift()].apply(this, commands);
			}
		}
	},
	"listen_commands_of_sandbox": function(e){
		if (e.data.match(/vk_p_source/)){
			var commands  = e.data.replace('vk_p_source,','').split(",");
			this.vk_player_events[commands.shift()].apply(this, [seesu.player.musicbox].concat(commands));
		}
		
	}
};
