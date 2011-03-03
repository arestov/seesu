var searches_pr = {
	vk: 0,
	soundcloud: -5
};

cmo = {
	addSteamPart: function(mo, search_source, t ){
		var _ms = this.getMusicStore(mo, search_source);
		_ms.t = t;
	},
	blockSteamPart: function(mo, search_source){
		var _ms = this.getMusicStore(mo, search_source);
		_ms.failed = true;
		if (search_source.fixable){
			_ms.fixable = true;
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
function canUseSearch(mo, search_source){
	if (!mo.steams){
		return true;
	}
	if (!mo.steams[search_source.name]){
		return true;
	}
	
	var my_steam = mo.steams[search_source.key];
	if (my_steam){
		if (my_steam.failed){
			if (my_steam.fixable){
				return true;
			} else{
				return false;
			}
		} else if (my_steam.t){
			return false; 
		} else{
			return true;
		}
		
	}
		
	var fixable = true;
	var getted = false;
	for (var steam in mo.steams) {
		if (mo.steams[steam].t){
			getted = true;
		}
		if (mo.steams[steam].failed && !mo.steams[steam].fixable){
			fixable = false;
		}
		
	};
	if (!getted && fixable){
		return true;
	} else{
		return false;
	}
};
var get_track = function(mo, nocache, hypnotoad, only_cache, get_next){
	var allow_h = hypnotoad && seesu.delayed_search.waiting_for_mp3provider;
	
	
	if (!nocache && !only_cache && !hypnotoad){
		seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	var s = allow_h ? seesu.hypnotoad.search_soundcloud : seesu.delayed_search.use.search_tracks;
	var last_hypnotoad_try = false;
	var callback_success = function(music_list, search_source){
		//success
		
		mo.node.removeClass('search-mp3');
		
		
		var query = {
			artist: HTMLDecode(mo.artist),
			track: HTMLDecode(mo.track)
		}
		music_list.sort(function(g,f){
			return by_best_matching_index(g,f, query)
		});
		
		make_node_playable(mo, music_list, search_source);
		
		seesu.ui.els.export_playlist.addClass('can-be-used');
		if (!nocache && !only_cache && !hypnotoad){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		
	}
	
	var callback_error = function(search_source){
		//error
		
		if (!mo.not_use){

			
			if (allow_h && seesu.hypnotoad.vk_api && !last_hypnotoad_try ){
			
				last_hypnotoad_try = true;
				seesu.hypnotoad.search_tracks(
					mo.artist + ' - ' + mo.track, callback_success, callback_error, 
					nocache,
					function(){
						if(mo.ready_for_play){
							return false;
						}
						mo.node.addClass('search-mp3');
					}
				)
				
			} else{
				if (get_next){
					mo.not_use=true;
					if (seesu.player.c_song && ((seesu.player.c_song.next_song && (mo == seesu.player.c_song.next_song)) || 
						(seesu.player.c_song.prev_song && (mo == seesu.player.c_song.prev_song)))){
						seesu.player.fix_songs_ui();
					}
					if (seesu.player.c_song && seesu.player.c_song.next_song && !seesu.player.c_song.next_song.ready_for_play){
						get_next_track_with_priority(seesu.player.c_song.next_song);
					}
				}
				
			}
		} else{
			return false;
		}
		
		
		
		mo.node.removeClass('search-mp3').addClass('search-mp3-failed').removeClass('waiting-full-render');
		if (!nocache && !only_cache && !hypnotoad){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		
	}
	var used_successful = s(
		mo.artist + ' - ' + mo.track, callback_success, callback_error, 
		nocache,
		function(){
			
			mo.node.addClass('search-mp3');
		},
		only_cache
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
var reg_exp_string_fix;


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

var mp3_prov_selected = w_storage('mp3-search-way');
var have_mp3_provider;
window.prov_count_down = 1;
var provider_selected;

window.swith_to_provider = function(try_selected){
	if (provider_selected) {return false}
	if (mp3_prov_selected && seesu.delayed_search.available && seesu.delayed_search.available.length){
	
		
		for (var i=0; i < seesu.delayed_search.available.length; i++) {
			var current_prov = seesu.delayed_search.available[i];
			if (current_prov == mp3_prov_selected){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				console.log('selected prov ' + current_prov);
			}
		};
		if (!provider_selected && !try_selected){
			var current_prov = seesu.delayed_search.available[0];
			if (current_prov){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				console.log('not selected prov ' + current_prov);
			} else{
				console.log('must use vkontakte');
			}
		}
		
	} else if (!try_selected){
		var someone_available = seesu.delayed_search.available[0];
		if (someone_available){
			seesu.delayed_search['switch_to_' + someone_available]();
			console.log('some avai prov ' + someone_available)
		} else{
			console.log('must use vkontakte');
		}
	}
}
window.swith_to_provider_finish = function(){
	prov_count_down--;
	if (prov_count_down == 0){
		swith_to_provider();
	}
}




window.try_hard_vk_working = function(callback){
	var try_to_auth = function(){
		var login = w_storage( 'vk_auth_login');
		var pass = w_storage( 'vk_auth_pass');
		if (login && pass){
			console.log('we have pass in storage')
			vk_send_captcha('', login, pass)
		}
	};
	
	$.ajax({
	  url: "http://vk.com/feed2.php",
	  global: false,
	  type: "GET",
	  dataType: "text",
	  timeout: 7000,
	  beforeSend: seesu.vk.set_xhr_headers,
	  success: function(text){
		if (text.match(/^\{/) && text.match(/\}$/)){
			try {
				var r = $.parseJSON(text);
				if (r.user && r.user.id) {
					if (callback){
						callback(r);
					} else{
						seesu.delayed_search.available.push('vk');
						seesu.vk_logged_in = true;
						console.log('vk mp3 prov ok')
						swith_to_provider(true)
					}
				} else{
					vk_logged_out();
					console.log('vk mp3 prov faild');
					try_to_auth();
				
					
					
				}
			} catch(e) {
				console.log(e)
			}
		} else{
			vk_logged_out();
			console.log('vk mp3 prov faild (can not parse)');
			try_to_auth();
			
		}
	  },
	  error: function(xhr){
		console.log('vk mp3 prov faild with jq error')
		vk_logged_out();
	  },
	  complete: function(xhr){
		swith_to_provider_finish();
	  }

	});
};

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
