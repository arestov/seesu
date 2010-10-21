
var INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;

seesu.gena = { //this work with playlists
	user_playlist: (function(){
		var p = [];
		p.push = function(mo){
			Array.prototype.push.call(this, mo);
			if (!this.link && p.length > 0 && seesu.start_screen){
				$('<p></p>').attr('id', 'cus-playlist-b').append(
					this.link = $('<a></a>').text('Custom playlist').attr('class', 'js-serv').click(function(){
						if (seesu.player.c_song.mo_titl.plst_titl == p){
							seesu.ui.views.restore_view();
						} else{
							seesu.ui.views.show_playlist_page('Custom playlist', 'cplaylist');
							create_playlist(p)
						}
						return false;
					}) 
				).appendTo(seesu.start_screen);
			}
			
		}
		return p;
		})(),
	create_playlist_element : function(mo_titl){
		var track = $("<a></a>")
			.data('mo_titl', mo_titl)
			.data('artist_name', mo_titl.artist)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click),
			li = document.createElement('li');
			
		
		mo_titl.node = track;
		
		if (!!mo_titl.track){
			track.text(mo_titl.artist + ' - ' + mo_titl.track);
		} else{
			track.text(mo_titl.artist);
		}
		if (mo_titl.link) {
			make_node_playable(mo_titl, mo_titl);
		} else if (mo_titl.mo_pla){
			make_node_playable(mo_titl, mo_titl.mo_pla);
		}
		return $(li)
			.data('mo_titl', mo_titl)
			.append(play_controls.node.clone(true))
			.append(track);
	},clear: function(mo_titl, full){
		delete mo_titl.fetch_started;
		delete mo_titl.not_use;
		delete mo_titl.node;
		delete mo_titl.ready_for_play;
		if (full){
			delete mo_titl.delayed_in;
			delete mo_titl.plst_pla;
			delete mo_titl.plst_titl;
		}
		
		return mo_titl;
	},
	connect:function(mo_titl, pl, i){
		this.clear(mo_titl);
		mo_titl.delayed_in = [];
		mo_titl.play_order = i;
		mo_titl.plst_pla = pl.plst_pla;
		mo_titl.plst_titl = pl;
		return mo_titl
	},
	add: function(mo_titl, pl){
		var n_mo = this.soft_clone(mo_titl);
		pl.push(this.connect(n_mo, pl, pl.length));
		if (seesu.player.c_song.mo_titl.plst_titl == pl){
			pl.ui.append(this.create_playlist_element(n_mo));
			make_tracklist_playable(pl);
		}
		
	},
	soft_clone: function(obj){
		var _n = {};
		for (var a in obj) {
			if (typeof obj[a] != 'object'){
				_n[a] = obj[a];
			}
		};
		return _n;
	}
}

seesu.player = {
	autostart: true,
	player_volume 	: ( function(){
		var volume_preference = w_storage('vkplayer-volume');
		if (volume_preference && (volume_preference != 'undefined') && volume_preference != 'NaN'){
			return parseFloat(volume_preference) || 80
		} else {
			return 80
		}
	  })(),
	player_state 		: STOPPED,
	player_holder 		: null,
	current_playlist 	: null,
	want_to_play		: 0,
	wainter_for_play 	: null,
	current_external_playlist: null,
	iframe_player 	: false,
	iframe_doc 		: null,
	events 			: [],
	current_song 		: null,
	musicbox			: {
	}, //music box is a link to module with playing methods, 
		//for e.g. soundmanager2 and vkontakte flash player
	call_event		: function	(event, data) {
	  var args = Array.prototype.slice.call(arguments);
	  if(this.events[args.shift()]) this.events[event].apply(this,args);
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
	set_state			:function (new_player_state_str) {
	  var new_player_state =
		(new_player_state_str == "play" ? PLAYED :
		  (new_player_state_str == "stop" ? STOPPED : PAUSED)
		);
	  switch(this.player_state - new_player_state) {
	  case(STOPPED - PLAYED):
		if (this.musicbox.play_song_by_url && this.c_song) {
			this.musicbox.play_song_by_url(this.c_song.link);
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
		//console.log('Do nothing');
	  }
	},
	switch_to 	:function (direction) {
	  if (this.c_song) {
		var playlist 		= this.c_song.mo_titl.plst_pla,
			current_number 	= this.c_song.number_in_playlist,
			total			= playlist.length || 0;
		if (playlist.length > 1) {
			var s = false;
			if (direction == 'next') {
				if (current_number == (total-1)) {
					s = playlist[0];
				} else {
					s = playlist[current_number+1];
				}
			} else
			if (direction == 'prev') {
				if ( current_number == 0) {
					s = playlist[total-1];
				} else {
					s = playlist[current_number-1];
				}
			}
			
			if (s){
				this.play_song(s);
			}
		}
	  }
	},
	change_songs_ui: function(mo, remove_playing_status){
		mo.node.parent()[(remove_playing_status ? 'remove' : 'add')+ 'Class']('active-play');
		var c_playlist = mo.mo_titl.plst_titl,
			c_num = mo.mo_titl.play_order;
			
		if (!remove_playing_status){
			if (c_playlist && typeof c_num == 'number'){
				if (c_num-1 >= 0) {
					for (var i = c_num-1, _p = false;  ((i >= 0) && (_p == false)); i--){
						if (c_playlist[i] && !c_playlist[i].not_use){
							_p = true;
							(this.current_prev_song = c_playlist[i]).node.parent().addClass('to-play-previous');
						}
					};
					if (!_p){this.current_prev_song = false}
				}
				if (c_num+1 < c_playlist.length){
					for (var i = c_num+1, _n = false; ((i < c_playlist.length) && ( _n == false)); i++) {
						if (c_playlist[i] && !c_playlist[i].not_use){
							_n = true;
							(this.current_next_song = c_playlist[i]).node.parent().addClass('to-play-next');
						}
					};
					if(!_n){this.current_next_song = false}
				}
				
				
			}
		} else{
			if (this.current_prev_song){
				this.current_prev_song.node.parent().removeClass('to-play-previous')
			}
			if (this.current_next_song){
				this.current_next_song.node.parent().removeClass('to-play-next')
			}
		}
			
		
		
	},
	fix_songs_ui: function(){
		if (this.c_song){
			this.change_songs_ui(this.c_song, true);
			this.change_songs_ui(this.c_song);
		}
	},
	fix_progress_bar: function(node){
		if (this.controls.track_progress_total){
			this.controls.track_progress_play[0].style.width = this.controls.track_progress_load[0].style.width = '0';
		}
		if (this.controls.track_progress_total){
			this.controls.track_progress_width = node.parent().outerWidth() - 12;
		}
	},
	play_song: function(mo, zoom){
		
		this.set_current_song(mo, zoom);
		if (mo != this.c_song){
			this.c_song = mo;
			if (this.musicbox.play_song_by_url){
				this.musicbox.play_song_by_url(mo.link);
			}
		}
		
		
	},
	set_current_song: function (mo, zoom) {
	  var node = mo.node;
	  if (zoom){
		$(slider).addClass('show-zoom-to-track');
	  }
	  if (this.c_song && (this.c_song == mo)) {
	  	this.fix_songs_ui();
	  	
		return true;
		
	  } else {
	  	
		if (zoom){
			$(slider).addClass('show-zoom-to-track');
		}
		//time = (new Date()).getTime();
		var artist = mo.mo_titl.artist;
		
		if (artist) {seesu.ui.update_artist_info(artist, a_info);}
		seesu.ui.update_track_info(a_info, node);
		
		if (this.c_song) {
			this.change_songs_ui(this.c_song, true) //remove ative state
		}
		
		
		
		this.current_song = node;
		
		seesu.track_event('Play', 'started', mo.mo_titl.artist + ' - ' +mo.mo_titl.track );
		
		this.change_songs_ui(mo);
		this.fix_progress_bar(node);
		
		nav_track_zoom.text(( $(nav_playlist_page).text() == artist ? '' : (artist + ' - ' )) + mo.mo_titl.track);
		if (seesu.now_playing.link){
			seesu.now_playing.link.siblings('span').remove();
			seesu.now_playing.link.after($('<span></span>').text(": " + 
				( document.title = artist + " - " + mo.mo_titl.track)
			));
		}
		
		
	  }
	}
}
seesu.player.controls = (function(volume){
	var o = {};
	var get_click_position = function(e, node){
		var pos = e.offsetX || (e.pageX - $(node).offset().left);
		return pos
	}
	o.track_progress_total = $('<div class="track-progress"></div>').click(function(e){
		e.stopPropagation();
		var pos = get_click_position(e, this);
		var new_play_position_factor = pos/o.track_progress_width;
		seesu.player.musicbox.set_new_position(new_play_position_factor);
		
	})//.prependTo(player_holder);
	
	o.track_progress_load = $('<div class="track-load-progress"></div>').appendTo(o.track_progress_total);
	o.track_progress_play = $('<div class="track-play-progress"></div>').appendTo(o.track_progress_total);
	o.track_node_text = $('<div class="track-node-text"><div>').appendTo(o.track_progress_total);
	
	
	o.volume_state = $('<div class="volume-state"></div>').click(function(e){
		var pos = get_click_position(e, this);
		var new_volume_factor = pos/50;
		seesu.player.musicbox.changhe_volume(new_volume_factor * 100);
		seesu.player.call_event(VOLUME, new_volume_factor * 100);
		
		o.volume_state_position.css('width', pos + 'px')
	})//.prependTo(player_holder);
	o.volume_state_position = $('<div class="volume-state-position"></div>')
		.css('width',((volume * 50)/100) + 'px')
		.appendTo(o.volume_state);
	return o;
})(seesu.player.player_volume);
seesu.player.events[PAUSED] = function(){
  seesu.player.player_state = PAUSED;
  document.body.className = document.body.className.replace(/\s*player-[a-z]+ed/g, '');
  $(document.body).addClass('player-paused');
};
seesu.player.events[PLAYED] = function(){
	
	
  var start_time = seesu.player.c_song.start_time;
  if (!start_time) {
	seesu.player.c_song.start_time = ((new Date()).getTime()/1000).toFixed(0);
  }
  if (lfm_scrobble.scrobbling) {
	lfm_scrobble.nowplay(seesu.player.c_song);
  }
  
  seesu.player.player_state = PLAYED;
  document.body.className = document.body.className.replace(/\s*player-[a-z]+ed/g, '');
  $(document.body).addClass('player-played');
  
};
seesu.player.events[STOPPED] = function(){
  seesu.player.c_song.start_time = false;
  seesu.player.player_state = STOPPED;
  document.body.className = document.body.className.replace(/\s*player-[a-z]+ed/g, '');
  $(document.body).addClass('player-stopped');
  
};
seesu.player.events[FINISHED] = function() {
  document.body.className = document.body.className.replace(/\s*player-[a-z]+ed/g, '');
  $(document.body).addClass('player-finished');
  
  if (lfm_scrobble.scrobbling ) {
	var submit = function(mo){
		setTimeout(function(){
			lfm_scrobble.submit(mo);
		},300)
	};
	submit(seesu.player.c_song);
  }
  seesu.track_event('Play', 'finished', seesu.player.c_song.artist + ' - ' + seesu.player.c_song.track );
  
  if (typeof(source_window) != 'undefined') {
	source_window.switch_to_next();
  } else {
	switch_to_next();
  }
};
seesu.player.events[VOLUME] = function(volume_value) {
	change_volume(volume_value);
};
seesu.player.events.before_finish = function(total, progress_value){
	if (!seesu.player.c_song.before_finish_fired){
		if (total - progress_value < 20){
			console.log('Before finish. Total: ' + total + ' Progress_value: ' + progress_value);
			if (seesu.player.current_next_song && !seesu.player.current_next_song.ready_for_play){
				get_next_track_with_priority(seesu.player.current_next_song);
				
			}
			seesu.player.c_song.before_finish_fired = true;
		}
	}
}
seesu.player.events.progress_playing = function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	
	var current = Math.round((progress/total) * seesu.player.controls.track_progress_width);
	
	seesu.player.controls.track_progress_play[0].style.width = current + 'px';
	seesu.player.events.before_finish(progress_value, total);
}

seesu.player.events.progress_loading=function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	
	var current = Math.round((progress/total) * seesu.player.controls.track_progress_width);
	
	seesu.player.controls.track_progress_load[0].style.width = current + 'px';
	seesu.player.events.before_finish(progress, total);
}
	



// Click by song
seesu.player.song_click = function(mo) {
  var zoomed = !!slider.className.match(/show-zoom-to-track/);
  if (this.c_song && mo == this.c_song){
  	seesu.track_event('Song click', 'zoom to track', zoomed ? "zoomed" : "playlist");
  } else if (this.current_next_song && mo == this.current_next_song){
  	seesu.track_event('Song click', 'next song', zoomed ? 'zommed' : 'playlist');
  } else if (this.current_prev_song && mo == this.current_prev_song){
  	seesu.track_event('Song click', 'previous song', zoomed ? 'zommed' : 'playlist');
  } else{
  	seesu.track_event('Song click', 'simple click');
  }
  if (!zoomed){
  	seesu.track_page('track zoom');
  }
  
	  	
  seesu.player.play_song(mo, !zoomed);
  return false;
}

function switch_to_next(){
  seesu.player.switch_to('next');
}
function change_volume(volume_value){
  w_storage('vkplayer-volume', volume_value, true);
  seesu.player.player_volume = volume_value;	
}



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
				sm2_p_in_iframe = new sm2_p(_volume, soundManager);
				sm2_p_in_iframe.player_source_window = iframe_source;
				soundManager.onready(function() {

					if (soundManager.supported()) {

						iframe_source.postMessage("sm2_inited",'*');

					} else{
						console.log('by some reason sm2 iframe don"t work')
					}
				});
			} else{
				console.log('no sounds');
			}

			
			
		};
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
				console.log('sending')
				iframe.contentWindow.postMessage("append_data_as_script\n" + scripts_data.complete_data, '*');
				
			} else{
				console.log('callbacking')
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
		};
		if (scripts_paths.length) {
			var get_js = function(i,l){
				$.ajax({
					url: scripts_paths[i].replace(location.href, ''),
					global: false,
					dataType: 'text',
					type: "GET",
					success: function(r){
						add_script_data(i, l, r)
					}
				});
			}
			for (var i=0; i < scripts_paths.length; i++) {
				get_js(i, scripts_paths.length);
			}
		}
		var check_iframe = function(e){
			if (e.data.match(/iframe_loaded/)){
				
				console.log('got iframe loaded feedback');
				send_scripts_to_iframe(i_f_sm2[0]);
				
				
			} else if (e.data.match(/sm2_inited/)){
				console.log('iframe sm2 wrokss yearh!!!!')
				seesu.player.musicbox = new sm2_p(seesu.player.player_volume, false, i_f_sm2);
				i_f_sm2.addClass('sm-inited');
				$(document.body).addClass('flash-internet');
				$('#sm2-container').remove();
				removeEvent(window, "message", check_iframe);
			}
		};
		addEvent(window, "message", check_iframe);
		$(function(){
			$('#slider-materail').append(i_f_sm2);
		});
		i_f_sm2.bind('load',function(){
			console.log('source knows that iframe loaded');
			this.contentWindow.postMessage("test_iframe_loading_state", '*');
			
		});
		
	}
	
}
var a = document.createElement('audio');
if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
	seesu.player.musicbox = new html5_p(seesu.player.player_volume);
	$(function(){
		$(document.body).addClass('flash-internet');
	})
	
} else if (!seesu.cross_domain_allowed){ //sm2 can't be used directly in sandbox
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
			console.log('sm2 in widget ok')
			seesu.player.musicbox = new sm2_p(seesu.player.player_volume, soundManager);
			$(function(){
				$(document.body).addClass('flash-internet');
			})
			try_to_use_iframe_sm2p(true);
		  } else {
		  	console.log('sm2 in widget notok')
		  		try_to_use_iframe_sm2p();
	
		  }
		});
	}
} else {
	try_to_use_iframe_sm2p();
}