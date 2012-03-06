$.ajaxSetup({
  cache: true,
  global:false,
  timeout:40000,
  headers:{
	'X-Requested-With': 'XMLHttpRequest'
  }
});
$.support.cors = true;

window.lfm_image_artist = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_large.png';

var lfm = new lastfm_api(getPreloadedNK('lfm_key'), getPreloadedNK('lfm_secret'), function(key){
	return suStore(key)
}, function(key, value){
	return suStore(key, value, true);
}, cache_ajax, app_env.cross_domain_allowed, new funcsQueue(100));


var main_level = new mainLevel();

var seesuApp = function() {
	this.init();

	this._url = get_url_parameters(location.search);

	this.track_stat = (function(){
		window._gaq = [];
		_gaq.sV = $.debounce(function(v){
			suStore('ga_store', v, true);
		},130);
		_gaq.gV = function(){
			return suStore('ga_store');
		};
		/*
		_gaq.push(['myTracker._setAccount', 'UA-XXXXX-X']);

		_gaq.push(function() {
		  var pageTracker = _gat._getTrackerByName('myTracker');
		  var link = document.getElementById('my-link-id');
		  link.href = pageTracker._getLinkerUrl('http://example.com/');
		});
		http://code.google.com/apis/analytics/docs/tracking/asyncUsageGuide.html
		*/

		suReady(function(){
			yepnope( {
				load: 'http://seesu.me/st/ga.mod.min.js',
				complete: function(){
					_gaq.push(['_setAccount', 'UA-17915703-1']);
					_gaq.push(['_setCustomVar', 1, 'environmental', (!app_env.unknown_app ? app_env.app_type : 'unknown_app'), 1]);
					_gaq.push(['_setCustomVar', 2, 'version', seesu.version, 1]);
				}
			});
		});
		return function(data_array){
			_gaq.push(data_array);
		};
	})();

	  
	this.popular_artists = ["The Beatles", "Radiohead", "Muse", "Lady Gaga", "Eminem", "Coldplay", "Red Hot Chili Peppers", "Arcade Fire", "Metallica", "Katy Perry", "Linkin Park" ];
	this.vk = {};

	this.notf = new gMessagesStore(
	  	function(value) {
	  		return suStore('notification', value, true);
		}, 
		function() {
			return suStore('notification');
		}
	);
	this.main_level = main_level;
	this.map = (new browseMap(main_level)).makeMainLevel();
	this.ui = new seesu_ui(document);
	this.soundcloud_queue = new funcsQueue(1000, 5000 , 7),
	this.delayed_search = {
		vk_api:{
			queue:  new funcsQueue(1000, 8000 , 7)
		}
	};


	this.s  = new seesuServerAPI(suStore('dg_auth'));
	this.on('vk-api', function(vkapi, user_id) {
		var _this = this;
		vkapi.get('getProfiles', {
			uids: user_id,
			fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'
			
		},{nocache: true})
			.done(function(info) {
				info = info.response && info.response[0];
				if (info){
					_this.s.vk_id = user_id;

					var _d = cloneObj({data_source: 'vkontakte'}, info);

					_this.s.setInfo('vk', _d);

					if (!_this.s.loggedIn()){
						_this.s.getAuth(user_id);
					} else{
						_this.s.api('user.update', _d);
					}
				} else {
					
				}
			})
			.fail(function(r) {
				
			})
	});


	this.views = new views(this.map);


	this.onRegistration('dom', function(cb) {
		if (this.ui && this.ui.can_fire_on_domreg){
			cb();
		}	
	});

};
eemiter.extendTo(seesuApp, {
	removeDOM: function(d) {
		this.fire('dom-die', this.ui.d == d, d);
	},
	createUI: function(d, connect_dom){
	  	var _this = this;
	  	if (this.ui && this.ui.checkLiveState){
	  		this.ui.checkLiveState();
	  	}
		this.ui = new seesu_ui(d, connect_dom, function(opts){
			var cbs = _this.ui_creation_callbacks;
			if (cbs){
				for (var i = 0; i < cbs.length; i++) {
					cbs[i](opts);
				};
			}
			
		});
	},
	onUICreation: function(cb){
	  	var ar = (this.ui_creation_callbacks = this.ui_creation_callbacks || []);
	  		ar.push(cb);
	},
	fs: {},//fast search
	version: 2.8,
	env: app_env,
	track_event:function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackEvent');
		this.track_stat.call(this, args);
	},
	track_page:function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackPageview');
		this.track_stat.call(this, args);
	},
	track_var: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_setCustomVar');
		this.track_stat.call(this, args);
	},
	setVkApi: function(vkapi, user_id) {
		this.vk_api = vkapi;
		this.fire('vk-api', vkapi, user_id);
	}	  
});

window.seesu = window.su = new seesuApp(); 


/*
if (su._url.q){
	su.start_query = su._url.q;
}
*/
suReady(function() {
	lfm.try_to_login();
});

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

var random_track_plable = function(track_list){
	var random_track_num = Math.floor(Math.random()*track_list.length);
	return track_list[random_track_num];
	
};


su.mp3_search = (new mp3Search())
	.on('new-search', function(search, name){
		var player = su.p;
		if (player){
			if (player.c_song){
				if (player.c_song.sem){
					su.mp3_search.searchFor(player.c_song.sem.query);
				}
				
				if (player.c_song.next_preload_song && player.c_song.next_preload_song.sem){
					su.mp3_search.searchFor(player.c_song.next_preload_song.sem.query);
				}
			}
			//fixme
			if (player.v_song && player.v_song != player.c_song ){
				if (player.v_song.sem){
					su.mp3_search.searchFor(player.v_song.sem.query);
				}
				
			}
		}
	});



(function(){
	var sc_api = new scApi(getPreloadedNK('sc_key'), su.soundcloud_queue);

	var sc_search_source = {name: 'soundcloud', key: 0};
	su.mp3_search.add({
		getById: function() {
			return sc_api.getSongById.apply(sc_api, arguments);
		},
		search: function() {
			return sc_api.find.apply(sc_api, arguments);
		},
		name: sc_search_source.name,
		description:'soundcloud.com',
		slave: false,
		s: sc_search_source,
		preferred: null,
		q: su.soundcloud_queue
	})
	
	
})();



var prepare_playlist = function(playlist_title, playlist_type, info, first_song){
	var pl = new songsList(playlist_title, playlist_type, info, first_song, su.mp3_search, su.p);
	return pl;
};

var create_playlist =  function(pl, pl_r, not_clear){
	//fixme
	if (!pl){
		return pl_r.loadComplete(true);
	} else{
		
		for (var i=0, l = pl.length; i < l; i++) {
			pl_r.push(pl[i]);
		}
		return pl_r.loadComplete();
		
	}
	
};



var getTopTracks = function(artist,callback, error_c) {
	lfm.get('artist.getTopTracks',{'artist': artist, limit: 30 })
		.done(function(r){
			if (typeof r != 'object' || r.error) {
				if (error_c){
					error_c();
				}
				return;
				
			}
			var tracks = r.toptracks.track || false;
			if (tracks) {
				var track_list = [];
				tracks = toRealArray(tracks);
				
				for (var i=0, l = Math.min(tracks.length, 30); i < l; i++) {
					track_list.push({'artist' : artist ,'track': tracks[i].name, images: tracks[i].image});
				}
				
				if (callback) {callback(track_list);}
			}
		})
		.fail(error_c);
};

var proxy_render_artists_tracks = function(artist_list, pl_r){
	//fixme
	if (artist_list){
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
	var pl_r = prepare_playlist(localize('loved-tracks'), 'artists by loved').loading();
	lfm.get('user.getLovedTracks',{user: (user_name || lfm.user_name), limit: 30})
		.done(function(r){
			var tracks = r.lovedtracks.track || false;
			if (tracks) {
				var track_list = [];
				for (var i=0, l = Math.min(tracks.length, 30); i < l; i++) {
					track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
				}
				create_playlist(track_list,pl_r);
			}
		});
	su.views.show_playlist_page(pl_r);
};
var render_recommendations_by_username = function(username){
	var pl_r = prepare_playlist('Recommendations for ' +  username, 'artists by recommendations').loading()
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

	su.views.show_playlist_page(pl_r);
};
var render_recommendations = function(){
	var pl_r = prepare_playlist('Recommendations for you', 'artists by recommendations').loading();
	lfm.get('user.getRecommendedArtists', {sk: lfm.sk}, {nocache: true})
		.done(function(r){
			var artists = r.recommendations.artist;
			if (artists && artists.length) {
				var artist_list = [];
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					artist_list.push(artists[i].name);
				}
				proxy_render_artists_tracks(artist_list,pl_r);
			}
		})
		.fail(function(){
			proxy_render_artists_tracks(false, pl_r);
		});

	su.views.show_playlist_page(pl_r);

};


var get_artists_by_tag = function(tag,callback,error_c){

	//fixme
	lfm.get('tag.getTopArtists', {'tag':tag, limit: 30})
		.done(function(r){
			var artists = r.topartists.artist;
			if (artists && artists.length) {
				var artist_list = [];
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					artist_list.push(artists[i].name);
				}
				if (callback) {callback(artist_list);}
			}
		})
		.fail(error_c);
	return true;
};


var get_similar_artists = function(original_artist, callback,error_c){
	lfm.get('artist.getSimilar',{'artist': original_artist})
		.done(function(r){
			var artists = r.similarartists.artist;
			if (artists && artists.length) {
				var artist_list = [];
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					artist_list.push(artists[i].name);
				}
				if (callback) {callback(artist_list);}
			}
		})
		.fail(error_c);
	return true;
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
		lfm.get('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id})
			.done(function(pl_data){
				make_lastfm_playlist(pl_data, pl_r);
			});
	}
};

var get_artist_album_info = function(artist, album, callback){
	lfm.get('album.getInfo',{'artist': artist, album : album})
		.done(function(r){
			if (callback) {callback(r);}
		});
	
};


suReady(function(){
	check_seesu_updates();
	try_mp3_providers();
});

jsLoadComplete(function() {
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
			},10);
			
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

});
