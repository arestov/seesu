/*
freeze
!restoreFreezed
show_now_playing
!newBrowse
!!!show_playlist_page
show_track_page
*/

(function() {
var baseNavUI = function() {};

createPrototype(baseNavUI, new servView(), {
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


var mainLevelUI = function(mal){
	this.setModel(mal);
	this.callParentMethod('init');
};
createPrototype(mainLevelUI, new servView(), {

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
		}
	}
});


var mainLevel = function() {
	this.callParentMethod('init');
	this.updateState('nav-title', 'Seesu start page');

};


createPrototype(mainLevel, new mapLevelModel(), {
	onMapLevAssign: function(){
		this.getFreeView();

		if (su.ui.views.nav.daddy){
			var child_ui = this.getFreeView('nav');
			if (child_ui){
				su.ui.views.nav.daddy.append(child_ui.getC());
				child_ui.appended();
			}
		}
		/*
		if (su.ui.els.searchres){
			var child_ui = this.getFreeView();
			if (child_ui){
				su.ui.els.searchres.append(child_ui.getC());
				child_ui.appended();
			}
		}*/
	},
	ui_constr: {
		main: function() {
			return new mainLevelUI(this);
		},
		nav: function() {
			return new mainLevelNavUI(this);
		}
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	}
});
main_level = new mainLevel();

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




su_map = new browseMap(main_level);



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
//su.ui.views.nav.daddy
views.prototype = {
	setNav: function(obj){
		this.nav= obj;
		if (obj.daddy){
			obj.daddy.empty().removeClass('not-inited');
		}
		this.m.makeMainLevel();
	},
	sUI: function(){
		return su && su.ui || this.sui;	
	},
	restoreFreezed: function(url_restoring){
		this.m.restoreFreezed(url_restoring);
	},

	show_now_playing: function(){
		var current_page = this.sUI().els.slider.className;
		this.restoreFreezed();
		
		su.ui.views.show_track_page(su.p.c_song);
		seesu.track_event('Navigation', 'now playing', current_page);
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