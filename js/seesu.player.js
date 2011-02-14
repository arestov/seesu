var INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;

seesu.gena = { //this work with playlists
	reconnect_playlist: function(pl){
		for (var i=0; i < pl.length; i++) {
			this.connect(pl[i], pl, i);
		};
	},
	save_playlists: function(){
		var _this = this;
		if (this.save_timeout){clearTimeout(this.save_timeout);}
		
		this.save_timeout = setTimeout(function(){
			var plsts = [];
			var playlists = _this.playlists;
			for (var i=0; i < playlists.length; i++) {
				var new_pl = _this.soft_clone(playlists[i]);
				delete new_pl.plst_pla;
				delete new_pl.push;
				for (var k=0; k < new_pl.length; k++) {
					
					new_pl[k] = _this.clear(_this.soft_clone(new_pl[k]));
				};
				plsts[i] = new_pl;
			};
			w_storage('user_playlists', plsts, true);
		},10)
	},
	create_userplaylist: function(title){
		var _this = this;
		var pl_r = prepare_playlist(title, 'cplaylist');
		this.playlists.push(pl_r);
		pl_r.push = function(){
			Array.prototype.push.apply(this, arguments);
			_this.save_playlists();
		}
		return pl_r;
	},
	user_playlis1t: (function(){
		var pl_r = prepare_playlist('Custom playlist', 'cplaylist');
		pl_r.push = function(mo){
			Array.prototype.push.call(this, mo);
			
			
		}
		return pl_r;
		})(),
	clear: function(mo_titl, full){
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
			pl.ui.append(seesu.ui.create_playlist_element(n_mo));
			make_tracklist_playable(pl);
		}
		
	},
	soft_clone: function(obj){
		var arrgh = obj instanceof Array;
		var _n = {};
		for (var a in obj) {
			if (arrgh || (typeof obj[a] != 'object')){
				if (a != 'ui'){
					_n[a] = obj[a];
				}
				
			}
		};
		if (arrgh){
			_n.length = obj.length;
		}
		return _n;
	}
}
var extent_array_by_object = function(array, obj){
	for (var a in obj) {
		if (a != 'length'){
			array[a] = obj[a];
		}
	};
}
su.gena.playlists = (function(){
	var plsts_str = w_storage('user_playlists');
	if (plsts_str){
		var pls = JSON.parse(plsts_str);
		for (var i=0; i < pls.length; i++) {
			var recd_pl = prepare_playlist(pls[i].playlist_title, pls[i].playlist_type);
			recd_pl.push = function(){
				Array.prototype.push.apply(this, arguments);
				console.log('bbbbb');
				su.gena.save_playlists();
			}
			extent_array_by_object(recd_pl, pls[i]);
			su.gena.reconnect_playlist(recd_pl);
			pls[i] = recd_pl;
		};
	} else{
		var pls = [];
	}
	
	pls.push = function(){
		Array.prototype.push.apply(this, arguments);
		su.ui.create_playlists_link();
	}
	return pls;
})();
	
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
			su.ui.remove_video();
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
		this.current_next_preload_song = false;
		
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
				var next_song = c_num+1;
				if (next_song == c_playlist.length){
					next_song = 0;
				}
				if (next_song < c_playlist.length){
					for (var i = next_song, _n = false; ((i < c_playlist.length) && ( _n == false)); i++) {
						if (c_playlist[i] && !c_playlist[i].not_use){
							if (next_song !== 0){
								_n = true;
								(this.current_next_song = c_playlist[i]).node.parent().addClass('to-play-next');
								if (!this.current_next_preload_song){
									this.current_next_preload_song = this.current_next_song;
									
								}
							} else{
								if (!this.current_next_preload_song){
									this.current_next_preload_song = c_playlist[i];
								}
							}
							
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
	fix_progress_bar: function(node, mo_titl){
		if (mo_titl.c.tr_progress_t){
			mo_titl.c.tr_progress_p[0].style.width = mo_titl.c.tr_progress_l[0].style.width = '0';
			mo_titl.c.track_progress_width = node.parent().outerWidth() - 12;
		}
	},
	play_song: function(mo, zoom){
		delete mo.mo_titl.want_to_play;
		this.set_current_song(mo, zoom);
		if (mo != this.c_song){
			this.c_song = mo;
			if (this.musicbox.play_song_by_url){
				this.musicbox.play_song_by_url(mo.link);
			}
		}
		
		
	},
	set_current_song: function (mo, zoom, force) {
	  var node = mo.node;
	  var artist = mo.mo_titl.artist;
	  su.ui.views.show_track_page(($(su.ui.els.nav_playlist_page).text() == artist ? '' : (artist + ' - ' )) + mo.mo_titl.track, zoom);
	  if (!force && this.c_song && (this.c_song == mo)) {
		this.fix_songs_ui();
		
		return true;
		
	  } else {
		su.ui.remove_video();
		//time = (new Date()).getTime();
		
		var a_info = node.data('t_context').children('.artist-info');
		if (artist) {seesu.ui.update_artist_info(artist, a_info);}
		su.ui.update_track_info(a_info, node);
		var tv = a_info.data('track-video');
		if (!tv){
			 tv = a_info.children('.track-video');
			 a_info.data('track-video', tv)
		}
		su.ui.show_video_info(tv, artist + " - " + mo.mo_titl.track);
		
		
		if (su.lfm_api.scrobbling) {
			su.ui.lfm_enable_scrobbling(node.data('t_context').children('.track-panel').children('.track-buttons'));
		}
		if (this.c_song) {
			this.change_songs_ui(this.c_song, true) //remove ative state
		}
		
		
		
		this.current_song = node;
		
		
		
		this.change_songs_ui(mo);
		this.fix_progress_bar(node, mo.mo_titl);
		
		
		if (su.ui.now_playing.link){
			su.ui.now_playing.link.siblings('span').remove();
			su.ui.now_playing.link.after($('<span></span>').text(": " + 
				( su.ui.d.title = artist + " - " + mo.mo_titl.track)
			));
		}
		
		
	  }
	}
}



seesu.player.events[PLAYED] = function(){
  var start_time = seesu.player.c_song.start_time;
  if (!start_time) {
	seesu.player.c_song.start_time = ((new Date()).getTime()/1000).toFixed(0);
  }
  
	var submit = function(mo){
		setTimeout(function(){
			if (su.lfm_api.scrobbling) {
				su.lfm_api.nowplay(mo);
			}
			if (seesu.vk.id){
				su.api('track.scrobble', {
					status: 'playing',
					vk_id: seesu.vk.id,
					duration: mo.duration,
					artist: mo.artist,
					title: mo.track,
					timestamp: ((new Date()).getTime()/1000).toFixed(0)
				});
			}
		},100);
	};
	submit(seesu.player.c_song);
  
	
	
	
  su.ui.mark_c_node_as(seesu.player.player_state = PLAYED);
  seesu.player.preload_song();
};
seesu.player.events[PAUSED] = function(){
  su.ui.mark_c_node_as(seesu.player.player_state = PAUSED);
};
seesu.player.events[STOPPED] = function(){
  seesu.player.c_song.start_time = false;
  su.ui.mark_c_node_as(seesu.player.player_state = STOPPED);
};


seesu.player.events[FINISHED] = function() {
  
	var submit = function(mo){
		setTimeout(function(){
			if (su.lfm_api.scrobbling) {
				su.lfm_api.submit(mo);
			}
			if (seesu.vk.id){
				su.api('track.scrobble', {
					status: 'finished',
					vk_id: seesu.vk.id,
					duration: mo.duration,
					artist: mo.artist,
					title: mo.track,
					timestamp: ((new Date()).getTime()/1000).toFixed(0)
				});
			}
			
			
			
		},50)
	};
	submit(seesu.player.c_song);

	seesu.player.switch_to('next');
};
seesu.player.events[VOLUME] = function(volume_value) {
	change_volume(volume_value);
};
seesu.player.preload_song = function(){
	if (!seesu.player.c_song.next_track_preload_fired){
		if (seesu.player.current_next_preload_song && !seesu.player.current_next_preload_song.ready_for_play){
			get_next_track_with_priority(seesu.player.current_next_preload_song);
			
		}
		//seesu.player.c_song.next_track_preload_fired = true;
		
	}
}

seesu.player.events.progress_playing = function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var _c = seesu.player.c_song.mo_titl.c;
	if (!_c){return false}
	
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	
	var current = Math.round((progress/total) * _c.track_progress_width);
	
	_c.tr_progress_p[0].style.width = current + 'px';
}

seesu.player.events.progress_loading = function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var _c = seesu.player.c_song.mo_titl.c;
	if (!_c){return false}
	
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	
	var current = Math.round((progress/total) * _c.track_progress_width);
	
	_c.tr_progress_l[0].style.width = current + 'px';
}
	



// Click by song
seesu.player.song_click = function(mo) {
  var zoomed = !!seesu.ui.els.slider.className.match(/show-zoom-to-track/);
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


var change_volume = function (volume_value){
  w_storage('vkplayer-volume', volume_value, true);
  seesu.player.player_volume = volume_value;	
}



var try_to_use_iframe_sm2p = function(remove){
	if (!seesu.env.cross_domain_allowed){
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
					complete: function(xhr){
						add_script_data(i, l, xhr.responseText);
					}
				});
			}
			for (var i=0; i < scripts_paths.length; i++) {
				get_js(i, scripts_paths.length);
			}
		}
		
		
		
		
		
		
		
		
		
		
		var html_player_timer;
		var a = document.createElement('audio');
		if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
			html_player_timer = setTimeout(function(){
				seesu.player.musicbox = new html5_p(seesu.player.player_volume);
				$(function(){
					dstates.add_state('body','flash-internet');
				})
			}, 10000);
		}
		
		var check_iframe = function(e){
			if (e.data.match(/iframe_loaded/)){
				
				console.log('got iframe loaded feedback');
				send_scripts_to_iframe(i_f_sm2[0]);
				
				
			} else if (e.data.match(/sm2_inited/)){
				console.log('iframe sm2 wrokss yearh!!!!')
				seesu.player.musicbox = new sm2_p(seesu.player.player_volume, false, i_f_sm2);
				clearTimeout(html_player_timer);
				i_f_sm2.addClass('sm-inited');
				dstates.add_state('body','flash-internet');
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
	setTimeout(function(){
		seesu.player.musicbox = new html5_p(seesu.player.player_volume);
		$(function(){
			dstates.add_state('body','flash-internet');
		})
	}, 10000);
}
if (!seesu.env.cross_domain_allowed){ //sm2 can't be used directly in sandbox
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
				dstates.add_state('body','flash-internet');
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