var su, seesu;
define('su',
['require', 'spv', 'app_serv', 'provoda', 'jquery', 'js/libs/navi', 'js/libs/BrowseMap', 'js/modules/net_apis', 'js/libs/Mp3Search',
'js/libs/FuncsQueue', 'js/libs/LastfmAPIExtended', 'js/models/AppModel', 'js/models/comd', 'js/LfmAuth', 'js/models/StartPage', 'js/SeesuServerAPI', 'js/libs/VkAuth'],
function(require, spv, app_serv, provoda, $, navi, BrowseMap, net_apis, Mp3Search,
FuncsQueue, LastfmAPIExtended, AppModel, comd, LfmAuth, StartPage, SeesuServerAPI, VkAuth) {
'use strict';
var localize = app_serv.localize;

var
	app_env = app_serv.app_env,
	cache_ajax;



$.ajaxSetup({
  cache: true,
  global:false,
  timeout:40000,
  headers:{
	'X-Requested-With': 'XMLHttpRequest'
  }
});
$.support.cors = true;


var lfm = new LastfmAPIExtended();

lfm.init(app_serv.getPreloadedNK('lfm_key'), app_serv.getPreloadedNK('lfm_secret'), function(key){
	return app_serv.suStore(key);
}, function(key, value){
	return app_serv.suStore(key, value, true);
}, cache_ajax, app_env.cross_domain_allowed, new FuncsQueue(700));
lfm.checkMethodResponse = function(method, data, r) {
	su.art_images.checkLfmData(method, r);
};


var chrome = window.chrome;
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
		'now_playing': function(text) {
			chrome.browserAction.setTitle({title: localize('now_playing','Now Playing') + ': ' + text});
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
		'now_playing': function(text) {
			this.opts.opera_ext_b.title = localize('now_playing','Now Playing') + ': ' + text;
		}
	}
});


var SeesuApp = function() {};
AppModel.extendTo(SeesuApp, {
	init: function(version){
		this._super();
		this.version = version;
		this.lfm = lfm;

		this._url = app_serv.get_url_parameters(location.search, true);
		this.settings = {};
		this.settings_timers = {};

		this.trackStat = (function(){
			window._gaq = window._gaq || [];
			var _gaq = window._gaq;
			_gaq.sV = spv.debounce(function(v){
				suStore('ga_store', v, true);
			},130);
			_gaq.gV = function(){
				return suStore('ga_store');
			};
			spv.domReady(window.document, function(){
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

		this.last_usage = (lu && new Date(lu)) || ((new Date() * 1) - 1000*60*60*0.75);
		this.usage_counter = parseFloat(suStore('su-usage-counter')) || 0;

		var _this = this;
		setInterval(function(){

			var now = new Date();

			if ((now - _this.last_usage)/ (1000 * 60 * 60) > 4){
				_this.checkStats();
				suStore('su-usage-last', (_this.last_usage = new Date()).toUTCString(), true);
				suStore('su-usage-counter', ++_this.usage_counter, true);
			}


		}, 1000 * 60 * 20);
		setInterval(function(){
			var rootvs = _this.mpx.getViews('root');
			if (rootvs.length){
				_this.updateLVTime();
			}
		}, 1000 * 60 * 2);

		this.popular_artists = ["The Beatles", "Radiohead", "Muse", "Lady Gaga", "Eminem", "Coldplay", "Red Hot Chili Peppers", "Arcade Fire", "Metallica", "Katy Perry", "Linkin Park" ];
		this.vk = {};

		this.notf = new comd.GMessagesStore(
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
			bridge_url: 'http://seesu.me/lastfm/bridge.html'
		});


		this.app_md = this;
		this.art_images = new comd.LastFMArtistImagesSelector();
		this.art_images.init();

		if (app_env.check_resize){
			this.updateState('slice-for-height', true);
		}
		if (app_env.deep_sanbdox){
			this.updateState('deep-sandbox', true);
		}


		this.start_page = (new StartPage()).init({
			app: this
		});
		this.updateNesting('navigation', [this.start_page]);
		this.updateNesting('start_page', this.start_page);



		this.map
			.init(this.start_page)
			.on('map-tree-change', function(nav_tree) {
				_this.changeNavTree(nav_tree);
			}, {immediately: true})
			.on('changes', function(changes) {
				//console.log(changes);
				_this.animateMapChanges(changes);
			}, {immediately: true})
			.on('title-change', function(title) {
				_this.setDocTitle(title);

			}, {immediately: true})
			.on('url-change', function(nu, ou, data, replace) {
				if (app_env.needs_url_history){
					if (replace){
						navi.replace(ou, nu, data.resident);
					} else {
						navi.set(nu, data.resident);
					}
				}
			}, {immediately: true})
			.on('every-url-change', function(nv, ov, replace) {
				if (replace){
					//su.trackPage(nv.map_level.resident.page_name);
				}

			}, {immediately: true})
			.on('nav-change', function(nv, ov, history_restoring, title_changed){
				setTimeout(function() {
					_this.trackPage(nv.map_level.resident.page_name);
				},10);
			}, {immediately: true})
			.makeMainLevel();




		var addBrowserView = function(Constr, name, opts) {
			var view = new Constr();

			_this.mpx.addView(view, name);

			view.init({
				mpx: _this.mpx
			}, opts);
			view.requestAll();

		};

		var ext_view;
		if (app_env.chrome_extension){
			addBrowserView(ChromeExtensionButtonView, 'chrome_ext');
		} else if (app_env.opera_extension && window.opera_extension_button){
			this.opera_ext_b = window.opera_extension_button;
			addBrowserView(OperaExtensionButtonView, 'opera_ext', {opera_ext_b: window.opera_extension_button});
		}



		this.delayed_search = {
			vk_api:{
				queue:  new FuncsQueue(700, 8000 , 7)
			}
		};



		this.s  = new SeesuServerAPI(this, suStore('dg_auth'), this.server_url);
		this.updateState('su_server_api', true);

		this.s.on('info-change.vk', function(data) {
			_this.updateState('vk_info', data);
		});

		this.on('vk-api', function(vkapi, user_id) {
			_this.getAuthAndTransferVKInfo(vkapi, user_id);
		});


		this.mp3_search = (new Mp3Search({
			vk: 5,
			nigma: 1,
			exfm: 0,
			soundcloud: -5,
			lastfm:-10,
			torrents: -15
		}));




		var reportSearchEngs = spv.debounce(function(string){
			_this.trackVar(4, 'search', string, 1);
		}, 300);

		this.mp3_search.on('list-changed', function(list){
			list = spv.filter(list, 'name').sort();
			for (var i = 0; i < list.length; i++) {
				list[i] = list[i].slice(0, 2);
			}
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

		setTimeout(function(){
			_this.checkStats();
		},100);

		spv.domReady(window.document, function() {
			_this.lfm_auth.try_to_login();
			setTimeout(function(){
				return;
				while (big_timer.q.length){
					_this.trackTime.apply(_this, big_timer.q.shift());
					//console.log()
				}
			}, 300);
			if (!lfm.sk) {
				_this.lfm_auth.get_lfm_token();

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
			}
			var last_ver = suStore('last-su-ver');
			_this.migrateStorage(last_ver);
			suStore('last-su-ver', version, true);

		}, 200);


		this.vk_auth = new VkAuth({
			app_id: this.vkappid,
			urls: {
				bridge: 'http://seesu.me/vk/bridge.html',
				callbacker: 'http://seesu.me/vk/callbacker.html'
			},
			permissions: ["friends", "video", "offline", "audio", "wall", "photos"],
			open_api: false,
			deep_sanbdox: app_env.deep_sanbdox,
			vksite_app: app_env.vkontakte,
			vksite_settings: this._url.api_settings
		});



		this.once("vk-site-api", function() {
			window.documentScrollSizeChangeHandler = function(height){
				VK.callMethod("resizeWindow", 800, Math.max(700, height));
			};
			_this.vk_auth.trigger('vk-site-api', VK);
		});



		this.hypem = new net_apis.HypemApi();
		this.hypem.init({
			xhr2: app_env.xhr2,
			crossdomain: app_env.cross_domain_allowed,
			cache_ajax: cache_ajax,
			queue: new FuncsQueue(1700, 4000, 4)
		});
		this.goog_sc = new net_apis.GoogleSoundcloud();
		this.goog_sc.init({
			crossdomain: app_env.cross_domain_allowed,
			cache_ajax: cache_ajax,
			queue: new FuncsQueue(1000, 3000, 4)
		});
		this.discogs = new net_apis.DiscogsApi();
		this.discogs.init({
			crossdomain: app_env.cross_domain_allowed,
			cache_ajax: cache_ajax,
			queue: new FuncsQueue(2000, 4000, 4)
		});

		if (app_env.needs_url_history){
			navi.init(function(e, soft){
				var url = e.newURL;
				_this.map.startChangesCollecting({
					skip_url_change: true
				});

				var state_from_history = navi.findHistory(e.newURL);
				if (state_from_history){
					state_from_history.data.showOnMap();
				} else{
					_this.routePathByModels(url.replace(/\ ?\$...$/, ''), _this.start_page);
				}
				_this.map.finishChangesCollecting();
			});
			(function() {
				var url = window.location && location.hash.replace(/^\#/,'');
				if (url){
					_this.on('handle-location', function() {
						navi.hashchangeHandler({
							newURL: url
						}, true);

					});
				}
			})();

		}
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
	showPlaylists: function() {
		this.search(':playlists');
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
	decodeURLPart: function(part) {
		var spaced = part.split("+");
		$.each(spaced, function(i, el){
			spaced[i] = decodeURIComponent(el);
		});
		return spaced.join(" ");
	},
	getCommaParts: function(string) {
		var parts = string.split(',');
		for (var i = 0; i < parts.length; i++) {
			parts[i] = this.decodeURLPart(parts[i]);
		}
		return parts;
	},
	app_pages: {
		chrome_extension: "https://chrome.google.com/webstore/detail/nhonlochieibnkmfpombklkgjpkeckhi/reviews",
		chrome_app: "https://chrome.google.com/webstore/detail/fagoonkbbneajjbhdlklhdammdfkjfko/reviews",
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
		sp.init({
			app: this,
			map_parent: this.start_page
		});
		return sp;
	},
	routePathByModels: function(pth_string, start_page) {

	/*
	catalog
	users
	tags
	*/


	/*
	#/catalog/The+Killers/_/Try me
	#?q=be/tags/beautiful
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Phone+Call
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
	#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
	#/recommendations/Beastie+boys/Phone+Call
	#/loved/Beastie+boys/Phone+Call
	#/radio/artist/The+Killers/similarartist/Bestie+Boys/Intergalactic
	#?q=be/directsearch/vk/345345
	'artists by loved'
	#/ds/vk/25325_2344446
	http://www.lastfm.ru/music/65daysofstatic/+similar
	*/
		var pth = pth_string.replace(/^\//, '').replace(/([^\/])\+/g, '$1 ')/*.replace(/^\//,'')*/.split('/');

		var cur_md = start_page;
		var tree_parts_group = null;
		for (var i = 0; i < pth.length; i++) {
			if (cur_md.sub_pages_routes && cur_md.sub_pages_routes[pth[i]]){
				if (!tree_parts_group){
					tree_parts_group = [];
				}
				tree_parts_group.push(pth[i]);
				continue;
			} else {
				var path_full_string;
				if (tree_parts_group){
					path_full_string = [].concat(tree_parts_group, [pth[i]]).join('/');
				} else {
					path_full_string = pth[i];
				}
				tree_parts_group = null;
				var md = cur_md.findSPbyURLPart(path_full_string);
				if (md){
					cur_md = md;
				} else {
					break;
				}

			}


		}
		if (cur_md){
			cur_md.showOnMap();
		}
		return cur_md;
	},
	getPlaylists: function(query) {
		var r = [],i;
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
	getAuthAndTransferVKInfo: function(vk_api, user_id) {
		if (!user_id){
			throw new Error('want to get photo but have not user id :(');
		}
		var _this = this;

		vk_api.get('getProfiles', {
			uids: user_id,
			fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'

		},{nocache: true})
			.done(function(info) {
				info = info.response && info.response[0];
				if (info){
					_this.s.vk_id = user_id;

					var _d = spv.cloneObj({data_source: 'vkontakte'}, info);

					_this.s.setInfo('vk', _d);

					if (!_this.s.loggedIn()){
						_this.s.getAuth(user_id, function() {
							_this.s.api('user.update', _d);
						});
					} else{
						_this.s.api('user.update', _d);
					}
				} else {

				}
			})
			.fail(function() {

			});
	},
	getPhotoFromVK: function() {
		this.getAuthAndTransferVKInfo(this.vk_api, this.s.vk_id);
	},
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
	updateLVTime: function() {
		this.last_view_time = new Date() * 1;
	},
	connectVKApi: function(vk_token, access, not_save) {
		var _this = this;


		var lostAuth = function(vkapi) {

			_this.mp3_search.remove(vkapi.asearch);
			vkapi.asearch.dead = vkapi.asearch.disabled = true;
			if (_this.vk_api == vkapi){
				delete _this.vkapi;
			}

		};
		var vkapi = new vkApi(vk_token, {
			queue: _this.delayed_search.vk_api.queue,
			jsonp: !app_env.cross_domain_allowed,
			cache_ajax: cache_ajax,
			onAuthLost: function() {
				lostAuth(vkapi);
				checkDeadSavedToken(vk_token);
			},
			mp3_search: _this.mp3_search
		});

		_this.setVkApi(vkapi, vk_token.user_id);
		if (access){
			_this.mp3_search.add(vkapi.asearch, true);
		}

		if (vk_token.expires_in){
			setTimeout(function() {
				lostAuth(vkapi);
			}, vk_token.expires_in);
		}
		if (!not_save){
			suStore('vk_token_info', cloneObj({}, vk_token, false, ['access_token', 'expires_in', 'user_id']), true);
		}
		return vkapi;
	},
	createLFMFile: function(artist, track_name, link) {
		return {
			link: link,
			artist: artist,
			track: track_name,
			from:'lastfm',
			media_type: 'mp3',
			getSongFileModel: getSongFileModel,
			models: {}
		};
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
			}
		}).done(function(r){
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

		});
	}

});

seesu = su = new SeesuApp();
su.init(3.9);
provoda.sync_s.setRootModel(su);







(function(){

	//su.sc_api = sc_api;
	su.sc_api = new scApi(getPreloadedNK('sc_key'), new FuncsQueue(3500, 5000 , 4), app_env.cross_domain_allowed, cache_ajax);
	su.mp3_search.add(new scMusicSearch({
		api: su.sc_api,
		mp3_search: su.mp3_search
	}));


	var exfm_api = new ExfmApi(new FuncsQueue(3500, 5000, 4), app_env.cross_domain_allowed, cache_ajax);
	su.exfm = exfm_api;

	su.mp3_search.add(new ExfmMusicSearch({
		api: exfm_api,
		mp3_search: su.mp3_search
	}));


	if (app_env.cross_domain_allowed){
		su.mp3_search.add(new isohuntTorrentSearch({
			cache_ajax: cache_ajax,
			mp3_search: su.mp3_search
		}));

		/*yepnope({
			load:  [bpath + 'js/libs/nigma.search.js'],
			complete: function(){
				window.nms = new NigmaMusicSearch(new NigmaAPI(new FuncsQueue(5000, 10000, 4)))
				su.mp3_search.add(window.nms);
				
				//$(document.body).append(_this.c);
			}
		});*/
	} else {
		su.mp3_search.add(new googleTorrentSearch({
			crossdomain: app_env.cross_domain_allowed,
			mp3_search: su.mp3_search,
			cache_ajax: cache_ajax
		}));
	}



})();

spv.domReady(window.document, function(){
	try_mp3_providers();
	seesu.checkUpdates();
});




});