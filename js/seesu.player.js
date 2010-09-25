var INIT     = -11,
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
	'current_external_playlist': null,
	'iframe_player' 	: false,
	'iframe_doc' 		: null,
	'player_volume' 	: ( function(){
		var volume_preference = w_storage('vkplayer-volume');
		if (volume_preference && (volume_preference != 'undefined') && volume_preference != 'NaN'){
			return parseFloat(volume_preference) || 80
		} else {
			return 80
		}
	  })(),
	'events' 			: [],
	'current_song' 		: null,
	'musicbox'			: {
			play_song_by_node: function(node){
				current_song = node;
			}
		}, //music box is a link to module with playing methods, 
								//for e.g. soundmanager2 and vkontakte flash player
	'call_event'		: function	(event, data) {
	  if(this.events[event]) this.events[event](data);
	},
	get_state: function(){
		if (this.player_state == PLAYED){
			return 'playing';
		} else 
		if (this.player_state == STOPPED){
			return 'stoped';
		} else 
		if (this.player_state == PAUSED){
			return 'paused';
		} else {
			return false;
		}
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
	change_songs_ui: function(node, remove_playing_status){
		node.parent()[(remove_playing_status ? 'remove' : 'add')+ 'Class']('active-play');
		var c_playlist = node.data('full_playlist'),
			c_num = node.data('play_order');
			
		if (!remove_playing_status){
			if (c_playlist && typeof c_num == 'number'){
				if (c_num-1 >= 0) {
					for (var i = c_num-1, _p = false;  ((i >= 0) && (_p == false)); i--){
						if (c_playlist[i] && !c_playlist[i].data('not_use')){
							_p = true;
							(this.current_prev_song = c_playlist[i]).parent().addClass('to-play-previous')
						}
					};
					if (!_p){this.current_prev_song = false}
				}
				if (c_num+1 < c_playlist.length){
					for (var i = c_num+1, _n = false; ((i < c_playlist.length) && ( _n == false)); i++) {
						if (c_playlist[i] && !c_playlist[i].data('not_use')){
							_n = true;
							(this.current_next_song = c_playlist[i]).parent().addClass('to-play-next')
						}
					};
					if(!_n){this.current_next_song = false}
				}
				
				
			}
		} else{
			if (this.current_prev_song && this.current_prev_song.length){
				this.current_prev_song.parent().removeClass('to-play-previous')
			}
			if (this.current_next_song && this.current_next_song.length){
				this.current_next_song.parent().removeClass('to-play-next')
			}
		}
			
		
		
	},
	fix_songs_ui: function(){
		if (this.current_song){
			this.change_songs_ui(this.current_song, true);
			this.change_songs_ui(this.current_song);
		}
	},
	set_current_song: function (node, zoom) {
	  if (zoom){
		$(slider).addClass('show-zoom-to-track');
	  }
	  if (this.current_song && this.current_song.length && (this.current_song[0] == node[0])) {
	  	this.fix_songs_ui();
	  	
		return true;
		
	  } else {
	  	
		if (zoom){
			$(slider).addClass('show-zoom-to-track');
		}
		//time = (new Date()).getTime();
		var artist = node.data('artist_name');
		if (artist) {update_artist_info(artist, a_info);}
		
		if (this.current_song) {
			this.change_songs_ui(this.current_song, true)
		}
		
		
		
		this.current_song = node;
		seesu.track_event('Play', 'started', node.data('artist_name') + ' - ' + node.data('track_title') );
		
		this.change_songs_ui(node);
		
		if (this.musicbox.play_song_by_node) {
		  this.musicbox.play_song_by_node(node);
		} else 
		if (this.musicbox.play_song_by_url) {
		  this.musicbox.play_song_by_url(node.data('mp3link'), node.data('duration'));
		} else 
		{return false;}
		
		
		node.parent().append(this.play_controls.rebind())
		
		nav_track_zoom.text(( $(nav_playlist_page).text() == artist ? '' : (artist + ' - ' )) + node.data('track_title'));
		if (seesu.now_playing.link){
			seesu.now_playing.link.siblings('span').remove();
			seesu.now_playing.link.after($('<span></span>').text(": " + artist + " - " + node.data('track_title')));
		}
		
		
	  }
	}
}
seesu.player.events[PAUSED] = function(){
  seesu.player.player_state = PAUSED;
  document.body.className = document.body.className.replace(/player-[a-z]+ed/g, '');
  $(document.body).addClass('player-paused');
};
seesu.player.events[PLAYED] = function(){
	
	
  var start_time = seesu.player.current_song.data('start_time');
  if (!start_time) {
	seesu.player.current_song.data('start_time',((new Date()).getTime()/1000).toFixed(0));
  }
  if (lfm_scrobble.scrobbling) {
	lfm_scrobble.nowplay(seesu.player.current_song);
  }
  
  seesu.player.player_state = PLAYED;
  document.body.className = document.body.className.replace(/player-[a-z]+ed/g, '');
  $(document.body).addClass('player-played');
  
};
seesu.player.events[STOPPED] = function(){
  seesu.player.current_song.data('start_time',null);
  seesu.player.player_state = STOPPED;
  document.body.className = document.body.className.replace(/player-[a-z]+ed/g, '');
  $(document.body).addClass('player-stopped');
  
};
seesu.player.events[FINISHED] = function() {
  document.body.className = document.body.className.replace(/player-[a-z]+ed/g, '');
  $(document.body).addClass('player-finished');
  
  if (lfm_scrobble.scrobbling ) {
	var submit = function(node){
		setTimeout(function(){
			lfm_scrobble.submit(node);
		},300)
	};
	submit(seesu.player.current_song);
  }
  seesu.track_event('Play', 'finished', seesu.player.current_song.data('artist_name') + ' - ' + seesu.player.current_song.data('track_title') );
  
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
seesu.player.song_click = function(node) {
  var zoomed = !!slider.className.match(/show-zoom-to-track/);
  if ((this.current_song && this.current_song.length ) && node[0] == this.current_song[0]){
  	seesu.track_event('Song click', 'zoom to track', zoomed ? "zoomed" : "playlist");
  } else if ((this.current_prev_song && this.current_prev_song.length) && node[0] == this.current_next_song[0]){
  	seesu.track_event('Song click', 'next song', zoomed ? 'zommed' : 'playlist');
  } else if ((this.current_prev_song && this.current_prev_song.length) && node[0] == this.current_prev_song[0]){
  	seesu.track_event('Song click', 'previous song', zoomed ? 'zommed' : 'playlist');
  } else{
  	seesu.track_event('Song click', 'simple click');
  }
  
	  	
  
	  	
  seesu.player.set_current_song(node, !zoomed);
  return false;
}

function switch_to_next(){
  seesu.player.switch_to('next');
}
function change_volume(volume_value){
  w_storage('vkplayer-volume', volume_value, true);
  seesu.player.player_volume = volume_value;	
}

seesu.ui.player_holder = $('<div class="player-holder"></div>');

var try_to_use_iframe_sm2p = function(remove){
	if (!seesu.cross_domain_allowed){
		return false;
	}
	if (remove){
		if (window.i_f_sm2 && i_f_sm2.length){
			i_f_sm2.remove();
		}
		
		return false;
	}
	window.i_f_sm2 = seesu.ui.iframe_sm2_player = $('<iframe id="i_f_sm2" src="http://seesu.me/i.html" ></iframe>');
	if (window.i_f_sm2) {
		
		
		init_sm2_p = function(){
			
			
			
			window.soundManager = new SoundManager();
			if (soundManager){
				soundManager.url = 'http://seesu.me/swf/';
				soundManager.flashVersion = 9;
				soundManager.useFlashBlock = true;
				soundManager.debugMode = false;
				soundManager.wmode = 'transparent';
				soundManager.useHighPerformance = true;
				sm2_p_in_iframe = new sm2_p(false, _volume, soundManager);
				sm2_p_in_iframe.player_source_window = iframe_source;
				soundManager.onready(function() {

					if (soundManager.supported()) {

						iframe_source.postMessage("sm2_inited",'*');

					} else{
						log('by some reason sm2 iframe don"t work')
					}
				});
			} else{
				log('no sounds');
			}

			
			
		}
		var text_of_function = function(func){
			return func.toString().replace(/^.*\n/, "").replace(/\n.*$/, "")
		}
		var last_iframe_func = text_of_function(init_sm2_p).replace('_volume', seesu.player.player_volume );
		

		
		var scripts_paths = [];

		
		scripts_data = [];
		$('script.for-sm2-iframe', document.documentElement.firstChild).each(function(i){
			scripts_paths.push(this.src);
		});
		
		
		var all_scripts_data_loaded = false;
		var wait_for_all_script_data = false;
		var add_script_data_callback = function(){return;};
		var send_scripts_to_iframe = function(iframe){
			if (all_scripts_data_loaded){
				log('sending')
				iframe.contentWindow.postMessage("append_data_as_script\n" + scripts_data.complete_data, '*');
				
			} else{
				log('callbacking')
				wait_for_all_script_data = true;
				add_script_data_callback = function(){
					send_scripts_to_iframe(iframe);
				}
			}
		}
		var sort_by_number_order = function(g,f){
			if (g && f) {
				if (g.number > f.number)
					{return 1;}
				else if (g.number < f.number)
					{return -1;}
				else
				{return 0;}
			} else {return 0;}

		};
		
		var add_script_data = function(i, l, data){
			scripts_data.push({"number": i, "data": data});
			
			
			if (scripts_data.length == (l)){
				scripts_data.sort(sort_by_number_order);
				scripts_data.complete_data = '/*<![CDATA[*/' + '\n';
				for (var m=0; m < scripts_data.length; m++) {
					scripts_data.complete_data += scripts_data[m].data + '\n\n'
				};
				
				scripts_data.complete_data += last_iframe_func;
				scripts_data.complete_data += '/* ]]>*/';

				all_scripts_data_loaded = true;
				if (wait_for_all_script_data) {
					add_script_data_callback();
				}
			}
		}
		if (scripts_paths.length) {
			for (var i=0; i < scripts_paths.length; i++) {
				
				(function(i, l){
					$.ajax({
						url: scripts_paths[i].replace(location.href, ''),
						global: false,
						dataType: 'text',
						type: "GET",
						success: function(r){
							add_script_data(i, l, r)
						}
					});
				})(i, scripts_paths.length)
				
				
			}
		}
		var check_iframe = function(e){
			if (e.data.match(/iframe_loaded/)){
				
				log('got iframe loaded feedback');
				send_scripts_to_iframe(i_f_sm2[0]);
				
				
			} else if (e.data.match(/sm2_inited/)){
				log('iframe sm2 wrokss yearh!!!!')
				seesu.player.musicbox = new sm2_p(seesu.ui.player_holder, seesu.player.player_volume, soundManager, i_f_sm2);
				i_f_sm2.addClass('sm-inited');
				$(document.body).addClass('flash-internet');
				$('#sm2-container').remove();
				removeEvent(window, "message", check_iframe);
			}
		}
		addEvent(window, "message", check_iframe);
		$('#slider-materail').append(i_f_sm2);
		
		
		i_f_sm2.bind('load',function(){
			log('source knows that iframe loaded');
			
			this.contentWindow.postMessage("test_iframe_loading_state", '*');
			

			
			
		});
		
	}
	
}





// Ready? Steady? Go!

$(function() {
	track_panel.prepend(seesu.ui.player_holder);
	
	var a = document.createElement('audio');
	if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
		seesu.player.musicbox = new html5_p(seesu.ui.player_holder, seesu.player.player_volume);
		$(document.body).addClass('flash-internet');
	} else if (!seesu.cross_domain_allowed){
		soundManager = new SoundManager();
		if (soundManager){
			soundManager.url = 'http://seesu.me/swf/';
			soundManager.flashVersion = 9;
			soundManager.useFlashBlock = true;
			soundManager.debugMode = false;
			soundManager.wmode = 'transparent';
			soundManager.useHighPerformance = true;
			soundManager.onready(function() {
			  if (soundManager.supported()) {
				log('sm2 in widget ok')
				seesu.player.musicbox = new sm2_p(seesu.ui.player_holder, seesu.player.player_volume, soundManager);
				$(document.body).addClass('flash-internet');
				try_to_use_iframe_sm2p(true);
			  } else {
			  	log('sm2 in widget notok')
			  		try_to_use_iframe_sm2p();
		
			  }
			});
		}
	} else {
		try_to_use_iframe_sm2p();
	}
	
	
	
	
		

	
});
