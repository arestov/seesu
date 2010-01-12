const INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;

//vkontakte.ru player
var vk_flash_player_DoFSCommand = function(){
	seesu.player.musicbox.flash_js(arguments[1])
};

var vk_p = function(flash_node_holder){
	this.player_holder = flash_node_holder;
	log('using vkontakte player');
};
vk_p.prototype = {
	'module_title':'vk_p',
	'html': 
		('<embed width="342" height="14" ' + 
		'flashvars="debug=false&amp;volume=:volume&amp;duration=210&amp;' +
		'url=:url" allowscriptaccess="always" wmode="transparent" quality="low" ' +
		'name="vk_flash_player" class="vk_flash_player" ' +
		'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
		'type="application/x-shockwave-flash"/>'),
	'flash_js': function(args){
		if(args.match('playing')) {
			this.player_holder.removeClass('vk-p-initing');
			seesu.player.call_event(PLAYED);
		}
		if(args.match('paused')) {seesu.player.call_event(PAUSED);}
		if(args.match('finished')) {seesu.player.call_event(FINISHED);}
		if(args.match('init')) {seesu.player.call_event(INIT);}
		if(args.match('created')) {seesu.player.call_event(CREATED);}
		if(args.match('stopped')) {seesu.player.call_event(STOPPED);}
		if(args.match('volume')) {seesu.player.call_event(VOLUME, this.parse_volume_value(args));}
	},
	'create_player': function(song_url,duration){
		var _this = this;
		this.player_holder.append(
			_this.html
			  .replace(':url', song_url)
			  .replace(':volume', seesu.player.player_volume)
			  .replace('duration=210', ('duration=' + duration))
		).addClass('vk-p-initing');
	},
	'parse_volume_value': function(volume_value_raw){
		var volume_level_regexp = /\"((\d{1,3}\.?\d*)|(NaN))\"/,
		pre_pesult = volume_level_regexp.exec(volume_value_raw);
		return pre_pesult.slice(1, pre_pesult.length - 1)[0];
	},
	'set_var': function(variable, value) {
	  $(".vk_flash_player",this.player_holder)[0].SetVariable("audioPlayer_mc." + variable, value);
	},
	"play_song_by_url": function (song_url,duration){
	  this.create_player(song_url,duration)
	},
	"play_song_by_node": function (node){
	  this.player_holder[0].innerHTML = ''; //we need for spead here! so.. say no to jquery
	  node[0].parentNode.appendChild(this.player_holder[0]);
	  
	  this.create_player(node.attr('href'), node.data('duration'));
	  this.player_holder.append('<div class="flash-security-status">About «Adobe Flash Player Security»</div>')
	},
	'play': function () {
	  this.set_var('buttonPressed', 'true');
	},
	'stop': function () {
		this.set_var('setState', 'stop');
	},
	'pause': function () {
	  this.set_var('buttonPressed', 'true');
	} 
};

seesu.player = {
	'player_state' 		: STOPPED,
	'player_holder' 	: null,
	'current_playlist' 	: null,
	'want_to_play' 		: 0,
	'wainter_for_play' 	: null,
	'current_artist' 	: '',
	'iframe_player' 	: false,
	'iframe_doc' 		: null,
	'player_volume' 	: ( function(){
		var volume_preference = widget.preferenceForKey('vkplayer-volume');
		return volume_preference && (volume_preference != 'undefined') && (volume_preference != 'NaN') && volume_preference
		})() || 80,
	'events' 			: [],
	'current_song' 		: null,
	'musicbox'			: null, //music box is a link to module with playing methods, 
								//for e.g. soundmanager2 and vkontakte flash player
	'call_event'		: function	(event, data) {
	  if(this.events[event]) this.events[event](data);
	},
	'set_state'			:function (new_player_state_str) {
	  var new_player_state =
		(new_player_state_str == "play" ? PLAYED :
		  (new_player_state_str == "stop" ? STOPPED : PAUSED)
		);
	  switch(this.player_state - new_player_state) {
	  case(STOPPED - PLAYED):
		if (this.current_song) {
			this.musicbox.play_song_by_node( this.current_song )
		};
		break;
	  case(PAUSED - PLAYED):
		this.musicbox.play();
		break;    
	  case(PAUSED - STOPPED):
	  case(PLAYED - STOPPED):
		this.musicbox.stop();
		break;
	  case(PLAYED - PAUSED):
		this.musicbox.pause();
		break;
	  default:
		//log('Do nothing');
	  }
	},
	'switch_to' 	:function (direction) {
	  if (this.current_song) {
		var playlist 		= this.current_song.data('link_to_playlist'),
			current_number 	= this.current_song.data('number_in_playlist'),
			total			= playlist.length || 0;
		if (playlist.length > 1) {
			if (direction == 'next') {
				if (current_number == (total-1)) {
					this.set_current_song(playlist[0]);
				} else {
					this.set_current_song(playlist[current_number+1]);
				}
			} else
			if (direction == 'prev') {
				if ( current_number == 0) {
					this.set_current_song(playlist[total-1]);
				} else {
					this.set_current_song(playlist[current_number-1]);
				}
			}
		}
	  }
	},
	'set_current_song':function (node) {
	  if (this.current_song && this.current_song.length && (this.current_song[0] == node[0])) {
	  	return true;
	  	
	  } else {
	  	time = (new Date()).getTime();
	  	log('1: ' + (time - (new Date()).getTime()));
		var artist = node.data('artist_name');
		if (artist) {update_artist_info(artist);}
		if (this.current_song) {
			//seesu.player.musicbox.stop();
			this.current_song.parent().removeClass('active-play');
		}
		log('2: ' + (time - (new Date()).getTime()));
		node.parent().addClass('active-play');
		this.current_song = node;
		
		log('3: ' + (time - (new Date()).getTime()));
		if (this.musicbox.play_song_by_node) {
		  this.musicbox.play_song_by_node(node);
		} else 
		if (this.musicbox.play_song_by_url) {
		  this.musicbox.play_song_by_url(node.attr('href'), node.data('duration'));
		} else 
		{return false;}

		log('end: ' + (time - (new Date()).getTime()));
		
	  }
	}
}
seesu.player.events[PAUSED] = function(){
  seesu.player.player_state = PAUSED;
};
seesu.player.events[PLAYED] = function(){
  lfm_scroble.nowplay(
	seesu.player.current_song.data('artist_name'),
	seesu.player.current_song.data('track_title')
  )
  seesu.player.player_state = PLAYED;
  
  
};
seesu.player.events[STOPPED] = function(){
  seesu.player.player_state = STOPPED;
};
seesu.player.events[FINISHED] = function() {
  lfm_scroble.submit(
	seesu.player.current_song.data('artist_name'),
	seesu.player.current_song.data('track_title'),
	seesu.player.current_song.data('duration')
  )
  if (typeof(source_window) != 'undefined') {
	source_window.switch_to_next();
  } else {
	switch_to_next();
  }
};
seesu.player.events[VOLUME] = function(volume_value) {
  if (typeof(source_window) != 'undefined') {
	source_window.change_volume();
  } else { 
	change_volume(volume_value);
  }
  
};



	
widget.test_message = 'Hello, world!';


// Click by song
function song_click(node) {
  seesu.player.set_current_song(node);
  seesu.player.current_playlist = node.data('link_to_playlist');
  return false;
}

function switch_to_next(){
  seesu.player.switch_to('next');
}
function change_volume(volume_value){
  widget.setPreferenceForKey(volume_value, 'vkplayer-volume');
  seesu.player.player_volume = volume_value;	
}
widget.switch_to_next = switch_to_next;
widget.change_volume = change_volume;


var ej_postMessage = function(message_obj){
	iframe_doc.contentWindow.postMessage(JSON.stringify(message_obj),'*');
}
var ej_do = function(to_eval){
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'eval','toeval': to_eval}),'*');
}

// Ready? Steady? Go!
$(function() {
	player_holder = $('.player-holder');
	if (player_holder && player_holder.length) {
		seesu.player.musicbox = new vk_p(player_holder);//connecting vkontakte flash to seesu player core
	}
});