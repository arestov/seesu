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
	  version: 1.98,
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
					
					
					
					seesu.track_stat('_setCustomVar', 1, 'environmental', (!app_env.unknown_app ? app_env.app_type : 'unknown_app'), 1);
					seesu.track_stat('_setCustomVar', 2, 'version', seesu.version, 1);
					seesu.track_stat('_trackEvent', 'environmental', 'version', seesu.version);
					seesu.track_stat('_trackEvent', 'environmental', 'type', (!app_env.unknown_app ? app_env.app_type : 'unknown_app'));
					
					seesu.track_stat('_trackPageview', 'start page');
					
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
	  track_page:function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackPageview');
		seesu.track_stat.apply(this, args);
	  },
	   track_var: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_setCustomVar');
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
	  ui: new seesu_ui(document),
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
	  url: seesu.env.cross_domain_allowed ? 'http://seesu.me/update' : '/update',
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
	if (!seesu.player.c_song ){return false;}
	var playlist_nodes_for = seesu.player.c_song.mo_titl.plst_pla;
	
	if (playlist_nodes_for && playlist_nodes_for.length){
		var simple_playlist = [];
		
		for (var i=0; i < playlist_nodes_for.length; i++) {
			simple_playlist.push({
				track_title: playlist_nodes_for[i].track,
				artist_name: playlist_nodes_for[i].artist,
				duration: playlist_nodes_for[i].duration,
				mp3link: playlist_nodes_for[i].link
			});
			
		}
		
		seesu.player.current_external_playlist = new external_playlist(simple_playlist);
		export_playlist.attr('href', seesu.player.current_external_playlist.data_uri);
		
	}
};



var by_play_order = function(g,f){
	if (g && f) {
		if (g.mo_titl.play_order > f.mo_titl.play_order)
			{return 1;}
		else if (g.mo_titl.play_order < f.mo_titl.play_order)
			{return -1;}
		else
		{return 0;}
	} else {return 0;}
	
};

var resort_plst= function(plst_pla){
	plst_pla.sort(by_play_order);
	if (plst_pla.length > 1) {
		for (var i=0, l = plst_pla.length; i < l ; i++) {
			plst_pla[i].number_in_playlist = i;
		}
	}
}
var get_next_track_with_priority = function(mo){
	var _din = mo.delayed_in;
	for (var i=0; i < _din.length; i++) {
		_din[i].pr = seesu.player.want_to_play || 1;
	}
	get_track_as_possible(mo, true, false, false, true);
}
var get_track_as_possible = function(mo, can_use_hypnotoad, mp3_prov_quene, only_cache, get_next){
	var _ocache = only_cache || seesu.delayed_search.waiting_for_mp3provider;
	var used_successful = get_track(mo,false, false, _ocache, get_next);
	if (!used_successful && seesu.delayed_search.waiting_for_mp3provider){
		if (mp3_prov_quene) {
			mp3_prov_quene.add(function(){
				if (!mo.link){
					get_track(mo, true);
				} 
			}, true);
		}
	}
	if (!only_cache && !used_successful && can_use_hypnotoad){
		get_track(mo, false, true);
	}
};


var random_track_plable = function(track_list){
	var random_track_num = Math.floor(Math.random()*track_list.length);
	return track_list[random_track_num];
	
};
var start_random_nice_track_search = function(mo, ob, mp3_prov_quene, not_search_mp3){
	getTopTracks(mo.artist, function(track_list){
		var some_track = random_track_plable(track_list);
		
		mo.node.text(some_track.artist + ' - ' + (mo.track = some_track.track));
		get_track_as_possible(mo, ob.num  === 0, mp3_prov_quene, not_search_mp3);
		
		
		++ob.num;
	});
};
var reset_q = function(){
	var mp3_prov_quene;
		if (seesu.delayed_search.waiting_for_mp3provider){
			mp3_prov_quene = new funcs_quene();
			seesu.delayed_search.we_need_mp3provider(mp3_prov_quene);
		}
		if (seesu.delayed_search.use.quene) {
			seesu.delayed_search.use.quene.reset();
		} 
		seesu.delayed_search.tracks_waiting_for_search = 0;
		art_tracks_w_counter.text('');
	return mp3_prov_quene;
}
var make_tracklist_playable = function(pl, full_allowing, reset){
	var mp3_prov_quene;
	if (full_allowing || reset){
		mp3_prov_quene = reset_q();
	}
	if (reset){
		return false;
	}
	
	

	var ob = {num:0};
	for (var i=0, l =  pl.length; i < l; i++) {
		var mo = pl[i];
		if (!mo.mo_pla){
			if (!!mo.track){
				if (full_allowing){
					if (!mo.fetch_started){
						get_track_as_possible(mo, i === 0, mp3_prov_quene);
						mo.fetch_started = true;
					}
				} else{
					get_track_as_possible(mo, i === 0, mp3_prov_quene, true);
				}
			} else{
				start_random_nice_track_search(mo, ob, mp3_prov_quene, !full_allowing);
			}
		} else{
			if (!mo.ready_for_play){
				make_node_playable(mo, mo.mo_pla);
			}
		}
		
	}
};
var make_node_playable = function(mo, music_object){


	if (mo.mo_pla && mo.node){
		node.find('a.song-duration').remove();
	}
	mo.not_use = false;
	
	var playable_node = mo.node && mo.node
		.addClass('song')
		.removeClass('search-mp3-failed')
		.removeClass('waiting-full-render')
		.data('mo_pla', music_object)
		.unbind()
		.click(function(){
			seesu.ui.views.save_view(mo.plst_titl);
			seesu.player.song_click(music_object);
		}) || false;

	(mo.mo_pla = music_object).mo_titl = mo;
	if (playable_node){
		music_object.node = playable_node;
	}
	
		

	var playlist_length = mo.plst_pla.push(music_object);
	music_object.number_in_playlist =  playlist_length-1;
	
	resort_plst(mo.plst_pla);
	
	if (playable_node){
		if (music_object.from != 'vk_api'){
			var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href':  music_object.link });
			mp3.insertBefore(playable_node);
		} else{
			playable_node.addClass('mp3-download-is-not-allowed');
		}
	}
	
	
	if(playable_node){
		if (music_object.duration) {
			var digits = music_object.duration % 60;
			var track_dur = (Math.round(music_object.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			playable_node.prepend($('<a class="song-duration"></a>').text(track_dur + ' '));
		}
	}
	
	
	mo.ready_for_play = true;
	
	
	if (mo.want_to_play == seesu.player.want_to_play) {
		if (seesu.player.wainter_for_play == mo) {
			seesu.player.play_song(mo.mo_pla, true);
		}
		
	}

	if (playlist_length == 2) {
		seesu.player.fix_songs_ui();
	}
	
};

var empty_song_click = function(){
	var clicked_node = $(this);
	
	if (seesu.player.wainter_for_play && seesu.player.wainter_for_play.node) {
		seesu.player.wainter_for_play.node.removeClass('marked-for-play');
	}
	var new_pr = ++seesu.player.want_to_play;
	
	var mo = clicked_node.addClass('marked-for-play').data('mo_titl');
	mo.want_to_play = new_pr;
	var delayed_in = mo.delayed_in;
	for (var i=0; i < delayed_in.length; i++) {
		delayed_in[i].pr = new_pr;
	}
	
	seesu.player.wainter_for_play = mo;
	seesu.ui.views.save_view(mo.plst_titl);
	
	get_track(mo, false, true);
	
	seesu.track_event('Song click', 'empty song');
	return false;	
};



var create_playlist =  function(pl, not_clear){
	if (!pl){
		seesu.ui.render_playlist();
	} else{
		pl.plst_pla = [];
		for (var i=0, l = pl.length; i < l; i++) {
			seesu.gena.connect(pl[i], pl, i);
		}
		
		if (seesu.player.autostart){
			seesu.ui.views.save_view(pl);
			seesu.player.autostart = false;
		}
		make_tracklist_playable(pl);
		seesu.ui.render_playlist(pl, not_clear);
	}
	
}


var show_track = function(query, with_search_results){
	
	
	if (seesu.delayed_search.waiting_for_mp3provider){
		mp3_prov_quene = new funcs_quene();
		seesu.delayed_search.we_need_mp3provider(mp3_prov_quene);
	}
	seesu.ui.views.show_playlist_page(query, 'tracks', with_search_results);
	var used_successful = get_all_tracks(query, create_playlist);
	if (!used_successful && seesu.delayed_search.waiting_for_mp3provider){
		if (mp3_prov_quene) {
			mp3_prov_quene.add(function(){get_all_tracks(query, create_playlist, true);}, true);
		}
	}
	if (!used_successful){
		get_all_tracks(query, create_playlist, false, true);
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
	create_playlist(track_list_without_tracks);
};
var render_loved = function(user_name){
	lfm('user.getLovedTracks',{user: (user_name || lfm_auth.user_name), limit: 30},function(r){
		
		var tracks = r.lovedtracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
				track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
			}
			create_playlist(track_list);
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
			create_playlist(music_list);
		} else {
			create_playlist();
		}
	} else{
		create_playlist();
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




$(function(){
	if (seesu.env.cross_domain_allowed && lfm_auth.sk && !lfm_scrobble.s) {lfm_scrobble.handshake();}
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
