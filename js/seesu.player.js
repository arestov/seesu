const INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;



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
			this.musicbox.play_song_by_node( this.current_song );
			
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
		var artist = node.data('artist_name');
		if (artist) {update_artist_info(artist);}
		if (this.current_song) {
			//seesu.player.musicbox.stop();
			this.current_song.parent().removeClass('active-play');
		}
		node.parent().addClass('active-play');
		this.current_song = node;

		if (this.musicbox.play_song_by_node) {
		  this.musicbox.play_song_by_node(node);
		} else 
		if (this.musicbox.play_song_by_url) {
		  this.musicbox.play_song_by_url(node.attr('href'), node.data('duration'));
		} else 
		{return false;}

		
	  }
	}
}
seesu.player.events[PAUSED] = function(){
  seesu.player.player_state = PAUSED;
};
seesu.player.events[PLAYED] = function(){
	log('piu')
	
	
  var start_time = seesu.player.current_song.data('start_time');
  log('start_time before ' + start_time)
  if (!start_time) {
  	seesu.player.current_song.data('start_time',((new Date()).getTime()/1000).toFixed(0));
  }
  if (lfm_scrobble.scrobbling) {
	lfm_scrobble.nowplay(seesu.player.current_song);
  }
  
  log('start_time after ' + seesu.player.current_song.data('start_time'))
  seesu.player.player_state = PLAYED;
  
  
};
seesu.player.events[STOPPED] = function(){
  seesu.player.current_song.data('start_time',null);
  seesu.player.player_state = STOPPED;
};
seesu.player.events[FINISHED] = function() {
  
  if (lfm_scrobble.scrobbling ) {
	log('before scrobbling '  + seesu.player.current_song.data('start_time'));
	var submit = function(node){
		setTimeout(function(){
			lfm_scrobble.submit(node);
		},300)
	};
	submit(seesu.player.current_song);
	log('after scrobbling');
  }
  
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

player_holder = seesu.ui.player_holder = $('<div class="player-holder"></div>');
i_f  = seesu.ui.iframe_player = $('<iframe id="i_f" src="if.html"></iframe>');
if (i_f) {
	var i_f_hide_timeout;
	i_f.bind('load',function(){
		this.contentWindow.postMessage("init_vk_p," + seesu.player.player_volume,'*');
		i_f_hide_timeout = setTimeout(function(){
			i_f.css('display','none');
		},100)
	});
	check_iframe_vkp_init = function(e){
		if (e.data.match(/vk_p_inited/)){
			seesu.player.musicbox = new vk_p(false, seesu.player.player_volume, i_f);
		}
		clearTimeout(i_f_hide_timeout)
		window.removeEventListener("message", check_iframe_vkp_init, false);
	}
}

// Ready? Steady? Go!
$(function() {
	$('#play-list-holder').append(player_holder);
	if (player_holder && player_holder.length) {
		seesu.player.musicbox = new vk_p(player_holder, seesu.player.player_volume);//connecting vkontakte flash to seesu player core
	}
	$('#play-list-holder').append(i_f);
	window.addEventListener("message", check_iframe_vkp_init, false);
	


		
});
