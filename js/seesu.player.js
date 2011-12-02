var INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;

su.gena = { //this work with playlists

	save_playlists: function(){
		var _this = this;
		if (this.save_timeout){clearTimeout(this.save_timeout);}
		
		this.save_timeout = setTimeout(function(){
			var plsts = [];
			var playlists = _this.playlists;
			for (var i=0; i < playlists.length; i++) {
				plsts.push(playlists[i].simplify())
			};
			suStore('user_playlists', plsts, true);
		},10)
	},
	create_userplaylist: function(title,p, manual_inject){
		var _this = this;
		var pl_r = p || prepare_playlist(title, 'cplaylist', {name: title});
		if (!manual_inject){
			this.playlists.push(pl_r);
		}
		
		var oldpush = pl_r.push;
		pl_r.push = function(){
			oldpush.apply(this, arguments);
			_this.save_playlists();
		}
		return pl_r;
	}
	
};

var extent_array_by_object = function(array, obj){
	for (var a in obj) {
		if (a != 'length'){
			array[a] = obj[a];
		}
	};
};
function rebuildPlaylist(saved_pl){
	var p = prepare_playlist(saved_pl.playlist_title, saved_pl.playlist_type, {name: saved_pl.playlist_title});
	for (var i=0; i < saved_pl.length; i++) {
		p.push(saved_pl[i]);
	}
	delete p.loading;
	su.gena.create_userplaylist(false, p, true);
	return p;
};
su.gena.playlists = (function(){
	var pls = [];
	
	var plsts_str = suStore('user_playlists');
	if (plsts_str){
		var spls = plsts_str;
		for (var i=0; i < spls.length; i++) {
			pls[i] = rebuildPlaylist(spls[i]);
		};
	} 
	
	
	pls.push = function(){
		Array.prototype.push.apply(this, arguments);
		su.ui.create_playlists_link();
	}
	pls.find = function(puppet){
		for (var i=0; i < pls.length; i++) {
			if (pls[i].compare(puppet)){
				return pls[i]
			}
			
		};	
	};
	return pls;
})();


su.player = {
	autostart: true,
	player_volume 	: ( function(){
		var volume_preference = suStore('vkplayer-volume');
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
				this.musicbox.play_song_by_url(this.c_song.mopla.link);
			};
			break;
		  case(PAUSED - PLAYED):
				if (this.c_song){
					this.c_song.updateState('play', 'playing', 'playingChanged')
				}
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
		var playlist = [];
		for (var i=0; i < this.c_song.plst_titl.length; i++) {
			var ts = this.c_song.plst_titl[i].song();
			if (ts){
				playlist.push(this.c_song.plst_titl[i]);
			}
		};
		var current_number = playlist.indexOf(this.c_song),
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
	isPlaying: function(playlist, force){
		
		if (this.c_song){
			var pl = this.c_song.plst_titl;
			if (force || (pl.belongsToArtist())){
				if (pl.compare(playlist)){
					return pl;
				}
			}
		}
		
	},
	nowPlaying: function(mo){
		if (!su.ui.now_playing.link || su.ui.now_playing.link[0].ownerDocument != su.ui.d){
			if (su.ui.views.nav){
				su.ui.now_playing.link = $('<a class="np"></a>').click(function(){
					su.ui.views.show_now_playing(true);
				}).appendTo(su.ui.views.nav.justhead);
			}
		}
		if (su.ui.now_playing.link){
			su.ui.now_playing.link.attr('title', (localize('now-playing','Now Playing') + ': ' +mo.artist + " - " + mo.track));	
		}
		
		
	},
	play_song: function(mo, view, mopla, force_zoom){
		if(!mo.isHaveTracks()){return false;}
		delete mo.want_to_play;
		
		
		var last_mo = this.c_song;
		
		var _mopla;
		if (mopla){
			_mopla = mopla;
		} else{
			_mopla = mo.song();
		}
		
		
//		if (force_zoom || (view && this.c_song != mo) || (last_mo == this.v_song && last_mo != mo)){
	//		su.ui.views.show_track_page(mo);
	//	}
	
		this.nowPlaying(mo);

		if (_mopla && (this.c_song != mo || (mopla && mo.mopla != mopla))){
			if (last_mo && last_mo.state('active') && this.c_song != mo){
				viewSong(mo);
			}
			
			this.c_song = mo;
			if (last_mo){
				last_mo.unmarkAsPlaying();
			}
			mo.markAsPlaying();
			
			if (this.musicbox.play_song_by_url){
				this.musicbox.play_song_by_url(_mopla.link);
				mo.mopla = _mopla;
			}
			mo.ui.displaySongMoplaInfo(_mopla);
			
		}
		
		mo.plst_titl.lev.freeze();
		
		
		
		
	}
};



su.player.events[PLAYED] = function(){
  var start_time = su.player.c_song.start_time;
  if (!start_time) {
	su.player.c_song.start_time = ((new Date()).getTime()/1000).toFixed(0);
  }
  var mo = su.player.c_song;
  
  setTimeout(function(){
	if (mo == su.player.c_song){
		var submit = function(mo){
			setTimeout(function(){
				if (lfm.scrobbling) {
					lfm.nowplay(mo, mo.mopla.duration);
				}
				if (su.vk.id){
					su.s.api('track.scrobble', {
						client: su.env.app_type,
						status: 'playing',
						duration: mo.mopla.duration,
						artist: mo.artist,
						title: mo.track,
						timestamp: ((new Date()).getTime()/1000).toFixed(0)
					});
				}
			},100);
		};
		submit(mo);
	}
  	
  },3000)
  su.ui.mark_c_node_as(su.player.player_state = PLAYED);
  su.player.preload_song();
};
su.player.events[PAUSED] = function(){
  su.ui.mark_c_node_as(su.player.player_state = PAUSED);
};
su.player.events[STOPPED] = function(){
  su.player.c_song.start_time = false;
  su.ui.mark_c_node_as(su.player.player_state = STOPPED);
};


su.player.events[FINISHED] = function() {
  
	var submit = function(mo){
		setTimeout(function(){
			if (lfm.scrobbling) {
				lfm.submit(mo, mo.mopla.duration);
			}
			if (su.vk.id){
				su.s.api('track.scrobble', {
					client: su.env.app_type,
					status: 'finished',
					duration: mo.mopla.duration,
					artist: mo.artist,
					title: mo.track,
					timestamp: ((new Date()).getTime()/1000).toFixed(0)
				});
			}
			
			
			
		},50)
	};
	submit(su.player.c_song);
	su.player.switch_to('next');
};
su.player.events[VOLUME] = function(volume_value) {
	change_volume(volume_value);
};
su.player.preload_song = function(){
	if (!su.player.c_song.next_track_preload_fired){
		if (su.player.c_song.next_preload_song){
			get_next_track_with_priority(su.player.c_song.next_preload_song);
			
		}
		//su.player.c_song.next_track_preload_fired = true;
		
	}
}

su.player.events.progress_playing = function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var _c = su.player.c_song && su.player.c_song.ui && su.player.c_song.ui.ct;;
	if (!_c){return false}
	
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	if (progress && total){
		if (_c.track_progress_width){
			var current_in_pixels = Math.round((progress/total) * _c.track_progress_width) + 'px';
		} else{
			var current_in_percents = ((progress/total) * 100) + '%';
		}
		_c.tr_progress_p[0].style.width = current_in_pixels || current_in_percents;
	}
	
	

	
	
}

su.player.events.progress_loading = function(progress_value, total){
	//if (_this.ignore_position_change) {return false;}
	var _c = su.player.c_song && su.player.c_song.ui && su.player.c_song.ui.ct;;
	if (!_c){return false}
	
	var progress = parseInt(progress_value);
	var total = parseInt(total);
	
	if (progress && total){
		if (_c.track_progress_width){
			var current_in_pixels = Math.round((progress/total) * _c.track_progress_width) + 'px';
		} else{
			var current_in_percents = ((progress/total) * 100) + '%';
		}
		
		_c.tr_progress_l[0].style.width = current_in_pixels || current_in_percents;
		
		if ((progress/total) > 0.8){
			if (su.player.c_song.next_song && (su.player.c_song.next_song.isHaveBestTracks() || su.player.c_song.next_song.isSearchCompleted()) && su.player.musicbox.preloadSong){
				var s = su.player.c_song.next_song.song();
				if (s && s.link){
					su.player.musicbox.preloadSong(s.link)
				}
				
			} 

			if (progress == total){
				su.player.c_song.load_finished = true;
			}
		}
	}
	 
	
}

// Click by song
su.player.song_click = function(mo) {
  var zoomed = !!su.ui.els.slider.className.match(/show-zoom-to-track/);
  if (this.c_song){
  	if (mo == this.c_song){
		su.track_event('Song click', 'zoom to track', zoomed ? "zoomed" : "playlist");
	} else if (this.c_song.next_song && mo == this.c_song.next_song){
		su.track_event('Song click', 'next song', zoomed ? 'zommed' : 'playlist');
	} else if (this.c_song.prev_song && mo == this.c_song.prev_song){
		su.track_event('Song click', 'previous song', zoomed ? 'zommed' : 'playlist');
	} else{
		su.track_event('Song click', 'simple click');
	}
  } else{
  	su.track_event('Song click', 'simple click');
  }
  
  if (!zoomed){
	su.track_page('track zoom');
  }
  su.mp3_search.find_mp3(mo);
  viewSong(mo);	
  su.player.play_song(mo, true, false, true);
  
  return false;
}


var change_volume = function (volume_value){
  suStore('vkplayer-volume', volume_value, true);
  su.player.player_volume = volume_value;	
}

var sm2iframed = {
	c: $('<iframe id="i_f_sm2" src="http://seesu.me/i.html" ></iframe>'),
	text_of_function: function(func){
		return func.toString().replace(/^.*\n/, "").replace(/\n.*$/, "")
	},
	init: function(){
		if (!su.env.cross_domain_allowed){
			return false;
		}
		var _this = this;
	
		if (this.c) {
			
			var last_iframe_func = this.text_of_function(_this.i_func).replace('_volume', su.player.player_volume );
			var scripts_paths = [
				bpath + 'js/common-libs/soundmanager2.js',
				bpath + 'js/seesu.player.sm2.js'
			];

			scripts_data = [];
			
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
			};
			
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
					scripts_data.complete_data += 'var sm2_init_p = ' + JSON.stringify(_this.i_params) + ';';
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
			
			var check_iframe = function(e){
				if (e.data.match(/iframe_loaded/)){
					
					console.log('got iframe loaded feedback');
					send_scripts_to_iframe(_this.c[0]);
					
					
				} else if (e.data.match(/sm2_inited/)){
					console.log('iframe sm2 wrokss yearh!!!!');
					yepnope({
						load:  [bpath + 'js/seesu.player.sm2.js'],
						complete: function(){
							su.player.musicbox = new sm2_p(su.player.player_volume, false, _this.c);
						}
					});
					
					clearTimeout(html_player_timer);
					_this.c.addClass('sm-inited');
					dstates.add_state('body','flash-internet');
					$('#sm2-container').remove();
					removeEvent(window, "message", check_iframe);
				}
			};
			addEvent(window, "message", check_iframe);
			
			
			_this.c.bind('load',function(){
				console.log('source knows that iframe loaded');
				this.contentWindow.postMessage("test_iframe_loading_state", '*');
				
			});
			
			suReady(function(){
				$(document.body).append(_this.c);
			});
			
	
		}
	},
	remove: function(){
		this.c.remove();
	},
	i_params: {
		oext: su.env.opera_extension
	},
	i_func: function(){
					
		window.soundManager = new SoundManager('http://seesu.me/swf/', false, {
			flashVersion : 9,
			useFlashBlock : true,
			debugMode : false,
			wmode : sm2_init_p.oext ? 'opaque' : 'transparent',
			useHighPerformance : !sm2_init_p.oext
		});
		if (soundManager){			
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

		
		
	}
};

var html_player_timer;
(function(){
	var a = document.createElement('audio');
	var aw = document.createElement('object');
		aw.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95";
	if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
		yepnope({
			load: bpath + "js/seesu.player.html5.js", 
			complete: function(){
				
				su.player.musicbox = new html5_p(su.player.player_volume);
				suReady(function(){
					dstates.add_state('body','flash-internet');
				});
				
			}
		});
		
	} else if ('EnableContextMenu' in aw && aw.attachEvent){

		yepnope({
			load: bpath + "js/seesu.player.wmp_p.js", 
			complete: function(){

				su.player.musicbox = new wmp_p(su.player.player_volume);
				suReady(function(){
					dstates.add_state('body','flash-internet');
				});

			}
		});
	} else if (!su.env.cross_domain_allowed){ //sm2 can't be used directly in sandbox
		yepnope({
			load:  [bpath + 'js/common-libs/soundmanager2.js', bpath + 'js/seesu.player.sm2.js'],
			complete: function(){
				soundManager = new SoundManager('http://seesu.me/swf/', false, {
					flashVersion : 9,
					useFlashBlock : true,
					debugMode : false,
					wmode : su.env.opera_extension ? 'opaque' : 'transparent',
					useHighPerformance : !su.env.opera_extension
				});
				if (soundManager){	
					soundManager.onready(function() {
						if (soundManager.supported()) {
							console.log('sm2 in widget ok')
							su.player.musicbox = new sm2_p(su.player.player_volume, soundManager);
							suReady(function(){
								dstates.add_state('body','flash-internet');
							})
							sm2iframed.remove();
							clearTimeout(html_player_timer);
						} else {
							console.log('sm2 in widget notok')
							sm2iframed.init();
					
						}
					});
				}
			}
		})
	} else {
		sm2iframed.init();
	}
})();
