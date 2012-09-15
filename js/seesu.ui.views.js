/*
freeze
!restoreFreezed
show_now_playing

!!!show_playlist_page
show_track_page
*/
var mainLevel;
var appModel;
(function() {
var baseNavUI = function() {};

suServView.extendTo( baseNavUI, {
	createDetailes: function(){
		this.createBase();
		this.bindClick();
		var text_place = this.c.find('span');
		if (text_place){
			this.text_place = text_place;
		}
	},
	stack_types: ['top', 'bottom', 'middle'],
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
		},
		'mp-blured': function(state) {
			if (state){
				this.c.addClass('nnav');
			} else {
				this.c.removeClass('nnav');
			}
		},
		'mp-stack': function(state) {
			if (state){
				if (this.stack_types.indexOf(state) != -1){
					this.c.addClass('stack-' + state);
				}

			} else {
				this.resetStackMark();
			}
		},
		"nav-text": function(text) {
			if (this.text_place){
				this.text_place.text(text || '');
			}
		},
		"nav-title": function(text) {
			this.c.attr('title', text || '');
			
		}
	},

	resetStackMark: function() {
		this.c.removeClass('stack-bottom stack-middle stack-top');
	},
	bindClick: function() {
		var _this = this;
		this.c.click(function(){
			_this.md.zoomOut();
		});
	}
});

var mainLevelNavUI = function(mal) {};

baseNavUI.extendTo(mainLevelNavUI, {
	createBase: function(){
		this.c = $('<span class="nav-item nav-start" title="Seesu start page"><b></b><span class="icon">.</span></span>');
	},
	'stch-mp-stack':function(state) {
		if (state && state == !!state){
			this.c.addClass('stacked');
		} else {
			this.c.removeClass('stacked');
		}
	}, 
	'stch-mp-blured': function(state) {
		if (state){
			this.c.addClass("nav-button");
		} else {
			this.c.removeClass("nav-button");
		}
	}
});


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
				su.opera_ext_b.icon = "/icons/icon18p.png";
			} else {
				su.opera_ext_b.icon = "/icons/icon18.png";
			}
		},
		'now-playing': function(text) {
			su.opera_ext_b.title = localize('now-playing','Now Playing') + ': ' + text;
		}
	}
});

var mainLevelUI = function(){};

suServView.extendTo(mainLevelUI, {
	createDetailes: function(){


		this.els = su.ui.els;


		var fast_pstart_view = this.md.fast_pstart.getFreeView(this, false);
		if (fast_pstart_view){
			this.addChild(fast_pstart_view);
		}
	},
	state_change: {
		'mp-show': function(opts) {
			if (opts){
				if (opts.userwant){
					this.els.search_input[0].focus();
					this.els.search_input[0].select();
				}
			} else {
				
			}
		},
		'mp-blured': function(state) {
			if (state){
				$(this.els.slider).removeClass("show-start");
			} else {
				$(this.els.slider).addClass("show-start");
			}
		},
		"have-playlists": function(state){
			if (state){
				if (!this.plts_link){
					this.plts_link =  this.els.fast_personal_start.children('.cus-playlist-b');
					var _this = this;
					this.plts_link.children('a').click(function(e){
						e.preventDefault();
						_this.md.fast_pstart.hideAll();
						_this.md.showPlaylists();
						
					});
				}
				this.plts_link.removeClass('hidden');
			}
		},
		"ask-rating-help": function(link){
			var _this = this;

			if (link){
				var spm_c = this.els.start_screen.find('.start-page-messages');
				this.message_arh_c = $('<div class="attention-message"></div>');

				$("<a class='close-message'>×</a>").appendTo(this.message_arh_c).click(function() {
					_this.md.closeMessage('rating-help');
				});
				$('<img class="message-image"/>').attr({
					src: 'http://cs9767.userapi.com/u198193/b_b379d470.jpg',
					width: 100,
					height: 126,
					alt: "Gleb Arestov"
				}).appendTo(this.message_arh_c);


				

				var url = $("<a class='external'></a>").attr('href', link).text(localize('at-this-page'));
				this.message_arh_c.append(createComlexText(localize("ask-rating-help")).setVar("app_url", url[0]));
				spm_c.append(this.message_arh_c);

				/*
				

				Поддержи сису — поставь оценку
				
				*/
			} else {
				if (this.message_arh_c){
					this.message_arh_c.remove();
	
				}
			}
		}
	}
});



appModel = function(){};

provoda.Model.extendTo(appModel, {
	ui_constr: {
	//	main: appModelView,
		chrome_ext: ChromeExtensionButtonView,
		opera_ext: OperaExtensionButtonView
	},
	init: function(su){
		this._super();
		this.su = su;

		if (app_env.check_resize){
			this.updateState('slice-for-height', true);
		}
		if (app_env.deep_sanbdox){
			this.updateState('deep-sandbox', true);
		}
		var _this = this;


		this.map = new browseMap();
		this.start_page = (new mainLevel()).init(su);
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
				su.trackPage(nv.map_level.resident.page_name);
			})
			.makeMainLevel();

		return this;
	},
	changeNavTree: function(nav_tree) {
		this.nav_tree = $filter(nav_tree, 'resident');
		this.checkNowPlayNav();
	},
	nowPlaying: function(mo) {
		this.updateState('now-playing', mo.getTitle());
		this.current_playing = mo;
		this.checkNowPlayNav();
	},
	checkNowPlayNav: debounce(function() {
		if (this.current_playing){
			this.updateState('viewing-playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}
		
	}, 30),
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	setDocTitle: function(title) {
		this.updateState('doc-title', title);
	},
	restoreFreezed: function(transit, url_restoring){
		this.map.restoreFreezed(transit, url_restoring);
	},
	// <<<< browser map
	show_now_playing: function(no_stat){
		if (!no_stat){
			su.trackEvent('Navigation', 'now playing');
		}
		this.restoreFreezed(true);
		this.show_track_page(su.p.c_song);
		
		
	},
	showStartPage: function(url_restoring){
		//mainaly for hash url games
		this.map.startNewBrowse(url_restoring);
	},
	showResultsPage: function(query, no_navi){
		var lev;
		if (!su.search_el || !su.search_el.lev.isOpened()){
			lev = this.map.goDeeper(false, createSuInvestigation());
		} else {
			lev = su.search_el.lev;
		}
		
		var invstg = lev.resident;
		invstg.changeQuery(query);

	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var lev = this.map.goDeeper(save_parents, new artCard(artist));
	},
	showStaticPlaylist: function(pl, save_parents, no_navi) {
		if (pl.lev && pl.lev.canUse() && !pl.lev.isOpened()){
			this.restoreFreezed();
		} else {
			this.show_playlist_page(pl, save_parents, no_navi);
		}
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		var lev = this.map.goDeeper(save_parents, pl);
	},
	show_track_page: function(mo, no_navi){
		var _this = this,
			title = (mo.plst_titl.belongsToArtist(mo.artist) ? '' : (mo.artist + ' - '))  + mo.track;
		
		var pl = mo.plst_titl;
			pl.lev.sliceTillMe(true);
		var lev = this.map.goDeeper(true, mo);
	},

	// browser map >>>>>

	show_tag: function(tag, vopts, start_song){
		//save_parents, no_navi
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl_r = su.preparePlaylist({
			title: 'Tag: ' + tag,
			type: 'artists by tag',
			data: {tag: tag}
		}, start_song);

		pl_r.setLoader(function(paging_opts) {
			
			var request_info = {};
			lfm.get('tag.getTopArtists',{'tag':tag, limit: paging_opts.page_limit, page: paging_opts.next_page})
				.done(function(r){
					var artists = r.topartists.artist;
					var track_list = [];

					if (artists && artists.length) {
						for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
							track_list.push({
								artist: artists[i].name
							});
						}

					}
					pl_r.injectExpectedSongs(track_list);
					if (track_list.length < paging_opts.page_limit){
						pl_r.setLoaderFinish();
					}
				})
				.fail(function() {
					pl_r.loadComplete(true);
				}).always(function() {
					request_info.done = true;
				});
			return request_info;
		}, true);


		su.app_md.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (start_song){
			pl_r.showTrack(start_song, full_no_navi);
		}
	},

	showArtistPlaylist: function(artist, pl, vopts){
		vopts = vopts || {};
		var cpl = su.p.isPlaying(pl);
		if (!cpl){
			if (!vopts.from_artcard){
				su.app_md.showArtcardPage(artist, vopts.save_parents, true);
			}
			su.app_md.show_playlist_page(pl, !vopts.from_artcard || !!vopts.save_parents, vopts.no_navi);
			return false;
		} else{
			su.app_md.restoreFreezed();
			return cpl;
		}
	},
	/*
	var vopts = {
		save_parents: save_parents,
		no_navi,
		from_artcard
	}*/
	showAlbum: function(opts, vopts, start_song){
	//showAlbum: function(opts, save_parents, start_song, simple){
		var artist			= opts.artist, 
			name			= opts.album_name,
			id				= opts.album_id, 
			original_artist	= opts.original_artist,
			vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = su.preparePlaylist({
			title: '(' + artist + ') ' + name,
			type: 'album',
			data: {artist: original_artist || artist, album: name}
		}, start_song).loading();
	
		var recovered = this.showArtistPlaylist(original_artist || artist, pl, vopts);
		
		if (!recovered){
			var get_artist_album_playlist = function(album_id, pl_r){
				if (album_id) {
					lfm.get('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id})
						.done(function(pl_data){
							make_lastfm_playlist(pl_data, pl_r);
						});
				}
			};
			if (id){
				get_artist_album_playlist(id, pl);
			} else{
				lfm.get('album.getInfo',{'artist': artist, album : name})
					.done(function(alb_data){
						get_artist_album_playlist(alb_data.album.id, pl);
					});
			}
		}
		if (start_song){
			(recovered || pl).showTrack(start_song, vopts.no_navi);
		}
	},
	showTopTacks: function (artist, vopts, start_song) {
	//showTopTacks: function (artist, save_parents, no_navi, start_song, simple) {
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		
		
		var pl = su.preparePlaylist({
			title: 'Top of ' + artist,
			type: 'artist',
			data: {artist: artist}
		}, start_song);
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		
		if (!recovered){
			pl.setLoader(function(paging_opts) {
				
				var request_info = {};
				lfm.get('artist.getTopTracks', {'artist': artist, limit: paging_opts.page_limit, page: paging_opts.next_page})
					.done(function(r){
						if (r.error){
							pl.loadComplete(true);
							return;
						}
						var tracks = r.toptracks.track || false;
						var track_list = [];
						if (tracks) {
							
							tracks = toRealArray(tracks);
							
							for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
								track_list.push({'artist' : artist ,'track': tracks[i].name, images: tracks[i].image});
							}
							
						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
				return request_info;
			}, true);

		}
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	showTrackById: function(sub_raw, vopts){
		var pl_r = su.preparePlaylist({
			title: 'Track' ,
			type: 'tracks',
			data: {time: + new Date()}
		});
		su.app_md.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (sub_raw.type && sub_raw.id){
			su.mp3_search.getById(sub_raw, function(song, want_auth){
				
				if (pl_r.ui){
					if (!song){
						if (want_auth){
							if (sub_raw.type == 'vk'){
								pl_r.loadComplete('vk_auth');
							} else{
								pl_r.loadComplete(true);							
							}
						} else {
							pl_r.loadComplete(true);

						}
					} else{
						pl_r.push(song, true);
						pl_r.loadComplete();
					}
					if (want_auth){
						return true;
					}
					console.log(song)
				} 
			}, function(){
				return !!pl_r.getC();
			}, function(){

			})
		} else{
			
		}
	},
	showMetroChart: function(country, metro, vopts){
		vopts = vopts || {};
		var plr = su.preparePlaylist({//can autoload
			title: 'Chart of ' + metro,
			type: 'chart',
			data: {country: country, metro: metro}
		}).loading();

		lfm.get('geo.getMetroUniqueTrackChart', {country: country, metro: metro, start: new Date - 60*60*24*7})
			.done(function(r){
				if (r.error){
					pl_r.loadComplete(true);
					return;
				}
				if (r && r.toptracks && r.toptracks.track){
					var metro_tracks = toRealArray(r.toptracks.track);
					for (var i=0; i < Math.min(metro_tracks.length, 30); i++) {
						
						var _trm = metro_tracks[i];
						plr.push({artist: _trm.artist.name, track: _trm.name});
					};
					pl_r.loadComplete(metro_tracks.length);
				} else {
					pl_r.loadComplete(true);
				}

				
			});
		su.app_md.show_playlist_page(plr, vopts.save_parents, vopts.no_navi);
	},
	showSimilarArtists: function(artist, vopts, start_song){
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = su.preparePlaylist({//can autoload
			title: 'Similar to «' + artist + '» artists',
			type: 'similar artists',
			data: {artist: artist}
		}, start_song).loading();
		//su.app_md.show_playlist_page(pl, false, no_navi || !!start_song);
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		if (!recovered){

			pl.setLoader(function(paging_opts){
				var request_info = {};
				lfm.get('artist.getSimilar',{'artist': artist, limit: paging_opts.page_limit, page: paging_opts.next_page})
					.done(function(r){
						var artists = r.similarartists.artist;
						var track_list = [];

						if (artists && artists.length) {
							for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
								track_list.push({
									artist: artists[i].name
								});
							}

						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
			}, true);
			
		
		}
		
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	setSearchInputValue: function(value) {
		this.els.search_input.val(value);
	},
	search: function(query, no_navi, new_browse){
		if (new_browse){
			this.showStartPage();
		}
		if (su.search_query != query){
			su.search_query = query;
			this.setSearchInputValue(query);
		}
		inputChange(query, this.els.search_label, no_navi);
	}



});

mainLevel = function() {};


suMapModel.extendTo(mainLevel, {
	ui_constr: {
		main: mainLevelUI,
		nav: mainLevelNavUI,
	},
	page_name: 'start page',
	showPlaylists: function(){
		su.ui.search(':playlists');
	},
	init: function(su){
		this._super();
		this.su = su;
		this.updateState('nav-title', 'Seesu start page');

		this.fast_pstart = new FastPSRow(this);


		var _this = this;

		this.regDOMDocChanges(function() {
			var this_view = _this.getFreeView(this).appended();
			this_view.requestAll();

			if (su.ui.nav.daddy){
				var child_ui = _this.getFreeView(this, 'nav');
				if (child_ui){
					su.ui.nav.daddy.append(child_ui.getA());
					child_ui.requestAll();
				}
			}

			
		});
		this.closed_messages = suStore('closed-messages') || {};
		return this;
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (su.app_pages[su.env.app_type]){
				if (state){
					this.updateState('ask-rating-help', su.app_pages[su.env.app_type]);
				} else {
					this.updateState('ask-rating-help', false);
				}
				
			}
		}
	},
	closeMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.closed_messages[message_name] = true;
			suStore('closed-messages', this.closed_messages, true);
			this.messages[message_name].call(this, false);
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.messages[message_name].call(this, true);
		}
	}
});


var FastPSRowView = function(){};
ActionsRowUI.extendTo(FastPSRowView, {
	createBase: function(c){
		this.c = this.parent_view.els.fast_personal_start;
		this.row_context = this.c.find('.row-context');
		this.arrow = this.row_context.children('.rc-arrow');
		this.buttons_panel = this.c;
	}
});


var FastPSRow = function(parent_m){
	this.init(parent_m);
};

PartsSwitcher.extendTo(FastPSRow, {
	init: function(ml) {
		this._super();
		this.ml = ml;
		this.updateState('active_part', false);
		this.addPart(new LastfmRecommRow(this, ml));
		this.addPart(new LastfmLoveRow(this, ml));
	//	this.addPart(new MultiAtcsRow(this, pl));
	//	this.addPart(new PlaylistSettingsRow(this, pl));
	},
	ui_constr: FastPSRowView
});




var LastfmRecommRowView = function(){};
	BaseCRowUI.extendTo(LastfmRecommRowView, {
		createDetailes: function(){

			var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
			var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
			var md = this.md;
			this.c = parent_c.children('.lfm-recomm');
			this.button = buttons_panel.find('#lfm-recomm').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_recommendations();
				}
				
				return false;
			});
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_reccoms_view = this.md.lfm_reccoms.getFreeView(this);
			if (lfm_reccoms_view){
				this.c.append(lfm_reccoms_view.getA());
				this.addChild(lfm_reccoms_view);
				
			}
			this.requestAll();
		}
	});




var LastfmRecommRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmRecommRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		//this.lfm_scrobble = new LfmScrobble(su.lfm_auth);
		this.lfm_reccoms = new LfmReccoms(this.actionsrow.ml.su.lfm_auth, this);
		this.addChild(this.lfm_reccoms);
	},
	row_name: 'lastfm-recomm',
	ui_constr: LastfmRecommRowView
});


var LastfmLoveRowView = function(){};
	BaseCRowUI.extendTo(LastfmLoveRowView, {
		createDetailes: function(){
			var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
			var md = this.md;
			this.c = parent_c.children('.lfm-loved');
			this.button = buttons_panel.find('#lfm-loved').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_loved();
				}
				
				return false;
			});
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_loves_view = this.md.lfm_loves.getFreeView(this);
			if (lfm_loves_view){
				this.c.append(lfm_loves_view.getA());
				this.addChild(lfm_loves_view);
				
			}
			this.requestAll();
		}
	});




var LastfmLoveRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmLoveRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		//this.lfm_scrobble = new LfmScrobble(su.lfm_auth);
		this.lfm_loves = new LfmLoved(this.actionsrow.ml.su.lfm_auth, this);
		this.addChild(this.lfm_loves);
	},
	row_name: 'lastfm-love',
	ui_constr: LastfmLoveRowView
});


/*







*/

investgNavUI = function() {};

baseNavUI.extendTo(investgNavUI, {
	createBase: function() {
		this.c = $('<span class="nav-item nav-search-results" title="Search results"><b></b><span class="icon">.</span></span>');
	}
});

artCardNavUI = function() {};
baseNavUI.extendTo(artCardNavUI, {
	createBase: function() {
		this.c = $('<span class="nav-item "><span>.</span><b></b></span>');
	}
});


playlistNavUI = function() {};
baseNavUI.extendTo(playlistNavUI, {
	createBase: function() {
		this.c = $('<span class="nav-item nav-playlist-page"><span>.</span><b></b></span>');
	}
});


trackNavUI = function(mlm) {};
baseNavUI.extendTo(trackNavUI, {
	createBase: function() {
		this.c = $('<span class="nav-item nav-track-zoom"><span>.</span><b></b></span>');
	}
});


})();