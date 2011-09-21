/*
freeze
!restoreFreezed
show_now_playing
!show_start_page
!newBrowse
!show_search_results_page
-swithToPlaylistPage
!!!show_playlist_page
show_track_page
*/

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
		this.c.show();
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
	this.c= $('<span class="nnav nav-item nav-start" title="Seesu start page"><b></b></span>');
	this.c.click(function(){
		_this.click();
	})
	this.text_c = this.c.find('span');
	this.active = true;
};
mainNav.prototype = new dNav();



var sRNav = function(){
	var _this = this;
	this.c= $('<span class="nnav nav-item nav-search-results" title="Suggestions &amp; search"><b></b></span>');
	this.text_c = this.c.find('span');
	this.active = true;
	this.c.click(function(){
		_this.click();
	})
}
sRNav.prototype = new dNav();


var artcardNav = function(){
	var _this = this;
	this.c = $('<span class="nnav nav-item "><span></span><b></b></span>');
	this.c.click(function(){
		_this.click();
	});
	this.text_c = this.c.find('span');
	this.active = true;
};
artcardNav.prototype = new dNav();


var plNav = function(){
	var _this = this;
	this.c= $('<span class="nnav nav-item nav-playlist-page"><span></span><b></b></span>');
	this.c.click(function(){
		_this.click();
	})
	this.text_c = this.c.find('span');
	this.active = true;
	//$('<span class="nav-title"></span>');
};
plNav.prototype = new dNav();


var trNav = function(){
	this.c = $('<span class="nnav nav-item nav-track-zoom"><span></span><b></b></span>');
	this.text_c = this.c.find('span');
	this.active = true;
}
trNav.prototype =  new dNav();


var baseLevelResident = function(){
};
baseLevelResident.prototype = {
	D: function(key, value){
		if (!arguments.hasOwnProperty('1')){
			return this.storage && this.storage[key];
		} else {
			return this.storage && (this.storage[key] = value);
		}
	},
	isHandeled: function(key, value, set){
		if (!arguments.hasOwnProperty('2')){
			return this.D('d-hadeled-' + key) == value;
		} else {
			return this.D('d-hadeled-' + key, value);
		}
	},
	checkAndHandleData: function(){
		if (this.levdata){
			for (var a in this.levdata){
				this.handleData(a, this.levdata[a]);
			}
		}
	},
	handleData: function(key, value){
		if (this.dataHandlers && this.dataHandlers[key]){
			if (!this.isHandeled(key, value)){
				if (this.dataHandlers[key].call(this, value)){
					this.isHandeled(key, value, true);
				}
			}
			
		}
	}
};



var mainLevelResident = function(){	
};
mainLevelResident.prototype = new baseLevelResident();
cloneObj(mainLevelResident.prototype, {
	hide: function(){
		console.log('want to hide main')
	},
	kill: function(){
		console.log('trying to kill main')
	},
	show: function(opts){
		su.ui.els.slider.className = "show-start";
		if (opts.userwant){
			su.ui.els.search_input[0].focus();
			su.ui.els.search_input[0].select();
			seesu.track_page('start page');
		}
	},
	nav: function(){
		return new mainNav();
	}
});


var sRLevelResident = function(levdata){
	this.c = $('<div class="search-results-container current-src"></div').appendTo(su.ui.els.searchres);
	this.storage = {};
	this.levdata = levdata;
};
sRLevelResident.prototype = new baseLevelResident();
cloneObj(sRLevelResident.prototype, {
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
		if (opts.userwant){
			this.checkAndHandleData();	
		}
		var _s = su.ui.els.slider.className;
		var new_s = (opts.closed ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			su.ui.els.slider.className = new_s;
			su.track_page('search results');
		}
	},
	nav: function(){
		return new sRNav();
	},
	dataHandlers: {
		q: function(query){
			if (!this.D('invstg')){
				this.D('invstg', new investigation(this.c));
			}
			this.D('invstg').scratchResults(query);
			return true;
		}
	}
});

var artcardLevelResident = function(levdata){
	this.c = $('<div><div>').appendTo(su.ui.els.artcards);
	this.storage = {};
	this.levdata = levdata;
};
artcardLevelResident.prototype  = new baseLevelResident();
cloneObj(artcardLevelResident.prototype ,{
	canUse: function(){
		return this.c && !!this.c.parent().length && this.c[0].ownerDocument == su.ui.d;
	},
	kill: function(){
		this.remove();	
	},
	remove: function(){
		return this.c.remove();
	},
	hide: function(){
		return this.c.hide()
	},
	show: function(opts){
		if (opts.userwant){
			this.checkAndHandleData();
		}
		su.ui.els.slider.className = 'show-art-card';
		return this.c.show()
	},
	wait: function(){
		
	},
	ready: function(){
		
	},
	nav: function(){
		//return new plNav();
	},
	dataHandlers: {}
});


var playlistLevelResident = function(levdata){
	this.c = $('<div class="playlist-container"></div>').appendTo(su.ui.els.artsTracks);
	this.info_container = $('<div class="playlist-info"></div>').appendTo(this.c),
	this.tracks_container = $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>').appendTo(this.c);
	this.storage = {};
	this.levdata = levdata;

	
};
playlistLevelResident.prototype  = new baseLevelResident();
cloneObj(playlistLevelResident.prototype, {
	canUse: function(){
		return this.c && !!this.c.parent().length && this.c[0].ownerDocument == su.ui.d;
	},
	kill: function(){
		var pl = this.D('pl');
		if (pl){pl.kill()}
		this.remove();	
	},
	remove: function(){
		return this.c.remove();
	},
	hide: function(){
		return this.c.hide()
	},
	show: function(opts){
		if (opts.userwant){
			this.checkAndHandleData();
			var pl = this.D('pl');
			if (pl){
				seesu.track_page('playlist', pl.playlist_type);
			}
			
		}
		
		su.ui.els.slider.className = ' show-player-page';
		return this.c.show()
	},
	wait: function(){
		this.tracks_container.addClass('loading');
	},
	ready: function(){
		this.tracks_container.removeClass('loading');
	},
	nav: function(){
		return new plNav();
	},
	dataHandlers: {
		pl: function(pl){
			this.D('pl', pl);
			pl.ui = this;
			if (pl.loading){
				pl.ui.wait()
			}
			if (pl.length){
				su.ui.render_playlist(pl, pl.length > 1);
			}
			return true;
		}
	}
});

var trackLevelResident = function(){
	
};
trackLevelResident.prototype = new baseLevelResident();
cloneObj(trackLevelResident.prototype, {
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
});

//getCurrentSearchResultsContainer
//	getSearchResultsContainer: function(){

//this.getPlaylistContainer(save_parents)
//getCurrentPlaylistContainer
views = function(sui){
	this.sui = sui;
	var _this = this;
	this.m = su.map || (su.map = new browseMap(mainLevelResident, function(){
		return su.ui.views.nav && su.ui.views.nav.daddy;
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
	sUI: function(){
		return su && su.ui || this.sui;	
	},
	restoreFreezed: function(no_navi){
		this.m.restoreFreezed();
	},

	show_now_playing: function(){
		var current_page = this.sUI().els.slider.className;
		this.restoreFreezed(true); // true is for supress navi.set
		su.player.view_song(su.player.c_song, true);
		seesu.track_event('Navigation', 'now playing', current_page);
	},
	
	show_start_page: function(focus_to_input, log_navigation, init, no_navi){
		//DEP
		var _this = this;
		if (init){
			
		} else if (!no_navi){
		//	navi.set('');
		}
	
		this.state = 'start';
	
	},
	showStartPage: function(no_navi){
		//mainaly for hash url games
		this.m.startNewBrowse(!no_navi);
	},
	showResultsPage: function(query, no_navi){
		if (!su.ui.search_el || !su.ui.search_el.isOpened()){
			su.ui.search_el = this.m.goDeeper(false, sRLevelResident);
		}
		var search_view = su.ui.search_el;
		if (search_view.D('q') != query){
			search_view.D('q', query);
			search_view.setURL('?q=' + query, !no_navi, {q: query});
		}
	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, artcardLevelResident);
			lev.setTitle(artist);
			lev.D('artist', artist);
		
			
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		if (pl.lev && pl.lev.canUse()){
			var lev = pl.lev;
				lev.sliceTillMe();
		} else{
			var lev = (pl.lev = this.m.goDeeper(save_parents, playlistLevelResident));
				lev.setTitle(pl.playlist_title);
		}
		pl.lev = lev;
		lev.D('pl', pl);
		
		lev.setURL(pl.getUrl(), !no_navi, {pl: pl});
		return 
	},
	show_track_page: function(title, zoom, mo, no_navi){
		var _this = this;
		
		var pl = mo.plst_titl;
		pl.lev.sliceTillMe(true);
		var lev = this.m.goDeeper(true, trackLevelResident);
			lev.setTitle(title);
			lev.setURL(mo.getURLPart(), !no_navi, {mo: mo});
	}
};
})();