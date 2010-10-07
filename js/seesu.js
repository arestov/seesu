window.lfm_image_artist = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_large.png';
window.lfm = function(){
	var _this = this;
	var ag = arguments;
	seesu.lfm_quene.add(function(){
		lastfm.apply(_this, ag)
	})
}
window.seesu = window.su =  {
	  lfm_quene: new funcs_quene(100),
	  cross_domain_allowed: !location.protocol.match(/http/),
	  version: 1.96,
	  env: app_env,
	  track_stat: (function(){
		var _i = document.createElement('iframe');_i.id ='gstat';_i.src = 'http://seesu.me/g_stat.html';

		
		$(function(){
			document.body.appendChild(_i);
		});
		var ga_ready = false;
		var ga_ready_waiter = function(e){
			if ( e.origin == "http://seesu.me") { //security, sir!
				if (e.data == 'ga_stat_ready'){
					ga_ready = true;
					removeEvent(window, "message", ga_ready_waiter);
					seesu.track_stat('_trackPageview', !app_env.unknown_app ? app_env.app_type : 'unknown_app');
				}
			} else {
				return false;
			}
		};
		addEvent(window, "message", ga_ready_waiter);

		return function(){
			if (ga_ready){
				var string = 'track_stat';
				for (var i=0; i < arguments.length; i++) {
					string += '\n' + arguments[i];
				}
			
				_i.contentWindow.postMessage(string, "http://seesu.me");
			}
			
		};
	  })(),
	  track_event:function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackEvent');
		seesu.track_stat.apply(this, args);
	  },
	  popular_artists: ["The Beatles", "Radiohead", "Muse", "Lady Gaga", "Eminem", "Coldplay", "Red Hot Chili Peppers", "Arcade Fire", "Metallica", "Katy Perry", "Linkin Park" ],
	  vk:{
		id: w_storage('vkid'),
		big_vk_cookie: w_storage('big_vk_cookie'),
		set_xhr_headers: function(xhr){
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			if (seesu.env.apple_db_widget && seesu.vk.big_vk_cookie){
				try {
					xhr.setRequestHeader("Cookie", seesu.vk.big_vk_cookie);
				} catch(e){}
			}
		},
		vk_save_pass: w_storage('vk_save_pass')
	  },
	  now_playing:{
		link: null,
		nav: null
	  },
	  ui: {
		views: {
			browsing:{},
			playing:false,
			current_rc: false,
			get_search_rc: function(){
				if (this.browsing.search_results){
					return (this.current_rc = this.browsing.search_results);
				} else {
					return (this.current_rc = this.browsing.search_results = $('<div class="search-results-container current-src"></div').appendTo(searchres));
				}
			},
			get_playlist_c:function(){
				if (this.browsing.playlist){
					return this.browsing.playlist;
				} else {
					return (this.browsing.playlist = $('<ul class="tracks-c current-tracks-c"></ul>').appendTo(artsTracks));
				}
			},
			save_view: function(song_nodes, not_make_playable){
				if (this.playing && song_nodes == this.playing.song_nodes){
					return true;
				} else{					
					this.browsing.song_nodes = song_nodes;
					if (this.playing){
						if (this.playing.search_results){
							if (!this.browsing.with_search_results_link || (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
									this.playing.search_results.remove();
							}
						}
						
						if (this.playing.playlist){
							this.playing.playlist.remove();
						}
						
					}
					this.playing = this.browsing;
					this.browsing = {};
					if (!not_make_playable){
						make_tracklist_playable(song_nodes, true);
					}
					
				}
				
			},
			restore_view: function(){
				this.hide_browsing();
				if (this.playing.search_results){
					this.current_rc = this.playing.search_results;
				}
				if (this.playing){
					this.show_playlist_page(
						this.playing.playlist_title, 
						this.playing.playlist_type, 
						this.playing.with_search_results_link,
						true
					);
				}
				
			},
			show_playing: function(){
				if (this.playing.search_results){
					this.current_rc = this.playing.search_results.show();
				}
				if (this.playing.playlist){
					this.playing.playlist.show();
				}
			},
			hide_playing: function(){
				
				if (this.playing.search_results && (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
					this.playing.search_results.hide();
				
				}
				
				
				if (this.playing.playlist){
					this.playing.playlist.hide();
				}
					
				
			},
			show_browsing: function(){
				if (this.browsing.search_results){
					this.current_rc = this.browsing.search_results.show();
				}
				if (this.browsing.playlist){
					this.browsing.playlist.show();
				}
			},
			hide_browsing: function(){
				if (this.browsing.search_results){
					this.browsing.search_results.hide();
				}
				if (this.browsing.playlist){
					this.browsing.playlist.hide();
				}
			},
			show_now_playing: function(){
				var current_page = slider.className;
				this.restore_view();
				seesu.track_event('Navigation', 'now playing', current_page);
			},
			show_start_page: function(focus_to_input, log_navigation){
				var _s;
				if (log_navigation){
					_s = slider.className;
				}
				slider.className = "show-start";
				if (focus_to_input){
					search_input[0].focus();
					search_input[0].select();
				}
				if (log_navigation){
					seesu.track_event('Navigation', 'start page', _s);
				}
				this.current_rc = false;
				this.hide_playing();
				this.show_browsing();
			},
			show_search_results_page: function(without_input, log_navigation){
				var _s;
				if (log_navigation){
					_s = slider.className;
				}
				slider.className = (without_input ? '' : 'show-search ') + "show-search-results";
				if (log_navigation){
					seesu.track_event('Navigation', 'search results', _s);
				}
			},
			show_playlist_page: function(playlist_title, playlist_type, with_search_results_link, show_playing){
				if (show_playing){
					this.show_playing();
				} else {
					this.hide_playing();
					this.show_browsing();
				}

				if (playlist_title){
					$(nav_playlist_page).text(this.browsing.playlist_title = playlist_title);
				}
				if (playlist_type){
					this.browsing.playlist_type = seesu.ui.playlist_type = playlist_type;
				}
				if (with_search_results_link) {
					this.browsing.with_search_results_link = true;
					seesu.now_playing.nav = slider.className = 'show-full-nav show-player-page';
				} else {
					this.browsing.with_search_results_link = false;
					seesu.now_playing.nav = slider.className = 'show-player-page';
				}
			}
		}
	  },
	  xhrs: {},
	  soundcloud_quene: new funcs_quene(200, 1000 , 7),
	  hypnotoad: {
		vk_api: false,
		search_soundcloud: soundcloud_search,
		search_tracks:function(){
			if(seesu.hypnotoad.vk_api){
				seesu.track_event('mp3 search', 'hypnotoad');
				return seesu.hypnotoad.vk_api.audio_search.apply(seesu.hypnotoad.vk_api, arguments);
			}
			
		}
	  },
	  delayed_search: {
		available: [],
		use:{
			quene:  new funcs_quene(1000, 8000 , 7),
			delay_mini: 2500,
			delay_big: 5000,
			big_delay_interval: 5,
			search_tracks: hardcore_vk_search
		},
		vk:{
			quene:  new funcs_quene(1000, 8000 , 7),
			delay_mini: 1000,
			delay_big: 8000,
			big_delay_interval: 7,
			search_tracks: hardcore_vk_search
		},
		vk_api:{
			quene:  new funcs_quene(1000, 8000 , 7),
			delay_mini: 1200,
			delay_big: 8000,
			big_delay_interval: 7,
			search_tracks : function(){
				seesu.track_event('mp3 search', 'vk api with auth');
				return seesu.vk_api.audio_search.apply(seesu.vk_api, arguments);
			}
		},
		waiting_for_mp3provider : true,
		we_need_mp3provider: function(quene){
			$(document.body).addClass('vk-needs-login');

			seesu.delayed_search.start_for_mp3provider = function(){
				seesu.delayed_search.waiting_for_mp3provider = false;
				seesu.delayed_search.start_for_mp3provider = null;
				if (quene && quene.init) {quene.init();}
			};
		},
		switch_to_vk: function(){
			seesu.delayed_search.use = seesu.delayed_search.vk;
			
			seesu.delayed_search.waiting_for_mp3provider = false;
			w_storage('mp3-search-way', 'vk', true);
			if (typeof seesu.delayed_search.start_for_mp3provider == 'function'){
				seesu.delayed_search.start_for_mp3provider();
			}
		},
		switch_to_vk_api: function(){
			seesu.delayed_search.use = seesu.delayed_search.vk_api;
			
			seesu.delayed_search.waiting_for_mp3provider = false;
			w_storage('mp3-search-way', 'vk_api', true);
			if (typeof seesu.delayed_search.start_for_mp3provider == 'function'){
				seesu.delayed_search.start_for_mp3provider();
			}
		}
	  }
	};
	
window.set_vk_auth = function(vk_session, save_to_store){
	var vk_s = JSON.parse(vk_session);
	var rightnow = ((new Date()).getTime()/1000).toFixed(0);
	if (vk_s.expire > rightnow){
		seesu.vk_api = new vk_api([{
			api_id: 1915003, 
			s: vk_s.secret,
			viewer_id: vk_s.mid, 
			sid: vk_s.sid, 
			use_cache: true,
			v: "3.0"
		}], seesu.delayed_search.vk_api.quene);
		seesu.delayed_search.switch_to_vk_api();
		$(document.body).removeClass('vk-needs-login');
		if (save_to_store){
			w_storage('vk_session', vk_s, true);
		}
		setTimeout(function(){
			seesu.delayed_search.waiting_for_mp3provider = true;
			$(document.body).addClass('vk-needs-login');
		}, (vk_s.expire - rightnow)*1000);
		
	} else{
		w_storage('vk_session', '', true);
	}

};

var vk_session_meta = document.getElementsByName('vk_session');
if (vk_session_meta && vk_session_meta.length){
	if (vk_session_meta[0] && vk_session_meta[0].content){
		set_vk_auth(vk_session_meta[0].content, true);
		seesu.track_event('Auth to vk', 'auth', 'from meta tag (iframe redirect)');
	} else{
		var vk_session_stored = w_storage('vk_session');
		if (vk_session_stored){
			set_vk_auth(vk_session_stored);
			seesu.track_event('Auth to vk', 'auth', 'from saved');
		}
	}
} else{
	var vk_session_stored = w_storage('vk_session');
	if (vk_session_stored){
		set_vk_auth(vk_session_stored);
		seesu.track_event('Auth to vk', 'auth', 'from saved');
	}
}
wait_for_vklogin = function(){};
vkReferer = '';
lfm_auth = {};

lfm_auth.sk = w_storage('lfmsk') || false;
lfm_auth.user_name = w_storage('lfm_user_name') || false;
lfm_auth.ui_logged = function(){
	$(document.body).addClass('lfm-auth-done');
	$('.lfm-finish input[type=checkbox]').attr('checked', 'checked');
	$('#scrobbling-switches').find('input').attr('disabled', '');
};
lfm_auth.login = function(r){
	lfm_auth.sk = r.session.key;
	lfm_auth.user_name = r.session.name;
	w_storage('lfm_user_name', lfm_auth.user_name, true);
	w_storage('lfmsk', lfm_auth.sk, true);
	lfm_auth.ui_logged();
};
var updating_notify = function(r){
	if (!r){return;}
	var cver = r.latest_version.number;
	if (cver > seesu.version) {
		var message = 
		 'Suddenly, Seesu ' + cver + ' has come. ' + 
		 'You have version ' + seesu.version + '. ';
		var link = r.latest_version.link;
		if (link.indexOf('http') != -1) {
			widget.showNotification(message, function(){
				widget.openURL(link);
			});
			$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"></a>');
		}
	}
	if (r.vk_apis){
		seesu.hypnotoad.api = new vk_api(r.vk_apis, new quene(1300,5000,7));
	}
	console.log('lv: ' +  cver + ' reg link: ' + (vkReferer = r.vk_referer));

};
var check_seesu_updates = function(){
	$.ajax({
	  url: seesu.cross_domain_allowed ? 'http://seesu.me/update' : '/update',
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'hash': hex_md5(widget.identifier),
		'version': seesu.version,
		'demension_x': w_storage('width'),
		'demension_y': w_storage('height')
	  },
	  error: function(){
	  },
	  success: updating_notify
	});
};

var external_playlist = function(array){ //array = [{artist_name: '', track_title: '', duration: '', mp3link: ''}]
	this.result = this.header + '\n';
	for (var i=0; i < array.length; i++) {
		this.result += this.preline + ':' + (array[i].duration || '-1') + ',' + array[i].artist_name + ' - ' + array[i].track_title + '\n' + array[i].mp3link + '\n';
	}
	this.data_uri = this.request_header + escape(this.result);
	
};
external_playlist.prototype = {
	header : '#EXTM3U',
	preline: '#EXTINF',
	request_header : 'data:audio/x-mpegurl; filename=seesu_playlist.m3u; charset=utf-8,'
};

var make_external_playlist = function(){
	if (!seesu.player.current_song ){return false;}
	var playlist_nodes_for = seesu.player.current_song.data('link_to_playlist');
	
	if (playlist_nodes_for && playlist_nodes_for.length){
		var simple_playlist = [];
		
		for (var i=0; i < playlist_nodes_for.length; i++) {
			simple_playlist.push({
				track_title: playlist_nodes_for[i].data('track_title'),
				artist_name: playlist_nodes_for[i].data('artist_name'),
				duration: playlist_nodes_for[i].data('duration'),
				mp3link: playlist_nodes_for[i].data('mp3link')
			});
			
		}
		
		seesu.player.current_external_playlist = new external_playlist(simple_playlist);
		export_playlist.attr('href', seesu.player.current_external_playlist.data_uri);
		
	}
};




var sort_by_play_order = function(g,f){
	if (g && f) {
		if (g.data('play_order') > f.data('play_order'))
			{return 1;}
		else if (g.data('play_order') < f.data('play_order'))
			{return -1;}
		else
		{return 0;}
	} else {return 0;}
	
};
var resort_playlist = function(playlist_nodes_for){
	playlist_nodes_for.sort(sort_by_play_order);
	if (playlist_nodes_for.length > 1) {
		for (var i=0, l = playlist_nodes_for.length; i < l ; i++) {
			playlist_nodes_for[i].data('number_in_playlist',i);
		}
	}
};
var get_track_as_possible = function(node, order, mp3_prov_quene){
	var used_successful = get_track(node);
	if (!used_successful && seesu.delayed_search.waiting_for_mp3provider){
		if (mp3_prov_quene) {
			mp3_prov_quene.add(function(){
				if (!node.data('mp3link')){
					get_track(node, true);
				} 
			}, true);
		}
	}
	if (!used_successful && order === 0){
		get_track(node, false, true);
	}
};


var random_track_plable = function(track_list){
	var random_track_num = Math.floor(Math.random()*track_list.length);
	return track_list[random_track_num];
	
};
var start_random_nice_track_search = function(node, ob, mp3_prov_quene, not_search_mp3){
	getTopTracks(node.data('artist_name'), function(track_list){
		var some_track = random_track_plable(track_list);
		node.text(some_track.artist + ' - ' + some_track.track);
		node.data('track_title', some_track.track );
		if (!not_search_mp3){
			get_track_as_possible(node, ob.num, mp3_prov_quene);
		}
		
		++ob.num;
	});
};

var make_tracklist_playable = function(track_nodes, full_allowing){
	var mp3_prov_quene;
	
	
	if (full_allowing){
		if (seesu.delayed_search.waiting_for_mp3provider){
			mp3_prov_quene = new funcs_quene();
			seesu.delayed_search.we_need_mp3provider(mp3_prov_quene);
		}
		if (seesu.delayed_search.use.quene) {
			seesu.delayed_search.use.quene.reset();
		} 
		seesu.delayed_search.tracks_waiting_for_search = 0;
		art_tracks_w_counter.text('');
	}
	

	var ob = {num:0};
	for (var i=0, l =  track_nodes.length; i < l; i++) {
		var node = track_nodes[i];
		if (!!node.data('track_title')){
			if (full_allowing){
				if (!node.data('fetch_started')){
					get_track_as_possible(node.data('fetch_started', true), i, mp3_prov_quene);
				}
			}
		} else{
			start_random_nice_track_search(node, ob, mp3_prov_quene, !full_allowing);
		}
	}
};
var make_node_playable = function(node, music_object){
	
	
	var playable_node = $(node)
		.addClass('song')
		.removeClass('search-mp3-failed')
		.removeClass('waiting-full-render')
		.data('mp3link', music_object.link)
		.data('not_use', false)
		.data('duration', music_object.duration)
		.data('music_object', music_object)
		.unbind()
		.click(function(){
			var node = $(this);
			seesu.ui.views.save_view(node.data('full_playlist'));
			seesu.player.song_click(node);
		});
		
	var playlist_nodes_for = playable_node.data('link_to_playlist');
	playlist_nodes_for.push(playable_node);
	
	
	if (music_object.from != 'vk_api'){
		var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href':  music_object.link });
		mp3.insertBefore(playable_node);
	} else{
		playable_node.addClass('mp3-download-is-not-allowed');
	}
	
	
	if (music_object.duration) {
		var digits = music_object.duration % 60;
		var track_dur = (Math.round(music_object.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
		playable_node.prepend($('<a class="song-duration"></a>').text(track_dur + ' '));
	}
	var playlist_length = playlist_nodes_for.length;
	
	playable_node.data('number_in_playlist', playlist_length-1);
	
	if (playable_node.data('want_to_play') == seesu.player.want_to_play) {
		seesu.player.set_current_song(playable_node, true);
	}

	if (playlist_length == 2) {
		seesu.player.fix_songs_ui();
	}

};



var render_playlist = function(vk_music_list) { // if links present than do full rendering! yearh!
	

	var ul = seesu.ui.views.get_playlist_c();
	ul.empty();
	if (!vk_music_list){
		$(ul).append('<li>Nothing found</li>');
	} else {
		if (!seesu.now_playing.link){
			if (seesu.start_screen){
				$('<p></p>').attr('id', 'now-play-b').append(
					seesu.now_playing.link = $('<a></a>').text('Now Playing').attr('class', 'js-serv').click(function(){
						seesu.ui.views.show_now_playing();
					})
				).appendTo(seesu.start_screen);

			}
			
		}
		
		var linkNodes = [];
		var playlist_nodes_for = [];
		
		
		var we_have_tracks = vk_music_list[0].track ? true : false;
		var we_have_mp3links = vk_music_list[0].link ? true : false;
		
		var empty_song_click = function(){
			var clicked_node = $(this);
			
			if (seesu.player.wainter_for_play) {seesu.player.wainter_for_play.removeClass('marked-for-play');}
			var new_pr = ++seesu.player.want_to_play;
			clicked_node.data('want_to_play', new_pr).addClass('marked-for-play');
			var delayed_in = clicked_node.data('delayed_in');
			for (var i=0; i < delayed_in.length; i++) {
				delayed_in[i].pr = new_pr;
			}
			
			seesu.player.wainter_for_play = clicked_node;
			
			seesu.ui.views.save_view(clicked_node.data('full_playlist'));
			
			get_track(clicked_node, false, true);
			
			seesu.track_event('Song click', 'empty song');
			return false;	
		};
		for (var i=0, l = vk_music_list.length; i < l; i++) {
			var track = $("<a></a>")
				.data('artist_name', vk_music_list[i].artist)
				.addClass('track-node waiting-full-render')
				.data('play_order', i)
				.data('delayed_in', [])
				.data('full_playlist', linkNodes)
				.data('link_to_playlist', playlist_nodes_for)
				.click(empty_song_click),
				li = document.createElement('li');
			this.play_controls.node.clone(true).appendTo(li);
			if (we_have_tracks){
				track.text(vk_music_list[i].artist + ' - ' + vk_music_list[i].track);
				track.data('track_title', vk_music_list[i].track );
			} else{
				track.text(vk_music_list[i].artist);
			}
			
			
			
			$(li)
				.append(track)
				.appendTo(ul);
			
			if (we_have_mp3links) {
				make_node_playable(track, vk_music_list[i]);
			}
			
			linkNodes.push(track);
			
		}
	
		if (!we_have_mp3links){
			if (seesu.player.autostart){
				seesu.ui.views.save_view(linkNodes);
				seesu.player.autostart = false;
			} else{
				make_tracklist_playable(linkNodes);
			}
			//get mp3 for each prepaired node (do many many delayed requests to mp3 provider)
	
		} else{
			if (seesu.player.autostart){
				seesu.ui.views.save_view(linkNodes, true);
				seesu.player.autostart = false;
			}
		}
		return true;
	}
};
var show_track = function(query, with_search_results){
	
	
	if (seesu.delayed_search.waiting_for_mp3provider){
		mp3_prov_quene = new funcs_quene();
		seesu.delayed_search.we_need_mp3provider(mp3_prov_quene);
	}
	seesu.ui.views.show_playlist_page(query, 'tracks', with_search_results);
	var used_successful = get_all_tracks(query, render_playlist);
	if (!used_successful && seesu.delayed_search.waiting_for_mp3provider){
		if (mp3_prov_quene) {
			mp3_prov_quene.add(function(){get_all_tracks(query, render_playlist, true);}, true);
		}
	}
	if (!used_successful){
		get_all_tracks(query, render_playlist, false, true);
	}
	
	
	
};
var getTopTracks = function(artist,callback) {
	lfm('artist.getTopTracks',{'artist': artist },function(r){
		if (typeof r != 'object') {return;}
		var tracks = r.toptracks.track || false;
		if (tracks) {
			var track_list = [];
			if (tracks.length){
				for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
					track_list.push({'artist' : artist ,'track': tracks[i].name});
				}
			} else{
				track_list.push({'artist' : artist ,'track': tracks.name});
			}
			
			if (callback) {callback(track_list);}
		}
	});
};

var proxy_render_artists_tracks = function(artist_list){
	var track_list_without_tracks = [];
	for (var i=0; i < artist_list.length; i++) {
		track_list_without_tracks.push({"artist" :artist_list[i]});
	}
	render_playlist(track_list_without_tracks);
};
var render_loved = function(user_name){
	lfm('user.getLovedTracks',{user: (user_name || lfm_auth.user_name), limit: 30},function(r){
		
		var tracks = r.lovedtracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
				track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
			}
			render_playlist(track_list);
		}
	});
	seesu.ui.views.show_playlist_page('Loved Tracks', 'artists by loved');
};
var render_recommendations_by_username = function(username){
	$.ajax({
		url: 'http://ws.audioscrobbler.com/1.0/user/' + username + '/systemrecs.rss',
		  global: false,
		  type: "GET",
		  dataType: "xml",
		  error: function(xml){
		  },
		  success: function(xml){
			var artists = $(xml).find('channel item title');
			if (artists && artists.length) {
				var artist_list = [];
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					var artist = $(artists[i]).text();
					artist_list.push(artist);
				}
				proxy_render_artists_tracks(artist_list);
			}
		  }
	});

	seesu.ui.views.show_playlist_page('Recommendations for ' +  username, 'artists by recommendations');
};
var render_recommendations = function(){
	lfm('user.getRecommendedArtists',{sk: lfm_auth.sk},function(r){
		var artists = r.recommendations.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			proxy_render_artists_tracks(artist_list);
		}
	}, false);

	seesu.ui.views.show_playlist_page('Recommendations for you', 'artists by recommendations');

};


var get_artists_by_tag = function(tag,callback){
	lfm('tag.getTopArtists',{'tag':tag},function(r){
		var artists = r.topartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	}, false);
	return true;
};
var show_tag = function(tag, with_search_results){
	get_artists_by_tag(tag, proxy_render_artists_tracks);
	seesu.ui.views.show_playlist_page('Tag: ' + tag, 'artists by tag', with_search_results);

};


var get_similar_artists = function(original_artist, callback){
	lfm('artist.getSimilar',{'artist': original_artist},function(r){
		var artists = r.similarartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	});
	return true;
};

var render_tracks_by_similar_artists = function(original_artist){
	seesu.ui.views.show_playlist_page('Similar to «' + original_artist + '» artists', 'similar artists');
	get_similar_artists(original_artist, proxy_render_artists_tracks);
	
};






var make_lastfm_playlist = function(r){
	var playlist = r.playlist.trackList.track;
	if  (playlist){
		var music_list = [];
		if (playlist.length){
			
			for (var i=0; i < playlist.length; i++) {
				music_list.push({track: playlist[i].title, artist: playlist[i].creator });
			}
		} else if (playlist.title){
			music_list.push({track: playlist.title, artist: playlist.creator });
		}
		if (music_list){
			render_playlist(music_list);
		} else {
			render_playlist();
		}
	} else{
		render_playlist();
	}
};
var get_artist_album_playlist = function(r){
	var album_id = r.album.id;
	if (album_id) {
		lfm('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id}, make_lastfm_playlist);
	}
};

var get_artist_album_info = function(artist, album, callback){
	
	lfm('album.getInfo',{'artist': artist, album : album},function(r){
		if (callback) {callback(r);}
	});
	
};
seesu.toogle_art_alb_container = function(link){
	if (seesu.artist_albums_container.is('.collapse-albums')){
		seesu.artist_albums_container.removeClass('collapse-albums');
		link.text('hide them');
	} else{
		seesu.artist_albums_container.addClass('collapse-albums');
		link.text('show them');
	}
};
var artist_albums_renderer = function(r, container){
	var albums = r.topalbums.album;
	var albums_ul = $('<ul></ul>');
	if (albums){
		
		var create_album = function(al_name, al_url, al_image, al_artist){
			var li = $('<li></li>').appendTo(albums_ul);
			var a_href= $('<a></a>')
				.attr('href', al_url )
				.data('artist', al_artist)
				.data('album', al_name)
				.click(function(){
					seesu.toogle_art_alb_container(seesu.artist_albums_container.data('albums_link'));
					seesu.ui.views.show_playlist_page('(' + artist + ') ' + album ,'album');
					get_artist_album_info(al_artist, al_name, get_artist_album_playlist );
					seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
					return false;
				})
				.appendTo(li);
			$('<img/>').attr('src', al_image).appendTo(a_href);
			$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
		};
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				create_album(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name);
				
			}
		} else if (albums.name){
			create_album(albums.name, albums.url, (albums.image && albums.image[1]['#text']) || '', albums.artist.name );
		}
		
	} else {
		albums_ul.append('<li>No albums information</li>');
	}
	container.append(albums_ul);
};
var show_artist_info = function(r, ainf){
	
	ainf.bio.parent().addClass('background-changes');
	var info	 = r.artist || false;
	var similars, artist, tags, bio, image;
	if (info) {
		similars = info.similar && info.similar.artist;
		artist	 = info.name;
		tags	 = info.tags && info.tags.tag;
		bio		 = info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
		image	 = (info.image && info.image[2]['#text']) || lfm_image_artist;
	} 
		
	if (artist) {
		ainf.image.attr({'src': image ,'alt': artist});
	}
	if (bio){
		ainf.bio.html(bio);
	}
	
	
	
	
	
	if (tags && tags.length) {
		var tags_p = $("<p class='artist-tags'></p>").append('<span class="desc-name">Tags:</span>');
		var tags_text = $('<span class="desc-text"></span>').appendTo(tags_p);
		for (var i=0, l = tags.length; i < l; i++) {
			var tag = tags[i],
				arts_tag_node = $("<a></a>")
					.text(tag.name)
					.attr({ 
						href: tag.url,
						'class': 'music-tag js-serv'
					})
					.data('music_tag', tag.name)
					.appendTo(tags_text); //!using in DOM
		}
		ainf.meta_info.append(tags_p);
	}
	
	if (similars && similars.length) {
		var similars_p = $("<p></p>").attr({ 'class': 'artist-similar'}),
			similars_a = $('<a></a>').append('Similar artists').attr({ 'class': 'similar-artists js-serv'}).data('artist', artist);	
		$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p).append(document.createTextNode(':'));
		var similars_text = $('<span class="desc-text"></span>').appendTo(similars_p);
		for (var i=0, l = similars.length; i < l; i++) {
			var similar = similars[i],
				arts_similar_node = $("<a class='js-serv'></a>")
				  .text(similar.name)
				  .attr({ 
					href: similar.url, 
					'class' : 'artist js-serv' 
				  })
				  .data('artist', similar.name )
				  .appendTo(similars_text);//!using in DOM
		}
		ainf.meta_info.append(similars_p);
	}
	var artist_albums_container = seesu.artist_albums_container = $('<div class="artist-albums"></div>').append('<span class="desc-name">Albums:</span>').appendTo(ainf.meta_info);
	var artist_albums_text = $('<div class=""></div>').appendTo(artist_albums_container);
	if (artist_albums_container){
		
		var albums_link = $('<a class="js-serv get-artist-albums">get albums</a>')
			.click(function(){
				var _this = $(this);
				if (!_this.data('albums-loaded')){
					
					artist_albums_container.addClass('albums-loading');
					
					lfm('artist.getTopAlbums',{'artist': artist },function(r){
						if (typeof r != 'object') {return;}
						artist_albums_renderer(r, artist_albums_text);
						_this.data('albums-loaded', true);
						artist_albums_container.removeClass('albums-loading');
					});
					_this.text('hide them');
					seesu.track_event('Artist navigation', 'show artist info', artist);
				} else{
					seesu.toogle_art_alb_container(_this);
				}
			})
			.appendTo(artist_albums_text);
		artist_albums_container.data('albums_link', albums_link);
	}
	ainf.bio.parent().removeClass('background-changes');

};
window.update_track_info = function(a_info, node){
	var ti = a_info.find('.track-info').empty();
	var mo = node.data('music_object');
	if (mo.from && mo.from == 'soundcloud'){
		if (mo.page_link){
			var sc_link = $('<a></a>')
				.attr('href', mo.page_link)
				.text('page of this track')
				.click(function(){
					widget.openURL(mo.page_link);
					seesu.track_event('Links', 'soundcloud track');
					return false;
				});
		}
		
		ti.append(
			$('<p></p>')
				.text(
					'This track was found in SoundCloud. ' + 
					'It may not match with track you are searching for at all. Try to use vk.com (vkontakte.ru) '
				 )
				 .append(sc_link)
			
		);
	}	
};
var update_artist_info = function(artist, a_info, not_show_link_to_artist_page){
	if (seesu.player.current_artist == artist) {
		if (seesu.ui.playlist_type == 'artist'){
			if (seesu.player.top_tracks_link){
				seesu.player.top_tracks_link.remove();
			}
		}
	} else {
		
		var ainf = {
			name: a_info.find('.artist-name').empty(), 
			image: a_info.find('img.artist-image'),
			bio: a_info.find('.artist-bio'),
			meta_info: a_info.find('.artist-meta-info'),
			c : a_info
		};
		
		
		var arts_name = $('<span class="desc-name"></span>')
			.appendTo(ainf.name);
			
		if (seesu.ui.playlist_type != 'artist'){
			seesu.player.top_tracks_link = $('<a class="js-serv">top tracks</a>')
				.data('artist', artist)
				.appendTo(arts_name)
				.click(function(){
					show_artist(artist);
					seesu.track_event('Artist navigation', 'top tracks', artist);
				});
		}	
		
		$('<a></a>')
			.attr('href', 'http://www.last.fm/music/' + artist.replace(' ', '+'))
			.text('profile')
			.attr('title', 'last.fm profile')
			.click(function(){
				var link = 'http://www.last.fm/music/' + artist.replace(' ', '+');
				widget.openURL(link);
				seesu.track_event('Links', 'lastfm', link);
				return false;
			})
			.appendTo(arts_name);
		
		$('<span class="desc-text"></span>')
			.text(artist)
			.appendTo(ainf.name);
			
		ainf.image.attr('src', '').attr('alt', artist);
		ainf.bio.text('...');
		ainf.meta_info.empty();
		
		lfm('artist.getInfo',{'artist': artist }, function(r){
			show_artist_info(r, ainf);
		});
	}
};
var show_artist = function (artist,with_search_results) {
	
	if (seesu.player.current_artist == artist && seesu.ui.playlist_type == 'artist') {
		seesu.ui.views.restore_view();
		return true;
	}
	seesu.ui.views.show_playlist_page(artist, 'artist', with_search_results);
	getTopTracks(artist,function(track_list){
		render_playlist(track_list);
	});
	lfm('artist.getInfo',{'artist': artist });

	
};

$(function(){
	if (seesu.cross_domain_allowed && lfm_auth.sk && !lfm_scrobble.s) {lfm_scrobble.handshake();}
	check_seesu_updates();
	seesu.vk_id = w_storage('vkid');
	try_mp3_providers();
	var get_lfm_token = function(lfm_auth,callback){
		lfm('auth.getToken',false,function(r){
			lfm_auth.newtoken = r.token;
			if (callback) {callback(lfm_auth.newtoken);}
		})
	}
	if (!lfm_auth.sk) {
		get_lfm_token(lfm_auth);
	}
})
