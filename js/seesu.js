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
	return suStore(key);
}, function(key, value){
	return suStore(key, value, true);
}, cache_ajax, app_env.cross_domain_allowed, new funcsQueue(700));




var seesuApp = function(version) {
	this.init();
	this.version = version;

	this._url = get_url_parameters(location.search);

	this.track_stat = (function(){
		window._gaq = [];
		_gaq.sV = debounce(function(v){
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
					_gaq.push(['_setCustomVar', 2, 'version', version, 1]);
				}
			});
		});
		return function(data_array){
			_gaq.push(data_array);
		};
	})();

	var lu = suStore('su-usage-last');

	this.last_usage = (lu && new Date(lu)) || 0;
	this.usage_counter = parseFloat(suStore('su-usage-counter')) || 0;
	
	var _this = this;
	setInterval(function(){

		var now = new Date();

		if (_this.ui){
			if (_this.ui.isAlive() || (now - _this.ui.created_at)/(1000*60) > 40){
				if ((now - _this.last_usage)/ (1000 * 60 * 60) > 4){
					_this.checkStats();
					suStore('su-usage-last', (_this.last_usage = new Date()).toUTCString(), true);
					suStore('su-usage-counter', ++_this.usage_counter, true);
				}
			}
		}

		
	}, 1000 * 60 * 20);


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
	this.lfm_auth = new LfmAuth(lfm, {
		deep_sanbdox: app_env.deep_sanbdox, 
		callback_url: 'http://seesu.me/lastfm/callbacker.html',
		bridge_url: 'http://seesu.me/lastfm/bridge.html',
	});
	this.main_level = new mainLevel(this);
	this.map = (new browseMap(this.main_level)).makeMainLevel();

	if (app_env.chrome_extension){
		this.main_level.getFreeView("chrome_ext");
	} else if (app_env.opera_extension && window.opera_extension_button){
		this.opera_ext_b = opera_extension_button;
		this.main_level.getFreeView("opera_ext");
	}
	

	this.map.on('map-tree-change', function(nav_tree) {
		_this.main_level.changeNavTree(nav_tree);
	});

//	this.ui = new seesu_ui(document);

	this.delayed_search = {
		vk_api:{
			queue:  new funcsQueue(1000, 8000 , 7)
		}
	};



	this.s  = new seesuServerAPI(suStore('dg_auth'), this.server_url);
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
				
			});
	});



	this.views = new views(this.map);


	this.onRegistration('dom', function(cb) {
		if (this.ui && this.ui.can_fire_on_domreg){
			cb();
		}	
	});
	this.mp3_search = (new mp3Search({
		vk: 5,
		nigma: 1,
		exfm: 0,
		soundcloud: -5,
		lastfm:-10,
		torrents: -15
	}));
	/*
		.on('new-search', function(search, name){
			var player = _this.p;
			if (player){
				if (player.c_song){
					if (player.c_song.sem){
						_this.mp3_search.searchFor(player.c_song.sem.query);
					}
					
					if (player.c_song.next_preload_song && player.c_song.next_preload_song.sem){
						_this.mp3_search.searchFor(player.c_song.next_preload_song.sem.query);
					}
				}
				//fixme
				if (player.v_song && player.v_song != player.c_song ){
					if (player.v_song.sem){
						_this.mp3_search.searchFor(player.v_song.sem.query);
					}
					
				}
			}
		});*/

	
	this.lfm_auth.on('want-open-url', function(wurl){
		if (app_env.showWebPage){
			
			app_env.showWebPage(wurl, function(url){
				var path = url.split('/')[3];
				if (!path || path == 'home'){
					app_env.hideWebPages();
					app_env.clearWebPageCookies();
					return true
				} else{
					var sb = 'http://seesu.me/lastfm/callbacker.html';
					if (url.indexOf(sb) == 0){
						var params = get_url_parameters(url.replace(sb, ''));
						if (params.token){
							_this.lfm_auth.setToken(params.token);
							
						}

						app_env.hideWebPages();
						app_env.clearWebPageCookies();
						return true;
					}
				}
				
			}, function(e){
				app_env.openURL(wurl);
				
			}, 960, 750);
		} else{
			app_env.openURL(wurl);
		}
	});

	this.lfm_imgq = new funcsQueue(700);
	setTimeout(function(){
		_this.checkStats();
	},100)

	suReady(function() {
		_this.lfm_auth.try_to_login();
	});


};
provoda.Eventor.extendTo(seesuApp, {
	removeDOM: function(d, ui) {
		this.trigger('dom-die', d, this.ui == ui, this.ui);
	},
	checkStats: function() {
		if (this.usage_counter > 2){
			this.main_level.showMessage('rating-help');
		}
		return this;
	},
	setUI: function(ui){
		var _this = this;
		if (this.ui){
			this.ui.die();
		}
		this.ui = ui.onReady(function(opts){
			var cbs = _this.ui_creation_callbacks;
			if (cbs){
				for (var i = 0; i < cbs.length; i++) {
					cbs[i](opts);
				}
			}
		});
	},
	onUICreation: function(cb){
		var ar = (this.ui_creation_callbacks = this.ui_creation_callbacks || []);
			ar.push(cb);
	},
	fs: {},//fast search
	env: app_env,
	server_url: 'http://seesu.me/',
	encodeURLPart: function(part){
		var spaced = part.split(" ");
		$.each(spaced, function(i, el){
			spaced[i] = encodeURIComponent(el);
		});
		return spaced.join("+");
	},
	app_pages: {
		chrome_extension: "https://chrome.google.com/webstore/detail/nhonlochieibnkmfpombklkgjpkeckhi",
		chrome_app: "https://chrome.google.com/webstore/detail/fagoonkbbneajjbhdlklhdammdfkjfko",
		opera_widget: "http://widgets.opera.com/widget/15872/",
		opera_extension: "https://addons.opera.com/addons/extensions/details/seesu-music",
		pokki_app: "https://www.pokki.com/app/Seesu"
	},
	
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
		this.trigger('vk-api', vkapi, user_id);
	},
	preparePlaylist: function(params, first_song){
		var pl = new songsList(params, first_song, this.mp3_search, this.p);
		return pl;
	},
	getPlaylists: function(query) {
		var r = [];
		if (this.gena){
			for (i=0; i < this.gena.playlists.length; i++) {
				var cur = this.gena.playlists[i];
				if (query){
					if (cur.playlist_title == query){
						r.unshift(cur);
					} else if (cur.playlist_title.match(new  RegExp('\\b' + query))){
						r.push(cur);
					}
				} else {
					r.push(cur);
				}
				
			}
		}
		return r;
	},
	vkappid: 2271620,
	getVKFriends: function(){
		var _this = this;
		if (!this.vk_fr_req){
			this.vk_fr_req = this.vk_api.get("friends.get", {fields: "uid, photo"}, {cache_timeout: 1000*60*5})
				.done(function(){
					delete _this.vk_fr_req;
				});
		}
		this.vk_fr_req
			.done(function(r){
				_this.trigger("vk-friends", r && r.response);
			})
			.fail(function(){

			});

	}

});

window.seesu = window.su = new seesuApp(3.2); 

var vkReferer = '';

var updating_notify = function(r){
	if (!r){return;}

	
	var cver = r.latest_version.number;
	if (cver > su.version) {
		var message = 
			'Suddenly, Seesu ' + cver + ' has come. ' + 
			'You have version ' + su.version + '. ';
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
			error: function(){},
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




(function(){
	var sc_api = new scApi(getPreloadedNK('sc_key'), new funcsQueue(1000, 5000 , 7), app_env.cross_domain_allowed, cache_ajax);
	su.mp3_search.add(new scMusicSearch(sc_api));
	su.mp3_search.add(new ExfmMusicSearch(new ExfmApi(new funcsQueue(1200), app_env.cross_domain_allowed, cache_ajax)));

	
	if (app_env.cross_domain_allowed){
		su.mp3_search.add(new isohuntTorrentSearch());

		yepnope({
			load:  [bpath + 'js/libs/nigma.search.js'],
			complete: function(){
				window.nms = new NigmaMusicSearch(new NigmaAPI(new funcsQueue(2500, 5000, 4)))
				su.mp3_search.add(window.nms);
				
				//$(document.body).append(_this.c);
			}
		});
	} else {
		su.mp3_search.add(new googleTorrentSearch(app_env.cross_domain_allowed));
	}

	
	
})();




var proxy_render_artists_tracks = function(artist_list, pl_r){
	//fixme
	var track_list_without_tracks = [];
	if (artist_list){
		
		for (var i=0; i < artist_list.length; i++) {
			track_list_without_tracks.push({"artist" :artist_list[i]});
		}
		
		
	}
	pl_r.injectExpectedSongs(track_list_without_tracks);
};
var render_loved = function(user_name){
	var pl_r = su.preparePlaylist({
		title: localize('loved-tracks'),
		type: 'artists by loved'
	})

	

	pl_r.setLoader(function(paging_opts) {

		var request_info = {};

		

		lfm.get('user.getLovedTracks', {user: (user_name || lfm.user_name), limit: paging_opts.page_limit, page: paging_opts.next_page}, {nocache: true})
			.done(function(r){
				var tracks = r.lovedtracks.track || false;
				var track_list = [];
				if (tracks) {
					
					for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
					}

				}

				if (track_list.length < paging_opts.page_limit){
					pl_r.setLoaderFinish();
				}

				pl_r.injectExpectedSongs(track_list);

			})
			.fail(function() {
				pl_r.loadComplete(true);
			})
			.always(function() {
				request_info.done = true;
			});

		return request_info;
	}, true);
	
	su.views.show_playlist_page(pl_r);
};
var render_recommendations_by_username = function(username){
	var pl_r = su.preparePlaylist({
		title: 'Recommendations for ' +  username,
		type: 'artists by recommendations'
	}).loading();
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
	var pl_r = su.preparePlaylist({
		title: 'Recommendations for you', 
		type: 'artists by recommendations'
	});

	pl_r.setLoader(function(paging_opts) {
		
		var request_info = {};

		lfm.get('user.getRecommendedArtists', {sk: lfm.sk, limit: paging_opts.page_limit, page: paging_opts.next_page}, {nocache: true})
			.done(function(r){
				var artists = r.recommendations.artist;
				var track_list = [];
				if (artists && artists.length) {
					
					for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							artist: artists[i].name
						});
					}
					//proxy_render_artists_tracks(artist_list,pl_r);
				}
				pl_r.injectExpectedSongs(track_list);

				if (track_list.length < paging_opts.page_limit){
					pl_r.setLoaderFinish();
				}
			})
			.fail(function(){
				pl_r.loadComplete(true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}, true);
	

	su.views.show_playlist_page(pl_r);

};








var make_lastfm_playlist = function(r, pl_r){
	var playlist = r.playlist.trackList.track;
	var music_list = [];
	if  (playlist){
		
		if (playlist.length){
			
			for (var i=0; i < playlist.length; i++) {
				music_list.push({track: playlist[i].title, artist: playlist[i].creator });
			}
		} else if (playlist.title){
			music_list.push({track: playlist.title, artist: playlist.creator });
		}

	} 
	pl_r.injectExpectedSongs(music_list);
};




suReady(function(){
	try_mp3_providers();
	check_seesu_updates();
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
					plsts.push(playlists[i].simplify());
				}
				suStore('user_playlists', plsts, true);
			},10);
			
		},
		create_userplaylist: function(title,p, manual_inject){
			var _this = this;
			var pl_r = p || su.preparePlaylist({
				title: title,
				type: "cplaylist",
				data: {name: title} 
			});
			if (!manual_inject){
				this.playlists.push(pl_r);
			}
			
			var oldpush = pl_r.push;
			pl_r.push = function(){
				oldpush.apply(this, arguments);
				_this.save_playlists();
			};
			return pl_r;
		}
		
	};

	var rebuildPlaylist = function(saved_pl){
		var p = su.preparePlaylist({
			title: saved_pl.playlist_title, 
			type: saved_pl.playlist_type,
			data: {name: saved_pl.playlist_title}
		});
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
			}
		} 
		
		
		pls.push = function(){
			Array.prototype.push.apply(this, arguments);
			su.ui.create_playlists_link();
		};
		pls.find = function(puppet){
			for (var i=0; i < pls.length; i++) {
				if (pls[i].compare(puppet)){
					return pls[i];
				}
				
			}
		};
		return pls;
	})();
	jsLoadComplete.change();
});
