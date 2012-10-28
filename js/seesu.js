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
lfm.checkMethodResponse = function(method, data, r) {
	su.art_images.checkLfmData(method, r);
};



var ChromeExtensionButtonView = function() {};
provoda.View.extendTo(ChromeExtensionButtonView, {
	state_change: {
		"playing": function(state) {
			if (state){
				chrome.browserAction.setIcon({path:"/icons/icon19p.png"});
			} else {
				chrome.browserAction.setIcon({path:"/icons/icon19.png"});
			}
		},
		'now-playing': function(text) {
			chrome.browserAction.setTitle({title: localize('now-playing','Now Playing') + ': ' + text});
		}
	}
});
var OperaExtensionButtonView = function() {};
provoda.View.extendTo(OperaExtensionButtonView, {
	state_change: {
		"playing": function(state) {
			if (state){
				this.opts.opera_ext_b.icon = "/icons/icon18p.png";
			} else {
				this.opts.opera_ext_b.icon = "/icons/icon18.png";
			}
		},
		'now-playing': function(text) {
			this.opts.opera_ext_b.title = localize('now-playing','Now Playing') + ': ' + text;
		}
	}
});


var seesuApp = function(version) {};
appModel.extendTo(seesuApp, {
	init: function(version){
		this._super();
		this.version = version;

		this._url = get_url_parameters(location.search);
		this.settings = {};
		this.settings_timers = {};

		this.trackStat = (function(){
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

		this.app_md = this;
		this.art_images = new LastFMArtistImagesSelector();
		this.art_images.init();

		if (app_env.check_resize){
			this.updateState('slice-for-height', true);
		}
		if (app_env.deep_sanbdox){
			this.updateState('deep-sandbox', true);
		}
		var _this = this;


		
		this.start_page = (new StartPage()).init(this);
		this.setChild('navigation', [this.start_page]);
		this.setChild('start_page', this.start_page);



		this.map
			.init(this.start_page)
			.on('map-tree-change', function(nav_tree) {
				_this.changeNavTree(nav_tree);
			})
			.on('title-change', function(title) {
				_this.setDocTitle(title);

			})
			.on('url-change', function(nu, ou, data, replace) {
				jsLoadComplete(function(){
					if (replace){
						navi.replace(ou, nu, data);
					} else {
						navi.set(nu, data);
					}
				});
				//console.log(arguments);
			})
			.on('every-url-change', function(nv, ov, replace) {
				if (replace){
					//su.trackPage(nv.map_level.resident.page_name);
				}
				
			})
			.on('nav-change', function(nv, ov, history_restoring, title_changed){
				_this.trackPage(nv.map_level.resident.page_name);
			})
			.on('changes', function(changes) {
				console.log(changes);
				_this.animateMapChanges(changes);
			})
			.makeMainLevel();

		//(new appModel()).init(this);



		var addBrowserView = function(Constr, name, opts) {
			var view = new Constr();

			md.addView(view, view.view_id  + '_' + name);

			view.init({
				md: md
			}, opts);
			view.requestAll();

		};

		var ext_view;
		if (app_env.chrome_extension){
			addBrowserView(ChromeExtensionButtonView, 'chrome_ext')
			//ext_view = this.getFreeView(this, "chrome_ext");
		} else if (app_env.opera_extension && window.opera_extension_button){
			this.opera_ext_b = opera_extension_button;
			//ext_view = this.getFreeView(this, "opera_ext");
			addBrowserView(OperaExtensionButtonView, 'opera_ext', {opera_ext_b: opera_extension_button})
		}
				


		this.delayed_search = {
			vk_api:{
				queue:  new funcsQueue(700, 8000 , 7)
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
	},
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
			this.start_page.showMessage('rating-help');
		}
		return this;
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
	checkPlaylists: function(){
		if (this.gena){
			this.start_page.updateState('have-playlists', !!this.gena.playlists.length);
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
		var args = Array.prototype.slice.call(arguments);
	//	args.unshift('_trackEvent');

		this.trackStat.call(this, function() {
			var pageTracker = _gat._getTrackerByName(current_page);
			pageTracker._trackEvent.apply(pageTracker, args);
		});
	},
	trackPage:function(page_name){
		this.current_page = page_name;
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackPageview');
		this.trackStat.call(this, args);
	},
	trackTime: function(){
		var args = Array.prototype.slice.call(arguments);
		var current_page = this.current_page || '(nonono)';
		this.trackStat.call(this, function() {
			var pageTracker = _gat._getTrackerByName(current_page);
			pageTracker._trackTiming.apply(pageTracker, args);
		});
	},
	trackVar: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_setCustomVar');
		this.trackStat.call(this, args);
	},
	setVkApi: function(vkapi, user_id) {
		this.vk_api = vkapi;
		this.trigger('vk-api', vkapi, user_id);
	},
	createSearchPage: function() {
		var sp = new SearchPage();
		sp.init();
		return sp;

		return sp;
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

window.seesu = window.su = new seesuApp(); 
su.init(3.6);







(function(){
	var sc_api = new scApi(getPreloadedNK('sc_key'), new funcsQueue(3500, 5000 , 4), app_env.cross_domain_allowed, cache_ajax);
	su.mp3_search.add(new scMusicSearch(sc_api));
	su.mp3_search.add(new ExfmMusicSearch(new ExfmApi(new funcsQueue(3500, 5000, 4), app_env.cross_domain_allowed, cache_ajax)));

	
	if (app_env.cross_domain_allowed){
		su.mp3_search.add(new isohuntTorrentSearch());

		yepnope({
			load:  [bpath + 'js/libs/nigma.search.js'],
			complete: function(){
				window.nms = new NigmaMusicSearch(new NigmaAPI(new funcsQueue(3500, 5000, 4)))
				su.mp3_search.add(window.nms);
				
				//$(document.body).append(_this.c);
			}
		});
	} else {
		su.mp3_search.add(new googleTorrentSearch(app_env.cross_domain_allowed));
	}

	
	
})();





var render_loved = function(user_name){
	var pl_r = su.preparePlaylist({
		title: localize('loved-tracks'),
		type: 'artists by loved'
	});

	pl_r.setLoader(function(paging_opts) {
		var request_info = {};
		lfm.get('user.getLovedTracks', {user: (user_name || lfm.user_name), limit: paging_opts.page_limit, page: paging_opts.next_page}, {nocache: true})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'lovedtracks.track'));
				var track_list = [];
				if (tracks) {
					
					for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							'artist' : tracks[i].artist.name,
							'track': tracks[i].name,
							lfm_image:  {
								array: tracks[i].image
							}
						});
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
	
	su.show_playlist_page(pl_r);
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
					var track_list_without_tracks = [];
					if (artist_list){
						for (var i=0; i < artist_list.length; i++) {
							track_list_without_tracks.push({"artist" :artist_list[i]});
						}
					}
					pl_r.injectExpectedSongs(track_list_without_tracks);
				}
			}
	});

	su.show_playlist_page(pl_r);
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
				var artists = toRealArray(getTargetField(r, 'recommendations.artist'));
				var track_list = [];
				if (artists && artists.length) {
					
					for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							artist: artists[i].name,
							lfm_image: {
								array: artists[i].image
							}
						});
					}
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
	

	su.show_playlist_page(pl_r);

};












suReady(function(){
	try_mp3_providers();
	seesu.checkUpdates();
});

var UserPlaylists = function() {};
provoda.Eventor.extendTo(UserPlaylists, {
	init: function() {
		this._super();
		this.playlists = [];
	},
	savePlaylists: function(){
		var _this = this;
		if (this.save_timeout){clearTimeout(this.save_timeout);}
		
		this.save_timeout = setTimeout(function(){
			var plsts = [];
			var playlists = _this.playlists;
			for (var i=0; i < playlists.length; i++) {
				plsts.push(playlists[i].simplify());
			}
			_this.saveToStore(plsts);
			
		},10);
		
	},
	
	createUserPlaylist: function(title){

		var pl_r = this.createEnvPlaylist({
			title: title,
			type: "cplaylist",
			data: {name: title} 
		});
		this.watchOwnPlaylist(pl_r);
		this.playlists.push(pl_r);
		this.trigger('playlsits-change', this.playlists);
		return pl_r;
	},
	watchOwnPlaylist: function(pl) {
		var _this = this;
		pl.on('palist-change', function(array) {
			this.trigger('each-playlist-change');
			_this.savePlaylists();
		});
	},
	removePlaylist: function(pl) {
		var length = this.playlists.length;
		this.playlists = arrayExclude(this.playlists, pl);
		if (this.playlists.length != length){
			this.trigger('playlsits-change', this.playlists);
			this.savePlaylists();
		}
		
	},
	rebuildPlaylist: function(saved_pl){
		var p = this.createEnvPlaylist({
			title: saved_pl.playlist_title, 
			type: saved_pl.playlist_type,
			data: {name: saved_pl.playlist_title}
		});
		for (var i=0; i < saved_pl.length; i++) {
			p.push(saved_pl[i]);
		}
		this.watchOwnPlaylist(p);
		return p;
	},
	setSavedPlaylists: function(spls) {
		var recovered = [];

		if (spls){
			for (var i=0; i < spls.length; i++) {
				recovered[i] = this.rebuildPlaylist(spls[i]);
			}
		} 
		
		this.playlists = recovered;
		this.trigger('playlsits-change', this.playlists);
	}
});

SuUsersPlaylists = function() {};
UserPlaylists.extendTo(SuUsersPlaylists, {
	init: function() {
		this._super();
		this
			.on('playlsits-change', function(array) {
				su.checkPlaylists(array);
			})
			.on('each-playlist-change', function() {
				su.trackEvent('song actions', 'add to playlist');
			});
	},
	saveToStore: function(value) {
		suStore('user_playlists', value, true);
	},
	createEnvPlaylist: function(opts) {
		return su.preparePlaylist(opts);
	}
});


jsLoadComplete(function() {


	su.gena = new SuUsersPlaylists();
	su.gena.init();


	var plsts_str = suStore('user_playlists');
	if (plsts_str){
		su.gena.setSavedPlaylists(plsts_str);
	}

	
	jsLoadComplete.change();
});
