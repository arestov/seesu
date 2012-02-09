/*
freeze
!restoreFreezed
show_now_playing
!newBrowse
!!!show_playlist_page
show_track_page
*/


/*
setTitle: function(title){
		this.d.title = 	title || "";
	},
	Uncaught TypeError: Cannot set property 'title' of undefined
seesu_ui.setTitlejs/seesu.ui.js:432
viewsjs/seesu.ui.views.js:235
cloneObj.firejs/prototypes/serv-mvc.js:56
(anonymous function)js/libs/browse_map.js:320
createPrototype.sPropjs/libs/browse_map.js:252
createPrototype.setTitlejs/libs/browse_map.js:319
createPrototype.setCurrentNavjs/libs/browse_map.js:315
createPrototype.setNavTreejs/libs/browse_map.js:278
createPrototype.updateNavjs/libs/browse_map.js:273
createPrototype.setLevelPartActivejs/libs/browse_map.js:110
createPrototype._goDeeperjs/libs/browse_map.js:135
createPrototype.goDeeperjs/libs/browse_map.js:141
views.show_track_pagejs/seesu.ui.views.js:295
createPrototype.viewjs/su-prototypes/su-song.m.js:78
cloneObj.changeNowPlayingjs/prototypes/player.complex.js:105
_thisjs/su-prototypes/su-song.m.js:36
cloneObj.firejs/prototypes/serv-mvc.js:56
createPrototype.playjs/su-prototypes/su-mfcomplect.js:280
createPrototype.playjs/prototypes/song.m.js:113
(anonymous function)js/prototypes/player.complex.js:72




js/seesu.star-page-blocks.js:5Uncaught TypeError: Cannot call method 'replace' of undefined
seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', seesu.env.app_type));

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
			_this.mdl.zoomOut();
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
	this.m_l = m_l;
	
	this.callParentMethod('init');

	this.c = $(su.ui.d.body);

	this.setModel(m_l);
};
createPrototype(mainLevelUI, new suServView(), {

	state_change: {
		'mp-show': function(opts) {
			if (opts){
				if (opts.userwant){
					su.ui.els.search_input[0].focus();
					su.ui.els.search_input[0].select();
					seesu.track_page('start page');
				}
			} else {
				
			}
		},
		'mp-blured': function(state) {
			if (state){
				$(su.ui.els.slider).removeClass("show-start");
			} else {
				$(su.ui.els.slider).addClass("show-start");
			}
		},
		'now-playing': function(text) {
				
				if (!this.now_playing_link && su.ui.nav){
					this.now_playing_link = $('<a class="np"></a>').click(function(){
						su.ui.views.show_now_playing(true);
					}).appendTo(su.ui.nav.justhead);
				}
				if (this.now_playing_link){
					this.now_playing_link.attr('title', (localize('now-playing','Now Playing') + ': ' + text));	
				}	
		},
		playing: function(state) {
			var s = su.ui.els.pllistlevel.add(this.now_playing_link);
			if (state){
				s.addClass('player-played');
				su.ui.changeFavicon('playing')
			} else {
				s.each(function(i, el){
					$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
				});
				su.ui.changeFavicon('usual');
			}
		}
	}
});


mainLevel = function() {
	this.callParentMethod('init');
	this.updateState('nav-title', 'Seesu start page');
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
views = function(sui, su_map){
	this.sui = sui;
	var _this = this;
	this.m = su_map;

	this.m
		.on('title-change', function(title) {
			su.ui.setTitle(title);
		})
		.on('url-change', function(nu, ou, data, replace) {
			if (replace){
				navi.replace(ou, nu, data);
			} else {
				navi.set(nu, data);
			}

			console.log(arguments);
		});

};
//su.ui.nav.daddy
views.prototype = {
	sUI: function(){
		return su && su.ui || this.sui;	
	},
	restoreFreezed: function(url_restoring){
		this.m.restoreFreezed(url_restoring);
	},

	show_now_playing: function(no_stat){
		var current_page = this.sUI().els.slider.className;
		this.restoreFreezed();
		
		su.ui.views.show_track_page(su.p.c_song);
		if (!no_stat){
			seesu.track_event('Navigation', 'now playing', current_page);
		}
		
	},
	showStartPage: function(url_restoring){
		//mainaly for hash url games
		this.m.startNewBrowse(url_restoring);
	},
	showResultsPage: function(query, no_navi){
		var lev;
		if (!su.ui.search_el || !su.ui.search_el.lev.isOpened()){
			lev = this.m.goDeeper(false, createSuInvestigation());
		} else {
			lev = su.ui.search_el.lev;
		}
		
		var invstg = lev.resident;
		invstg.scratchResults(query);

	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, new artCard(artist));
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