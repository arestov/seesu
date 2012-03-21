/*
freeze
!restoreFreezed
show_now_playing

!!!show_playlist_page
show_track_page
*/

(function() {
var baseNavUI = function() {};

createPrototype(baseNavUI, new suServView(), {
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
				state = ['top', 'bottom', 'middle'].indexOf(state) > -1 && state;
				if (state){
					this.c.addClass('stack-' + state + ' stacked');
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
	init: function(mlm) {
		this.callParentMethod('init');
		this.createBase();
		this.bindClick();
		var text_place = this.c.find('span');
		if (text_place){
			this.text_place = text_place;
		}
		this.setModel(mlm);
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

var mainLevelNavUI = function(mal) {
	this.callParentMethod('init', mal);
};
createPrototype(mainLevelNavUI, new baseNavUI(), {
	createBase: function(){
		this.c = $('<span class="nav-item nav-start" title="Seesu start page"><b></b></span>');
	}
});


var mainLevelUI = function(m_l){

	this.md = this.m_l = m_l;
	
	this.callParentMethod('init');

	this.sui = su.ui;
	this.d = su.ui.d;

	this.els = su.ui.els;
	this.nav = su.ui.nav;
	this.c = $(this.d.body);

	this.setModel(m_l);
};
createPrototype(mainLevelUI, new suServView(), {

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
		"lfm-waiting-for-finish": function(state){
			this.toggleBodyClass(state, 'lfm-waiting-for-finish');
		},
		"lfm-auth-req-recomm": function(state){
			this.toggleBodyClass(state, 'lfm-auth-req-recomm');
		},
		"lfm-auth-req-loved": function(state){
			this.toggleBodyClass(state, 'lfm-auth-req-loved');
		},
		"slice-for-height": function(state){
			this.toggleBodyClass(state, 'slice-for-height');
		},
		"deep-sandbox": function(state){
			this.toggleBodyClass(state, 'deep-sandbox');
		},
		"lfm-auth-done":function(state){
			this.toggleBodyClass(state, 'lfm-auth-done');
		},
		"flash-internet":function(state){
			this.toggleBodyClass(state, 'flash-internet');
		},
		'now-playing': function(text) {
			
			if (!this.now_playing_link && this.nav){
				this.now_playing_link = $('<a class="np"></a>').click(function(){
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
				this.changeFavicon('playing');
			} else {
				s.each(function(i, el){
					$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
				});
				this.changeFavicon('usual');
			}
		},
		"doc-title": function(title) {
			this.d.title = 	title || "";
		},
		"ask-rating-help": function(state){
			if (state){
				var spm_c = this.els.start_screen.find('.start-page-messages');
				this.message_arh_c = $('<span></span>').text('Прошу не обессудте');
				spm_c.append(message_arh_c);

				/*
				Поддержи сису — поставь оценку
				Привет, меня зовут Глеб, я создал сису и развиваю её с сентября 2009 года. Если она нравится прошу поставить оценку на %app_url% — это очень важно для меня.
				*/
			} else {
				this.message_arh_c.remove();
			}
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


mainLevel = function() {
	this.callParentMethod('init');
	this.updateState('nav-title', 'Seesu start page');

	if (app_env.check_resize){
		this.updateState('slice-for-height', true);
	}
	if (app_env.deep_sanbdox){
		this.updateState('deep-sandbox', true);
	}


	var _this = this;

	this.regDOMDocChanges(function() {
		_this.getFreeView();
		if (su.ui.nav.daddy){
			var child_ui = _this.getFreeView('nav');
			if (child_ui){
				su.ui.nav.daddy.append(child_ui.getC());
				child_ui.appended();
			} 
		}
	});

};


createPrototype(mainLevel, new suMapModel(), {
	ui_constr: {
		main: function() {
			return new mainLevelUI(this);
		},
		nav: function() {
			return new mainLevelNavUI(this);
		}
	},
	page_name: 'start page',
	nowPlaying: function(text) {
		this.updateState('now-playing', text);
	},
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
		"rating-help": function(){
			if (su.app_pages[su.env.app_type]){
				this.updateState('ask-rating-help', true);
			}
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name]){
			this.messages[message_name].call(this);
		}
	},
	setDocTitle: function(title) {
		this.updateState('doc-title', title);
	}
});


investgNavUI = function(mlm) {
	this.callParentMethod('init', mlm);
};
createPrototype(investgNavUI, new baseNavUI(), {
	createBase: function() {
		this.c = $('<span class="nav-item nav-search-results" title="Search results"><b></b></span>');
	}
});

artCardNavUI = function(mlm) {
	this.callParentMethod('init', mlm);
};
createPrototype(artCardNavUI, new baseNavUI(), {
	createBase: function() {
		this.c = $('<span class="nav-item "><span></span><b></b></span>');
	}
});


playlistNavUI = function(mlm) {
	this.callParentMethod('init', mlm);
};
createPrototype(playlistNavUI, new baseNavUI(), {
	createBase: function() {
		this.c = $('<span class="nav-item nav-playlist-page"><span></span><b></b></span>');
	}
});


trackNavUI = function(mlm) {
	this.callParentMethod('init', mlm);
};
createPrototype(trackNavUI, new baseNavUI(), {
	createBase: function() {
		this.c = $('<span class="nav-item nav-track-zoom"><span></span><b></b></span>');
	}
});




//getCurrentSearchResultsContainer
//	getSearchResultsContainer: function(){

//this.getPlaylistContainer(save_parents)
//getCurrentPlaylistContainer
views = function(su_map){
	var _this = this;
	this.m = su_map;

	this.m
		.on('title-change', function(title) {
			su.main_level.setDocTitle(title);


		})
		.on('url-change', function(nu, ou, data, replace) {
			if (replace){
				navi.replace(ou, nu, data);
			} else {
				navi.set(nu, data);
			}

			//console.log(arguments);
		})
		.on('every-url-change', function(nd, od, replace) {

			su.track_page(nd.map_level.resident.page_name);
			
		})

};
//su.ui.nav.daddy
views.prototype = {
	restoreFreezed: function(transit, url_restoring){
		this.m.restoreFreezed(transit, url_restoring);
	},

	show_now_playing: function(no_stat){
		if (!no_stat){
			seesu.track_event('Navigation', 'now playing');
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
		invstg.scratchResults(query);

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