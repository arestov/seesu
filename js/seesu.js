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
	this.settings = {};
	this.settings_timers = {};

	this.track_stat = (function(){
		window._gaq = window._gaq || [];
		_gaq.sV = debounce(function(v){
			suStore('ga_store', v, true);
		},130);
		_gaq.gV = function(){
			return suStore('ga_store');
		};
		suReady(function(){
			yepnope( {
				
				load: bpath + 'js/common-libs/ga.mod.min.js',
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
	this.map = (new browseMap(this.main_level));

	var ext_view;
	if (app_env.chrome_extension){
		ext_view = this.main_level.getFreeView(this, "chrome_ext");
	} else if (app_env.opera_extension && window.opera_extension_button){
		this.opera_ext_b = opera_extension_button;
		ext_view = this.main_level.getFreeView(this, "opera_ext");
	}
	if (ext_view){
		ext_view.requestAll();
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



	this.views = new views(this.map, this);
	this.map.makeMainLevel();

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

	var reportSearchEngs = debounce(function(string){
		_this.trackVar(4, 'search', string, 1);
	}, 300);

	this.mp3_search.on('list-changed', function(list){
		list = $filter(list, 'name').sort();
		for (var i = 0; i < list.length; i++) {
			list[i] = list[i].slice(0, 2)
		};
		reportSearchEngs(list.join(','));
	});

	this.lfm_auth.on('session.ga_tracking', function(){
		_this.trackEvent('Auth to lfm', 'end');
	});
	this.lfm_auth.on('want-open-url', function(wurl){
		if (app_env.showWebPage){
			app_env.openURL(wurl);
			/*
			var opend = app_env.showWebPage(wurl, function(url){
				var path = url.split('/')[3];
				if (!path || path == 'home'){
					app_env.clearWebPageCookies();
					return true
				} else{
					var sb = 'http://seesu.me/lastfm/callbacker.html';
					if (url.indexOf(sb) == 0){
						var params = get_url_parameters(url.replace(sb, ''));
						if (params.token){
							_this.lfm_auth.setToken(params.token);
							
						}
						app_env.clearWebPageCookies();
						return true;
					}
				}
				
			}, function(e){
				app_env.openURL(wurl);
				
			}, 960, 750);
			if (!opend){
				app_env.openURL(wurl);
			}
			*/
		} else{
			app_env.openURL(wurl);
		}
		_this.trackEvent('Auth to lfm', 'start');

	});

	this.lfm_imgq = new funcsQueue(700);
	setTimeout(function(){
		_this.checkStats();
	},100)

	suReady(function() {
		_this.lfm_auth.try_to_login();
		setTimeout(function(){
			while (big_timer.q.length){
				_this.trackTime.apply(_this, big_timer.q.shift());
				//console.log()
			}
		}, 300)
	});
	jsLoadComplete({
		test: function(){
			return window.su && window.su.gena && window.su.gena.playlists;
		}, 
		fn: function(){
			su.chechPlaylists();
		}
	});

	setTimeout(function() {
		for (var i = _this.supported_settings.length - 1; i >= 0; i--) {
			var cur = _this.supported_settings[i];
			var value = suStore('settings.' + cur);
			if (value){
				try {
					value = JSON.parse(value);
				} catch(e){}
			}
			_this.letAppKnowSetting(cur, value);
		};
		var last_ver = suStore('last-su-ver');
		_this.migrateStorage(last_ver);
		suStore('last-su-ver', version, true);
		
	}, 200)

};
provoda.Eventor.extendTo(seesuApp, {
	migrateStorage: function(ver){
		if (!ver){
			var lfm_scrobbling_enabled = suStore('lfm_scrobbling_enabled');
			if (lfm_scrobbling_enabled){

				suStore('lfm_scrobbling_enabled', '', true);
				this.setSetting('lfm-scrobbling', lfm_scrobbling_enabled);
			}
		}
		if (typeof this.settings['volume'] == 'number'){
			this.setSetting('volume', [this.settings['volume'], 100]);
		}
	},
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
	supported_settings: ['lfm-scrobbling', 'dont-rept-pl', 'rept-song', 'volume'],

	letAppKnowSetting: function(name, value){
		this.settings[name] = value;
		this.trigger('settings.' + name, value);
	},
	storeSetting: function(name, value){
		clearTimeout(this.settings_timers[name]);

		this.settings_timers[name] = setTimeout(function(){
			if (typeof value != 'number'){
				value = value || '';
			}
			suStore('settings.'+ name, value, true);
		}, 333);
		
	},
	setSetting: function(name, value){
		if (this.supported_settings.indexOf(name) != -1){
			this.letAppKnowSetting(name, value);
			this.storeSetting(name, value);
		} else{
			
		}
		

	},
	onUICreation: function(cb){
		var ar = (this.ui_creation_callbacks = this.ui_creation_callbacks || []);
			ar.push(cb);
	},
	chechPlaylists: function(){
		if (this.gena){
			this.main_level.updateState('have-playlists', !!this.gena.playlists.length);
		}
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
	
	trackEvent:function(){
		var current_page = this.current_page || '(nonono)';
	//	var args = Array.prototype.slice.call(arguments);
	//	args.unshift('_trackEvent');
		this.track_stat.call(this, function() {
			var pageTracker = _gat._getTrackerByName(current_page);
			pageTracker._trackEvent.apply(pageTracker, arguments);
		});
	},
	trackPage:function(page_name){
		this.current_page = page_name;
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackPageview');
		this.track_stat.call(this, args);
	},
	trackTime: function(){
		var args = arguments;
		var current_page = this.current_page || '(nonono)';
		this.track_stat.call(this, function() {
			var pageTracker = _gat._getTrackerByName(current_page);
			pageTracker._trackTiming.apply(pageTracker, args);
		});
	},
	trackVar: function(){
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

	},
	checkUpdates: function(){
		var _this = this;

		$.ajax({
			url: this.s.url + 'update',
			global: false,
			type: "POST",
			dataType: "json",
			data: {
				ver: this.version,
				app_type: app_env.app_type
			},
			error: function(){},
			success: function(r){
				if (!r){return;}

				
				var cver = r.latest_version.number;
				if (cver > _this.version) {
					var message = 
						'Suddenly, Seesu ' + cver + ' has come. ' + 
						'You have version ' + _this.version + '. ';
					var link = r.latest_version.link;
					if (link.indexOf('http') != -1) {
						$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"><img src="/i/update_star.png" alt="update start"/></a>');
					}
				}
				
				console.log('lv: ' +  cver + ' reg link: ' + (_this.vkReferer = r.vk_referer));

			}
		});
	}

});

window.seesu = window.su = new seesuApp(3.6); 



suReady(function() {
	var fp = bpath + 'btapp/btapp/';
	yepnope({
		load: [
			bpath + 'btapp/underscore-min.js',
			bpath + 'btapp/backbone-min.js',
			bpath + 'btapp/jstorage.js',
			fp + 'btapp.js',
			fp + 'client.btapp.js',
			fp + 'plugin.btapp.js',
			fp + 'pairing.btapp.js'

		],
		complete: function() {
			window.bap = new Btapp();
			bap.connect();

			var btapp = bap;

			var test_link = 'http://isohunt.com/download/402892101';

			btapp.on('add:add', function(add){
				setTimeout(function(){
					add.torrent({
						url: test_link,
						callback: function(trt){
							var colln = btapp.get('torrent');
							var array = colln.models;
						//	array.length
						//	.models[]
							var torrent = array[array.length - 1];//.models
							setTimeout(function(){
								btapp.get('torrent').each(function(t){
									t.get('file').each(function(file){
										console.log(file.get('properties').get('name'));
									})
								})
							})

							return
							trt.get('file').each(function(file) {
								var name = file.get('properties').get('name');

								console.log(name);

								/*
								var ext = name.substr(name.lastIndexOf('.') + 1);
								
								if(ext !== 'mp3') {
								  file.get('properties').save({
									priority: 0 // Will be adding file priority constants shortly
								  });
								}*/
							});
						},
						priority: Btapp.TORRENT.PRIORITY.METADATA_ONLY
					});
				},0)
				
			});




			
		}
	})
	
});

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
	var sc_api = new scApi(getPreloadedNK('sc_key'), new funcsQueue(1500, 5000 , 4), app_env.cross_domain_allowed, cache_ajax);
	su.mp3_search.add(new scMusicSearch(sc_api));
	su.mp3_search.add(new ExfmMusicSearch(new ExfmApi(new funcsQueue(1500, 5000, 4), app_env.cross_domain_allowed, cache_ajax)));

	
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
	seesu.checkUpdates();
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

				seesu.trackEvent('song actions', 'add to playlist');
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
			su.chechPlaylists();
			
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
