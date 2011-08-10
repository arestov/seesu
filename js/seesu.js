$.ajaxSetup({
  cache: true,
  global:false,
  timeout:40000,
  headers:{
	'x-requested-with': 'XMLHttpRequest'
  }
});
$.support.cors = true;


window.lfm_image_artist = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_large.png';
window.lfm = function(){
	var _this = this;
	var ag = arguments;
	var q_el = seesu.lfm_api.use.apply(seesu.lfm_api, ag);
	if (q_el.q && q_el.q.init){
		q_el.q.init();
	}
};





  
window.seesu = window.su =  {
	  _url: get_url_parameters(location.search),
	  s: new seesuServerAPI(JSON.parse(w_storage('dg_auth'))),
	  fs: {},//fast search
	  lfm_api: new lastfm_api('2803b2bcbc53f132b4d4117ec1509d65', '77fd498ed8592022e61863244b53077d', true, app_env.cross_domain_allowed),
	  version: 2.0,
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
		}
	  },
	  ui: new seesu_ui(document),
	  xhrs: {},
	  soundcloud_queue: new funcs_queue(1000, 5000 , 7),
	  delayed_search: {
		tracks_waiting_for_search:0,
		use:{
			queue:  new funcs_queue(1000, 8000 , 7)
		},
		vk:{
			queue:  new funcs_queue(1000, 8000 , 7)
		},
		vk_api:{
			queue:  new funcs_queue(1000, 8000 , 7)
		}

		
	  }
	};






function stringifyParams(params, ignore_params, splitter){
	var paramsstr = '',
		pv_signature_list = [];
	
	
	for (var p in params) {
		if (!ignore_params || !bN(ignore_params.indexOf(p))){
			pv_signature_list.push(p + (splitter || '') + params[p]);
		}
	}
		
	pv_signature_list.sort();
		
	for (var i=0, l = pv_signature_list.length; i < l; i++) {
		paramsstr += pv_signature_list[i];
	};
		
	return paramsstr;
	
};
if (su._url.q){
	su.start_query = su._url.q;
}



var vkReferer = '';

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
				open_url(link);
			});
			$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"><img src="/i/update_star.png" alt="update start"/></a>');
		}
	}
	
	console.log('lv: ' +  cver + ' reg link: ' + (vkReferer = r.vk_referer));

};
var check_seesu_updates = function(){
	
		$.ajax({
		  url: su.s.url + 'update',
		  global: false,
		  type: "POST",
		  dataType: "json",
		  data: {},
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
	var simple_playlist = [];
	for (var i=0; i < seesu.player.c_song.plst_titl.length; i++) {
		var song = seesu.player.c_song.plst_titl[i].song();
		if (song){
			simple_playlist.push({
				track_title: song.track,
				artist_name: song.artist,
				duration: song.duration,
				mp3link: song.link
			});
		}
			
		
	};
	
	if (simple_playlist.length){
		seesu.player.current_external_playlist = new external_playlist(simple_playlist);
		seesu.ui.els.export_playlist.attr('href', seesu.player.current_external_playlist.data_uri);
		
	}
};



var get_next_track_with_priority = function(mo){
	var _din = mo.delayed_in;
	for (var i=0; i < _din.length; i++) {
		_din[i].pr = seesu.player.want_to_play || 1;
	}
	su.mp3_search.find_mp3(mo, {
		get_next: true
	});
}



var random_track_plable = function(track_list){
	var random_track_num = Math.floor(Math.random()*track_list.length);
	return track_list[random_track_num];
	
};
var start_random_nice_track_search = function(mo, not_search_mp3, from_collection, last_in_collection){
	mo.ui.node.addClass('loading');
	getTopTracks(mo.artist, function(track_list){
		var some_track = random_track_plable(track_list);
		mo.ui.node.removeClass('loading');
		mo.ui.titlec.text(some_track.artist + ' - ' + (mo.track = some_track.track));
		su.mp3_search.find_mp3(mo, {
			only_cache: not_search_mp3 && !mo.want_to_play && (!su.player.c_song || su.player.c_song.next_preload_song != mo),
			collect_for: from_collection,
			last_in_collection: last_in_collection
		});
	}, function(){
		mo.ui.node.removeClass('loading');
	});
};
var makeSongPlayalbe= function(mo, full_allowing,  from_collection, last_in_collection){
	if (mo.raw){
		mo.ui.update();
	} else if (!mo.track){
		start_random_nice_track_search(mo, !full_allowing, from_collection, last_in_collection);
	} else{
		if (mo.isSearchCompleted()){
			handle_song(mo, true)
		}
		su.mp3_search.find_mp3(mo, {
			only_cache: !full_allowing && !mo.want_to_play,
			collect_for: from_collection,
			last_in_collection: last_in_collection
		});
	}
};
var make_tracklist_playable = function(pl, full_allowing){
	if (full_allowing){
		su.mp3_search.abortAllSearches();
		//mp3_prov_queue = reset_q();
	}
	for (var i=0, l =  pl.length; i < l; i++) {
		makeSongPlayalbe(pl[i], full_allowing);
	}
};



function viewSong(mo, no_navi){
	su.player.view_song(mo, true, false, no_navi);
}


var wantSong = function(mo){
	if (mo.want_to_play == seesu.player.want_to_play && su.player.wainter_for_play == mo) {
		su.player.play_song(mo, true);
	} 
};

var empty_song_click = function(){
	var clicked_node = $(this);
	
	if (seesu.player.wainter_for_play && seesu.player.wainter_for_play.node) {
		seesu.player.wainter_for_play.node.removeClass('marked-for-play');
	}
	var new_pr = ++seesu.player.want_to_play;
	
	var mo = clicked_node.addClass('marked-for-play').data('mo');
	
	mo.want_to_play = new_pr;
	var delayed_in = mo.delayed_in;
	for (var i=0; i < delayed_in.length; i++) {
		delayed_in[i].pr = new_pr;
	}
	
	seesu.player.wainter_for_play = mo;
	seesu.ui.views.freeze(mo.plst_titl);
	
	su.mp3_search.find_mp3(mo);
	su.ui.updateSongContext(mo, true);
	viewSong(mo);
	seesu.track_event('Song click', 'empty song');
	return false;	
};

var prepare_playlist = function(playlist_title, playlist_type, key, with_search_results_link, first_song){
	var pl = [];
	pl.key = key;
	pl.loading = true;
	if (playlist_title){
		pl.playlist_title = playlist_title;
	}
	if (playlist_type){
		pl.playlist_type = playlist_type;
	}
	if (with_search_results_link){
		pl.with_search_results_link = with_search_results_link;
	}
	
	
	var f;
	if (bN(['artist', 'album', 'cplaylist'].indexOf(playlist_type ))){
		var can_find_context = true;
	}
	var fdone = !can_find_context;
	if (first_song && first_song.track && (first_song.artist || (playlist_type == 'artist' && key))){
		if (!first_song.artist){
			first_song.artist = key;
		}
		f = first_song;
	}
	var oldpush = pl.push;
	pl.push = function(mo){
		extendSong(mo)
		su.gena.connect(mo,pl);
		if (f){
			if (f==mo){
				return oldpush.call(this, f);
			} else if (!fdone){
				if (mo.artist != f.artist || mo.track != f.track){
					pl.pop();
					oldpush.call(this, mo);
					return oldpush.call(this, f);
					
				} else {
					fdone = true;
				}
				
			} else{
				return oldpush.call(this, mo);
			}
		} else {
			return oldpush.call(this, mo);
		}
		
		
	}
	if (f){
		pl.push(f)
	}
	
	
	
	pl.compare = function(puppet){
		return this.playlist_type == puppet.playlist_type && (!this.key && !this.key || this.key == puppet.key);
	};
	pl.kill = function(){
		if (this.ui){
			this.ui.remove();
			delete this.ui;
		}
		
		
		for (var i = this.length - 1; i >= 0; i--){
			this[i].kill();
		};
		
	};
	pl.showExactlyTrack= function(mo, no_navi){
		if (bN(pl.indexOf(mo))){
			mo.view(no_navi);
			return true;
		}	
	};
	pl.renderSong = function(mo, from_collection, last_in_collection){
		if (pl.ui && pl.ui.tracks_container){
			
			if (!mo.ui || !mo.ui.mainc || mo.ui.mainc[0].ownerDocument != su.ui.d){				
				var pl_ui_element = su.ui.create_playlist_element(mo);
				if (f){
					if (!fdone){
						if (mo == f){
							pl.ui.tracks_container.append(pl_ui_element);
						} else{
							f.ui.mainc.before(pl_ui_element);
						}
					} else if (f!=mo){
						var f_position = pl.indexOf(f);
						var t_position = pl.indexOf(mo);
						if (t_position < f_position){
							f.ui.mainc.before(pl_ui_element);
							
						} else{
							pl.ui.tracks_container.append(pl_ui_element);
						}
					} else{
						pl.ui.tracks_container.append(pl_ui_element);
					}
					
					
				} else{
					pl.ui.tracks_container.append(pl_ui_element);
				}
				
				makeSongPlayalbe(mo, false, from_collection, last_in_collection);
			}
			
		}
	};
	
	pl.showTrack = function(artist_track, no_navi){
		var will_ignore_artist;
		var artist_match_playlist = pl.playlist_type == 'artist' && pl.key == artist_track.artist;
		if (!artist_track.artist || artist_match_playlist){
			will_ignore_artist = true;
		}
		
		
		console.log('want to find and show');
		
		for (var i=0; i < pl.length; i++) {
			if (artist_track.track == pl[i].track && (will_ignore_artist || artist_track.artist == pl[i].artist)){
				su.mp3_search.find_mp3(pl[i]);
				su.ui.updateSongContext(pl[i]);
				viewSong(pl[i], no_navi);
				
				return true;
			}
			
		};
		if (artist_track.artist && artist_track.track){
			su.gena.add(artist_track, this);
			
		}
		
		return false;
		
	};
	
	
	
	return pl;
};
var create_playlist =  function(pl, pl_r, not_clear){
	if (!pl){
		return seesu.ui.render_playlist(pl_r, true);
	} else{
		
		for (var i=0, l = pl.length; i < l; i++) {
			pl_r.push(pl[i]);
		}
		return seesu.ui.render_playlist(pl_r, true);
		
	}
	
};



var getTopTracks = function(artist,callback, error_c) {
	lfm('artist.getTopTracks',{'artist': artist },function(r){
		if (typeof r != 'object' || r.error) {
			if (error_c){
				error_c();
			}
			return;
			
		}
		var tracks = r.toptracks.track || false;
		if (tracks) {
			var track_list = [];
			if (tracks.length){
				for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
					track_list.push({'artist' : artist ,'track': tracks[i].name, images: tracks[i].image});
				}
			} else{
				track_list.push({'artist' : artist ,'track': tracks.name, images: tracks.image});
			}
			
			if (callback) {callback(track_list);}
		}
	}, error_c);
};

var proxy_render_artists_tracks = function(artist_list, pl_r){
	if (artist_list || pl_r){
		var track_list_without_tracks = [];
		for (var i=0; i < artist_list.length; i++) {
			track_list_without_tracks.push({"artist" :artist_list[i]});
		}
		create_playlist(track_list_without_tracks, pl_r || []);
	} else{
		create_playlist(false, pl_r);
	}
	
};
var render_loved = function(user_name){
	var pl_r = prepare_playlist(localize('loved-tracks'), 'artists by loved');
	lfm('user.getLovedTracks',{user: (user_name || su.lfm_api.user_name), limit: 30},function(r){
		
		var tracks = r.lovedtracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
				track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
			}
			create_playlist(track_list,pl_r);
		}
	});
	seesu.ui.views.show_playlist_page(pl_r);
};
var render_recommendations_by_username = function(username){
	var pl_r = prepare_playlist('Recommendations for ' +  username, 'artists by recommendations')
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
				proxy_render_artists_tracks(artist_list, pl_r);
			}
		  }
	});

	seesu.ui.views.show_playlist_page(pl_r);
};
var render_recommendations = function(){
	var pl_r = prepare_playlist('Recommendations for you', 'artists by recommendations');
	lfm('user.getRecommendedArtists',{sk: su.lfm_api.sk},function(r){
		var artists = r.recommendations.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			proxy_render_artists_tracks(artist_list,pl_r);
		}
	}, function(){
		proxy_render_artists_tracks(false, pl_r);
	},false, true);

	seesu.ui.views.show_playlist_page(pl_r);

};


var get_artists_by_tag = function(tag,callback,error_c){
	lfm('tag.getTopArtists',{'tag':tag},function(r){
		var artists = r.topartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	}, error_c, false, true);
	return true;
};
function findAlbum(album_name, artist_name, no_navi, start_song){
	var pl_r = prepare_playlist((artist_name ? '(' + artist_name + ') ' : '') + album_name ,'album', {original_artist: artist_name, album: album_name}, false, start_song);
	seesu.ui.views.show_playlist_page(pl_r ,false, no_navi || !!start_song );
	lfm('Album.search', {album: album_name}, function(r) {
		if (!r || r.error){
			create_playlist(false, pl_r);
			return
		}
		var res_matches = [];
		var ralbums = [];
		if (r.results.albummatches.album && r.results.albummatches.album.length){
			for (var i=0; i < r.results.albummatches.album.length; i++) {
				ralbums.push(r.results.albummatches.album[i])
			};
		} else if (r.results.albummatches.album){
			ralbums.push(r.results.albummatches.album)
		}
		for (var i=0; i < ralbums.length; i++) {
			var ral = ralbums[i];
			if (album_name.toLowerCase() == ral.name.toLowerCase()  && (!artist_name || ral.artist == artist_name)){
				res_matches.push(ral)
			}
			
		};
		if (res_matches.length){
			get_artist_album_playlist(res_matches[0].id, pl_r)
		} else{
			create_playlist(false, pl_r);
		}
		
		
	});
};

var get_similar_artists = function(original_artist, callback,error_c){
	lfm('artist.getSimilar',{'artist': original_artist},function(r){
		var artists = r.similarartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	}, error_c);
	return true;
};

var render_tracks_by_similar_artists = function(original_artist, no_navi, start_song){
	var pl_r = prepare_playlist('Similar to «' + original_artist + '» artists', 'similar artists', original_artist, false, start_song);
	seesu.ui.views.show_playlist_page(pl_r, false, no_navi || !!start_song);
	if (start_song){
		start_song.view(no_navi);
	}
	get_similar_artists(original_artist, function(pl){
		proxy_render_artists_tracks(pl, pl_r)
	}, function(){
		proxy_render_artists_tracks();
	});
	
};






var make_lastfm_playlist = function(r, pl_r){
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
			create_playlist(music_list, pl_r);
		} else {
			create_playlist(false, pl_r);
		}
	} else{
		create_playlist(false, pl_r);
	}
};
var get_artist_album_playlist = function(album_id, pl_r){
	if (album_id) {
		lfm('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id}, function(pl_data){
			make_lastfm_playlist(pl_data, pl_r);
		});
	}
};

var get_artist_album_info = function(artist, album, callback){
	
	lfm('album.getInfo',{'artist': artist, album : album},function(r){
		if (callback) {callback(r);}
	});
	
};


$(function(){
	check_seesu_updates();
	try_mp3_providers();
})
