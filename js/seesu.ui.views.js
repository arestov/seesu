/*
freeze
!restoreFreezed
show_now_playing

!!!show_playlist_page
show_track_page
*/
var mainLevel;
(function() {
var baseNavUI = function() {};

suServView.extendTo( baseNavUI, {
	init: function(mlm) {
		this._super();
		this.createBase();
		this.bindClick();
		var text_place = this.c.find('span');
		if (text_place){
			this.text_place = text_place;
		}
		this.setModel(mlm);
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
	init: function(md){
		this.md = this.m_l = md;
	
		this._super();

		this.sui = su.ui;
		this.d = su.ui.d;

		this.els = su.ui.els;
		this.nav = su.ui.nav;
		this.c = $(this.d.body);

		this.setModel(md);

		var _this = this;
		this.c.addClass('app-loaded');
		

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
		"wait-vk-login": function(state) {
			this.toggleBodyClass(state, 'wait-vk-login');
		},
		"vk-waiting-for-finish": function(state){
			this.toggleBodyClass(state, 'vk-waiting-for-finish');
		},
		"slice-for-height": function(state){
			this.toggleBodyClass(state, 'slice-for-height');
		},
		"deep-sandbox": function(state){
			this.toggleBodyClass(state, 'deep-sandbox');
		},
		"flash-internet":function(state){
			this.toggleBodyClass(state, 'flash-internet');
		},
		"viewing-playing": function(state) {
			if (this.now_playing_link){
				if (state){
					this.now_playing_link.removeClass("nav-button");
				} else {
					this.now_playing_link.addClass("nav-button");
				}
			}	
		},
		'now-playing': function(text) {
			
			if (!this.now_playing_link && this.nav){
				this.now_playing_link = $('<a class="nav-item np-button"><span class="np"></span></a>').click(function(){
					su.views.show_now_playing(true);
				}).appendTo(this.nav.justhead);
			}
			if (this.now_playing_link){
				this.now_playing_link.attr('title', (localize('now-playing','Now Playing') + ': ' + text));	
			}	
		},
		playing: function(state) {
			var s = this.els.pllistlevel.add(this.now_playing_link);
			if (state){
				s.addClass('player-played');

				if (app_env.need_favicon){
					this.changeFavicon('playing');
				}
				
			} else {
				s.each(function(i, el){
					$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
				});
				if (app_env.need_favicon){
					this.changeFavicon('usual');
				}
				
			}
		},
		"doc-title": function(title) {
			this.d.title = 	title || "";
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
		},
		"have-playlists": function(state){
			if (state){
				if (!this.plts_link){
					this.plts_link =  this.els.fast_personal_start.children('.cus-playlist-b');
					var _this = this;
					this.plts_link.children('a').click(function(e){
						_this.md.fast_pstart.hideAll();
						e.preventDefault();
						su.ui.search(':playlists');
					});
				}
				this.plts_link.removeClass('hidden');
			}
		}
	},
	appendChildren: function(){

		var fast_pstart_view = this.md.fast_pstart.getFreeView(false, su.ui.els.fast_personal_start);
		if (fast_pstart_view){
			this.addChild(fast_pstart_view);
		}

	},
	toggleBodyClass: function(add, class_name){
		if (add){
			this.c.addClass(class_name);
		} else {
			this.c.removeClass(class_name);
		}
	},
	changeFavicon: debounce(function(state){
		if (this.isAlive()){
			if (state && this.favicon_states[state]){
				changeFavicon(this.d, this.favicon_states[state], 'image/png');
			} else{
				changeFavicon(this.d, this.favicon_states['usual'], 'image/png');
			}
		}
		
	},300),
	favicon_states: {
		playing: 'icons/icon16p.png',
		usual: 'icons/icon16.png'
	}
});


mainLevel = function(su) {
	this.init();
	this.su = su;
	this.updateState('nav-title', 'Seesu start page');

	if (app_env.check_resize){
		this.updateState('slice-for-height', true);
	}
	if (app_env.deep_sanbdox){
		this.updateState('deep-sandbox', true);
	}

	this.fast_pstart = new FastPSRow(this);


	var _this = this;

	this.regDOMDocChanges(function() {
		var this_view = _this.getFreeView().appended();

		if (su.ui.nav.daddy){
			var child_ui = _this.getFreeView('nav');
			if (child_ui){
				su.ui.nav.daddy.append(child_ui.getC());
				child_ui.appended();
			} 
		}

		
	});
	this.closed_messages = suStore('closed-messages') || {};
};


suMapModel.extendTo(mainLevel, {
	ui_constr: {
		main: mainLevelUI,
		nav: mainLevelNavUI,
		chrome_ext: ChromeExtensionButtonView,
		opera_ext: OperaExtensionButtonView
	},
	page_name: 'start page',
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
	},
	setDocTitle: function(title) {
		this.updateState('doc-title', title);
	}
});


var FastPSRowView = function(){};
ActionsRowUI.extendTo(FastPSRowView, {
	createBase: function(c){
		this.c = c;
		this.row_context = this.c.find('.row-context');
		this.arrow = this.row_context.children('.rc-arrow');

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
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();

			this.c = parent_c.children('.lfm-recomm');
			this.button = parent_c.parent().find('#lfm-recomm').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_recommendations();
				}
				
				return false;
			});
			//this.bindClick();
			this.setModel(md);
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_reccoms_view = this.md.lfm_reccoms.getFreeView();
			if (lfm_reccoms_view){
				this.c.append(lfm_reccoms_view.getC());
				this.addChild(lfm_reccoms_view);
			}
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
		this.lfm_reccoms = new LfmReccoms(this.actionsrow.ml.su.lfm_auth);
		this.addChild(this.lfm_reccoms);
	},
	row_name: 'lastfm-recomm',
	ui_constr: LastfmRecommRowView
});


var LastfmLoveRowView = function(){};
	BaseCRowUI.extendTo(LastfmLoveRowView, {
		init: function(md, parent_c, buttons_panel){
			this.md = md;
			this._super();

			this.c = parent_c.children('.lfm-loved');
			this.button = parent_c.parent().find('#lfm-loved').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_loved();
				}
				
				return false;
			});
			//this.bindClick();
			this.setModel(md);
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_loves_view = this.md.lfm_loves.getFreeView();
			if (lfm_loves_view){
				this.c.append(lfm_loves_view.getC());
				this.addChild(lfm_loves_view);
			}
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
		this.lfm_loves = new LfmLoved(this.actionsrow.ml.su.lfm_auth);
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




views = function(su_map, su){
	var _this = this;
	this.m = su_map;

	this.m
		.on('title-change', function(title) {
			su.main_level.setDocTitle(title);


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
		});

};
//su.ui.nav.daddy
views.prototype = {
	restoreFreezed: function(transit, url_restoring){
		this.m.restoreFreezed(transit, url_restoring);
	},

	show_now_playing: function(no_stat){
		if (!no_stat){
			su.trackEvent('Navigation', 'now playing');
		}
		//var cl = su.map.getCurMapL();
		//cl = cl && cl.resident;

		this.restoreFreezed(true);
		su.views.show_track_page(su.p.c_song);
		
		
	},
	showStartPage: function(url_restoring){
		//mainaly for hash url games
		this.m.startNewBrowse(url_restoring);
	},
	showResultsPage: function(query, no_navi){
		var lev;
		if (!su.search_el || !su.search_el.lev.isOpened()){
			lev = this.m.goDeeper(false, createSuInvestigation());
		} else {
			lev = su.search_el.lev;
		}
		
		var invstg = lev.resident;
		invstg.changeQuery(query);

	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, new artCard(artist));
	},
	showStaticPlaylist: function(pl, save_parents, no_navi) {
		if (pl.lev && pl.lev.canUse() && !pl.lev.isOpened()){
			this.restoreFreezed();
		} else {
			this.show_playlist_page(pl, save_parents, no_navi);
		}
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, pl);
	},
	show_track_page: function(mo, no_navi){
		var _this = this,
			title = (mo.plst_titl.belongsToArtist(mo.artist) ? '' : (mo.artist + ' - '))  + mo.track;
		
		var pl = mo.plst_titl;
			pl.lev.sliceTillMe(true);
		var lev = this.m.goDeeper(true, mo);
	}
};
})();