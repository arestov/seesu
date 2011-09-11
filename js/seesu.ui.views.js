(function() {
var dNav = function(){};
dNav.prototype = {
	canUse: function(){
		return this.c && !!this.c.parent().length && this.c[0].ownerDocument == su.ui.d;
	},
	setActive: function(){
		if (!this.active){
			this.c.addClass('nnav');
			
			this.active = true;
		}
		this.c.show();
	},
	setInactive: function(){
		if (this.active){
			this.c.removeClass('nnav');
			this.active = false;
		}
		
	},
	kill: function(){
		this.c.remove();
	},
	hide: function(){
		this.c.hide();	
	},
	text: function(text){
		this.text_c.text(text);
	},
	render: function(place){
		if (place){place.append(this.c)}
	},
	click: function(){
		if (this.click_cb){
			this.click_cb(this.active);
		}
	},
	setClickCb: function(f){
		this.click_cb = f;
	}
};
var mainNav = function(){
	var _this = this;;
	this.c= $('<span class="nnav nav-start" title="Seesu start page"><b></b></span>');
	this.c.click(function(){
		_this.click();
		//su.ui.views.show_start_page(true, true);
	})
	this.text_c = this.c.find('span');
	this.active = true;
};
mainNav.prototype = new dNav();

var plNav = function(){
	var _this = this;
	this.c= $('<span class="nnav nav-playlist-page"><span></span><b></b></span>');
	this.c.click(function(){
		_this.click();
	})
	this.text_c = this.c.find('span');
	this.active = true;
	//$('<span class="nav-title"></span>');
};
plNav.prototype = new dNav();

var sRNav = function(){
	var _this = this;
	this.c= $('<span class="nnav nav-search-results" title="Suggestions &amp; search"><b></b></span>');
	this.text_c = this.c.find('span');
	this.active = true;
	this.c.click(function(){
		_this.click();
		//su.ui.views.show_start_page(true, true);
	})
}
sRNav.prototype = new dNav();

var trNav = function(){
	this.c = $('<span class="nnav nav-track-zoom"><span></span><b></b></span>');
	this.text_c = this.c.find('span');
	this.active = true;
}
trNav.prototype =  new dNav();




var mainLevelResident = function(){	
};
mainLevelResident.prototype = {
	hide: function(){
		console.log('want to hide main')
	},
	kill: function(){
		console.log('trying to kill main')
	},
	show: function(opts){
		su.ui.els.slider.className = "show-start";
		su.ui.els.search_input[0].focus();
		su.ui.els.search_input[0].select();
		
	},
	nav: function(){
		return new mainNav();
	}
};


var sRLevelResident = function(){
	this.c = $('<div class="search-results-container current-src"></div').appendTo(su.ui.els.searchres);
	this.storage = {};
};
sRLevelResident.prototype = {
	canUse: function(){
		return this.c && !!this.c.parent().length && this.c[0].ownerDocument == su.ui.d;
	},
	kill: function(){
		this.c.remove();
	},
	hide: function(){
		this.c.hide();
	},
	show: function(opts){
		this.c.show();
		
		var _s = su.ui.els.slider.className;
		var new_s = (opts.closed ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			su.ui.els.slider.className = new_s;
			su.track_page('search results');
		}
	},
	D: function(key, value){
		if (!value){
			return this.storage[key];
		} else {
			this.storage[key] = value;
		}
	},
	nav: function(){
		return new sRNav();
	}
};



var playlistLevelResident = function(){
	this.conie = $('<div class="playlist-container"></div>').appendTo(su.ui.els.artsTracks);
	this.info_container = $('<div class="playlist-info"></div>').appendTo(this.conie),
	this.tracks_container = $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>').appendTo(this.conie);
	this.storage = {};
	
	this.conie.click(function(){
		su.ui.views.show_search_results_page(true);
		//su.ui.views.show_start_page(true, true);
	})
	
};
playlistLevelResident.prototype = {
	canUse: function(){
		return this.conie && !!this.conie.parent().length && this.conie[0].ownerDocument == su.ui.d;
	},
	kill: function(){
		var pl = this.D('pl');
		if (pl){pl.kill()}
		this.remove();	
	},
	remove: function(){
		return this.conie.remove();
	},
	hide: function(){
		return this.conie.hide()
	},
	show: function(opts){
		su.ui.els.slider.className = ' show-player-page';
	
		return this.conie.show()
	},
	wait: function(){
		this.tracks_container.addClass('loading');
	},
	ready: function(){
		this.tracks_container.removeClass('loading');
	},
	D: function(key, value){
		if (!value){
			return this.storage[key];
		} else {
			this.storage[key] = value;
		}
	},
	nav: function(){
		return new plNav();
	}
};

var trackLevelResident = function(){
	
};
trackLevelResident.prototype = {
	canUse: function(){return true},
	kill: function(){
		this.hide();
	},
	hide: function(){
		$(su.ui.els.slider).removeClass("show-zoom-to-track");
	},
	show: function(opts){
		$(su.ui.els.slider).addClass("show-zoom-to-track");
	},
	nav: function(){
		return new trNav();
	}
};


views = function(sui){
	this.sui = sui;
	var _this = this;
	this.m = su.map || (su.map = new browseMap(mainLevelResident, function(){
		return _this.nav && _this.nav.daddy;
	}));

}
views.prototype = {
	setNav: function(obj){
		this.nav= obj;
		if (obj.daddy){
			obj.daddy.empty().removeClass('not-inited');
		}
		this.m.makeMainLevel();
	},
	getCurrentSearchResultsContainer: function(){
		return this.m.getLevel(0);
	},
	getSearchResultsContainer: function(){
		return this.m.goDeeper(false, sRLevelResident);
	},
	getPlaylistContainer: function(save_parents){
		return this.m.goDeeper(save_parents, playlistLevelResident);
	},
	getCurrentPlaylistContainer: function(){
		return this.m.getLevel(1);
	},
	sUI: function(){
		return su && su.ui || this.sui;	
	},
	findViewOfURL: function(url, only_freezed, only_free){
		return this.m.findURL(1, url, only_freezed, only_free);
	},
	findSeachResultsOfURL: function(url, only_freezed, only_free){
		return this.m.findURL(0, url, only_freezed, only_free);
	},
	findViewOfSearchQuery: function(query){
		return this.m.findLevelOfSearchQuery(0, query);
	},
	findViewOfPlaylist: function(puppet, only_playing){
		return this.m.findLevelOfPlaylist(1, puppet, only_playing);
	},
	restoreFreezed: function(no_navi){
		this.m.restoreFreezed();
		var l = this.m.getLevel(1); // playlist page is 1 level
		if (l){
			this.swithToPlaylistPage(l.D('pl'), no_navi);
		}
	},

	show_now_playing: function(){
		var current_page = this.sUI().els.slider.className;
		this.restoreFreezed(true); // true is for supress navi.set
		su.player.view_song(su.player.c_song, true);
		seesu.track_event('Navigation', 'now playing', current_page);
	},
	show_start_page: function(focus_to_input, log_navigation, init, no_navi){
		var _this = this;
		// start page is -1 level
		//this.m.sliceToLevel(-1);
		
		
		
		/*
		this.nav.daddy.empty();
		this.nav.daddy.append($('<img class="nav-title" title="Seesu start page" src="i/nav/seesu-nav-logo.png"/>').click(function(){
			_this.sUI().els.search_input[0].focus();
			_this.sUI().els.search_input[0].select();
		}));
		*/
		if (init){
			
		} else if (!no_navi){
			navi.set('');
		}
		if (log_navigation){
			seesu.track_page('start page');
		}
		
		this.state = 'start';
	
	},
	newBrowse: function(){
		//mainaly for hash url games
		this.m.sliceToLevel(-1);
	},
	show_search_results_page: function(without_input, no_navi){
		var _this = this;
		// search results is 0 level
		//this.m.sliceToLevel(0);
		
		/*
		this.nav.daddy.empty();
		this.nav.daddy.append(this.nav.start.unbind().click(function(){
			_this.show_start_page(true, true);
		}));
		this.nav.daddy.append('<img class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png"/>');
		*/
		this.state = 'search_results';
		if (!no_navi){
			navi.set(this.getCurrentSearchResultsContainer().getFullURL());
		}
		
		
		
	},
	swithToPlaylistPage: function(pl, no_navi){
		// playlist page is 1 level
		var _this = this;
		
		//this.m.sliceToLevel(1);
		
		/*
		this.nav.daddy.empty();
		if (pl.with_search_results_link){
			this.nav.daddy.append(this.nav.results.unbind().click(function(){
				_this.sUI().views.show_search_results_page(true);
			}));
		} else{
			this.nav.daddy.append(this.nav.start.unbind().click(function(){
				_this.sUI().views.show_start_page(true, true);
			}));
		}
		this.nav.daddy.append('<span class="nav-title" src="i/nav/seesu-nav-search.png">' + pl.playlist_title + '</span>');
		$(this.sUI().els.nav_playlist_page).text(pl.playlist_title);
	
		*/
		this.state = 'playlist';
		
		
		
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		if (pl && !pl.ui){
			if (pl.lev){
				var lev = pl.lev;
			} else{
				var lev = (pl.lev = this.getPlaylistContainer(save_parents));
				lev.nav.text(pl.playlist_title);
			}
			
			var pl_resident = lev.getResident();
			pl_resident.D('pl', pl);
			pl.ui = pl_resident;
			if (pl.loading){
				pl.ui.wait()
			}
			pl.lev = lev;
			if (pl.length){
				this.sUI().render_playlist(pl, pl.length > 1);
			}
			
			seesu.track_page('playlist', pl.playlist_type);
			
			lev.setURL(getUrlOfPlaylist(pl));
			if (!no_navi){
				navi.set(lev.getFullURL(),{pl:pl});
			}
		}
		
		//this.swithToPlaylistPage(pl, no_navi);

	},
	show_track_page: function(title, zoom, mo, no_navi){
		var _this = this;
		
		var pl = mo.plst_titl;
		pl.lev.sliceDeeper();
		var lev = this.m.goDeeper(true, trackLevelResident);
			lev.nav.text(title);
			
		
		if (title){
			//this.sUI().els.nav_track_zoom.text(title);
		}
		
		if (zoom){
			
			this.state = 'track';
		}
		if (zoom || this.state == 'track'){
			//this.nav.daddy.empty();
			
			/*
			this.nav.daddy.append(this.nav.playlist.unbind().click(function(){
				_this.sUI().views.swithToPlaylistPage(pl);
			}));
			
			this.nav.daddy.append('<span class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png">' + title + '</span>');
			*/
		}
		
		if (!no_navi){
			navi.set(pl.lev.getFullURL() + mo.getURLPart(), {pl:pl, mo: mo});
		}
		
	}
};
})();