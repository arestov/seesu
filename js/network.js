var searches_pr = {
	vk: 0,
	soundcloud: -5
};

cmo = {
	addSteamPart: function(mo, search_source, t ){
		var _ms = this.getMusicStore(mo, search_source);
		_ms.t = t;
		mo.have_tracks = true;
		_ms.processing = false;
	},
	blockSteamPart: function(mo, search_source){
		var _ms = this.getMusicStore(mo, search_source);
		_ms.processing = false;
		if (!_ms.t){
			_ms.failed = true;
			if (search_source.fixable){
				_ms.fixable = true;
				
			}
			return true;
		} else{
			return false;
		}
		
		
	},
	getSomeTracks: function(steam){
		var many_tracks = [];
		for(var source in steam){
			if (!steam[source].failed && steam[source].t){
				many_tracks.push.apply(many_tracks, steam[source].t);
			}
		}
		return (many_tracks.length && many_tracks) || false;
	},
	by_best_search_index: function(g,f){
		if (g && f) {
			var gg = searches_pr[g.name];
			var ff = searches_pr[f.name];
			if (typeof gg =='undefined'){
				gg = -1000;
			}
			if (typeof ff =='undefined'){
				ff = -1000;
			}
			
			
			if (gg < ff){
				return 1;
			}
			else if (gg > ff){
				return -1;
			}
			else{
				return 0;
			}
		} else {
			return 0;
		}
	},
	getAllSongTracks: function(mo){

		var tracks_pack = [];
		for(var steam in mo.steams){
			var m = this.getSomeTracks(mo.steams[steam]);
			if (m){
				tracks_pack.push({
					name: steam,
					t: m
				})
			}
		}
		tracks_pack.sort(this.by_best_search_index);
		return (tracks_pack.length && tracks_pack) || false;
	},
	getMusicStore: function(mo, search_source){
		
		var ss = {
			name: (search_source && search_source.name) || 'sample',
			key: (search_source && search_source.key) || 0
		};
		
		if (!mo.steams){
			mo.steams = {};
		}
		if (!mo.steams[ss.name]){
			mo.steams[ss.name] = {};
		}
		if (!mo.steams[ss.name][ss.key]){
			mo.steams[ss.name][ss.key] = {};
		}
		return mo.steams[ss.name][ss.key];
	}
	
}

var get_youtube = function(q, callback){
	var cache_used = cache_ajax.get('youtube', q, callback);
	if (!cache_used){
		$.ajax({
			url: 'http://gdata.youtube.com/feeds/api/videos',
			dataType: 'jsonp',
			data: {
				q: q,
				v: 2,
				alt: 'json-in-script'
				
			},
			success: function(r){
				if (callback) {callback(r);}
					cache_ajax.set('youtube', q, r)
				} 
		})
	}
	
};


var get_mp3 = function(mo, options){
	var o = options || {};
	//o ={handler: function(){}, nocache: false, only_cache: false, get_next: false}
	if (!o.nocache && !o.only_cache){
		seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	
	var count_down = function(search_source, music_list, successed){
		if (!o.nocache && !o.only_cache){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		mo.node.removeClass('search-mp3');
		if (mo.parallels !== 0 && --mo.parallels === 0){
			
			
			mo.search_completed = true;
			
			if (mo.have_tracks){
				make_node_playable(mo, music_list, search_source);
				seesu.ui.els.export_playlist.addClass('can-be-used');
			} else{
				mo.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
				if (!o.nocache && !o.only_cache){
					seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
				}
				
				if (o.get_next){
		
					if (seesu.player.c_song && ((seesu.player.c_song.next_song && (mo == seesu.player.c_song.next_song)) || 
						(seesu.player.c_song.prev_song && (mo == seesu.player.c_song.prev_song)))){
						seesu.player.fix_songs_ui();
					}
					if (seesu.player.c_song && seesu.player.c_song.next_song){
						get_next_track_with_priority(seesu.player.c_song.next_song);
					}
				}
			}
		} else{
			if (mo.have_tracks){
				make_node_playable(mo, music_list, search_source, true);
			} 
		}
	};
	setTimeout(function(){
		if (mo.parallels !== 0){
			mo.parallels = 1;
			count_down();
		}
	},30000)
	var callback_success = function(music_list, search_source){
		//success
		var query = {
			artist: HTMLDecode(mo.artist),
			track: HTMLDecode(mo.track)
		};
		music_list.sort(function(g,f){
			return by_best_matching_index(g,f, query)
		});
		cmo.addSteamPart(mo, search_source, music_list);
		count_down(search_source, music_list, true);
	};
	
	var callback_error = function(search_source){
		//error
		var real_fail = cmo.blockSteamPart(mo, search_source);
		count_down(search_source);
		
		
	};
	var used_successful = o.handler(
		mo.artist + ' - ' + mo.track, callback_success, callback_error, 
		o.nocache,
		function(){
			if (!mo.have_tracks){
				mo.node.addClass('search-mp3');
			}
			
		},
		o.only_cache
	);
	if (typeof used_successful == 'object'){
		var has_pr = mo.want_to_play;
		if (has_pr) {
			used_successful.pr = has_pr;
		}
		mo.delayed_in.push(used_successful);
		used_successful.q.init();
	}
	
	return used_successful;
};

var get_all_tracks = function(trackname, callback, nocache, hypnotoad, only_cache){
	var allow_h = hypnotoad && seesu.delayed_search.waiting_for_mp3provider;
	if (seesu.delayed_search.use.queue) {seesu.delayed_search.use.queue.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	seesu.ui.els.art_tracks_w_counter.text('');
	var s = allow_h ? seesu.hypnotoad.search_soundcloud : seesu.delayed_search.use.search_tracks;
	var used_successful = s(trackname, callback, function(){callback();}, nocache, false, only_cache);
	if (typeof used_successful == 'object'){
		used_successful.pr = seesu.player.want_to_play + 1;
		used_successful.q.init();
	}
	return used_successful;
}



function getSongMatchingIndex(song, query){
	var _ar = song.artist,
		_tr = song.track;
		
	var artist = query.artist,
		track = query.track;
		
	var mi = 0;
	
	
	var epic_fail_test = artist + ' ' + track,
		epic_fail = !~epic_fail_test.indexOf(artist.replace(/^The /, '')) && !~epic_fail_test.indexOf(track);
	
	if (epic_fail){
		return mi = -1000;
	} else{
		if ((_ar == artist) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr.replace(/.mp3$/, '') == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.replace(/^The /).toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if (~_ar.indexOf(artist) && ~_tr.indexOf(track)) {
			return mi;
		} 
		--mi;
		if (~_ar.toLowerCase().indexOf(artist.toLowerCase()) && ~_tr.toLowerCase().indexOf(track.toLowerCase())) {
			return mi;
		} 
		
		--mi 
		return mi;
		
	}
	
		
	
};


function by_best_matching_index(g,f, query){
	if (g && f) {
		if (getSongMatchingIndex(g,query) < getSongMatchingIndex(f, query)){
			return 1;
		}
		else if (getSongMatchingIndex(g, query) > getSongMatchingIndex(f, query)){
			return -1;
		}
		else{
			return 0;
		}
	} else {
		return 0;
	}
}

var kill_music_dubs = function(array) {
	var cleared_array = [];
	for (var i=0; i < array.length; i++) {
		if (!has_music_copy(array, array[i], i+1)){
			cleared_array.push(array[i]);
		}
	}
	return cleared_array
}
function has_music_copy(array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
}








window.try_api = function(callback, do_not_repeat){
	var try_saved_auth = function(){
		var vk_session_stored = w_storage('vk_session'+1915003);
		if (vk_session_stored){
			set_vk_auth(vk_session_stored);
			seesu.track_event('Auth to vk', 'auth', 'from saved');
		}
	};
	
	
	var _u = su._url;
	
	
	if (_u.api_id && _u.viewer_id && _u.sid && _u.secret){
		
		
		auth_to_vkapi({
			secret: _u.secret,
			sid: _u.sid,
			mid:  _u.viewer_id,
			
		}, false, _u.api_id, false, false, function(){
			if (callback){callback();}
			if (_u.api_settings & 8){
				seesu.delayed_search.switch_to_vk_api();
				dstates.remove_state('body','vk-needs-login');
			} else{
				seesu.delayed_search.we_need_mp3provider()
			}
		});
		
		
		

		
		if (window != window.parent){
			su.vk_app_mode = true;
			console.log('ginsa?')
			var _s = document.createElement('script');
			_s.src='http://vk.com/js/api/xd_connection.js';
			_s.onload = function(){
				if (window.VK){
					VK.init(function(){});
					VK.addCallback('onSettingsChanged', function(sts){
						if (sts & 8){
							
							seesu.delayed_search.switch_to_vk_api();
							dstates.remove_state('body','vk-needs-login');
							
						} else{
							seesu.delayed_search.we_need_mp3provider()
						}
					});
				}
				
			};
			document.documentElement.firstChild.appendChild(_s);
		}	else{
			console.log('hinsa :(((')
		}			
						
		
		
		
	} else{
		if (!do_not_repeat){
			var sm = $('#slider-materail');
			var remove_iframe_ru = function(e){
				setTimeout(function(){
					$(e.target).remove();
					console.log('removed ru!');
				},5000)
				
				
				var remove_iframe_com = function(e){
					setTimeout(function(){
						$(e.target).remove();
						console.log('removed ru!');
					},5000)
				
				}
				
				var tvk_com = $('<iframe id="test_vk_auth_com" class="serv-container" src="http://vk.com/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
				.bind('load',remove_iframe_com);
				sm.append(tvk_com);
			}
			
			var tvk_ru =  $('<iframe id="test_vk_auth_ru" class="serv-container" src="http://vkontakte.ru/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
				.bind('load',remove_iframe_ru);
			
			sm.append(tvk_ru)
		}
		
		
		
		
	}
	
	
	
	
};

try_mp3_providers = function(){
	if (seesu.env.cross_domain_allowed){
		try_hapi();
	} else{
		console.log('heyayy!')
		addEvent(window, "message", function(e){
			if (e.origin == "http://seesu.me") {
				if (e.data.match(/^set_vk_auth\n/)){
					set_vk_auth(e.data.replace(/^set_vk_auth\n/, ''), true);
					seesu.track_event('Auth to vk', 'auth', 'from iframe post message');
				} else if (e.data == 'vkapi_auth_callback_ready'){
					e.source.postMessage('get_vk_auth', 'http://seesu.me');
				}
			} else {
				return false;
			}
		});
		try_api();

	}
  	
	
}	
