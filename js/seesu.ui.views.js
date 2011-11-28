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
		return this.c && !this.dead && this.c[0].ownerDocument == su.ui.d;
	},
	setActive: function(stack){

		
		this.c.addClass('nnav');
		if (stack){
			this.stack('top');
		} else{
			this.resetStackMark();
		}
		
		this.show();
		this.active = true;
	},
	setInactive: function(){
		
		this.c.removeClass('nnav');
		this.resetStackMark()
		this.show();
		this.active = false;
	},
	resetStackMark: function(){
		this.onTitleChange(null);
		this.stacked = false;
		this.c.removeClass('stack-bottom stack-middle stack-top');
	},
	stack: function(place){
		this.resetStackMark();
		if (['top', 'bottom', 'middle'].indexOf(place) > -1){
			this.c.addClass('stack-' + place + ' nnav');
			this.stacked = true;
		}
		this.show();
	},
	show: function(){
		this.c.removeClass('hidden');
	},
	hide: function(){
		this.c.addClass('hidden');
		this.c.removeClass('nnav');
		this.resetStackMark();
	},
	die: function(){
		this.dead = true;
		this.c.remove();
		this.onTitleChange(null);
	},
	text: function(text){
		var old_title = this.title_text;
		
		
		if (this.text_c){
			this.text_c.text(text);
		}
		if (!this.fixed_title){
			this.title_text = this.getTitleString ? this.getTitleString(text) : text;
			this.c.attr('title', this.title_text);
		}
		if (this.lev){
			this.lev.setFullTitle(this.title_text);
		}
		if ((old_title != this.title_text) && this.titleChangeCallback){
			this.titleChangeCallback();
		}
		return this.title_text;
	},
	getTitle: function(){
		return this.title_text;	
	},
	onTitleChange: function(cb){
		if (cb){
			this.titleChangeCallback = cb;
		} else{
			delete this.titleChangeCallback;
		}
		
	},
	render: function(place){
		if (place){place.append(this.c)}
	},
	click: function(){
		if (this.click_cb){
			this.click_cb(this.stacked || this.active);
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
	this.active = true;
	this.title_text = 'Seesu';
	this.fixed_title = true;
};
mainNav.prototype = new dNav();


var sRNav = function(){
	var _this = this;
	this.c= $('<span class="nnav nav-item nav-search-results" title="Search results"><b></b></span>');
	this.c.attr('title', this.getTitleString());	
	this.active = true;
	this.c.click(function(){
		_this.click();
	});
}
sRNav.prototype = new dNav();
cloneObj(sRNav.prototype, {
	getTitleString: function(text){
		var query_regexp = /\ ?\%query\%\ ?/;
		var original = localize('Search-resuls')
		
		if (text){
			return original.replace(query_regexp, ' «' + text + '» ').replace(/^\ |\ $/gi, '');
		} else{
			var usual_text = original.replace(query_regexp, '');
			var cap = usual_text.charAt(0).toLocaleUpperCase();
			return cap + usual_text.slice(1);
		}
	}
})

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
	canUse: function(){
		return this.c && !this.dead && this.c[0].ownerDocument == su.ui.d;
	},
	setLev: function(lev){
		this.lev = lev;
		return this;	
	},
	blur: function(){return},
	D: function(key, value){
		if (!arguments.hasOwnProperty('1')){
			return this.storage && this.storage[key];
		} else {
			return this.storage && (this.storage[key] = value);
		}
	},
	isHandeled: function(key, value, set){
		var hstore = this.D('d-handeled') || this.D('d-handeled', {});
		if (!arguments.hasOwnProperty('2')){
			return hstore[key] == value;
		} else {
			return hstore[key] = value;
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
				var done = this.dataHandlers[key].call(this, value);
				done = typeof done != 'undefined' ? !!done : true;
				if (done){
					this.isHandeled(key, value, true);
				}
			}
			
		}
	}
};



var mainLevelResident = function(){
	this.canUse = false;
};
mainLevelResident.prototype = new baseLevelResident();
cloneObj(mainLevelResident.prototype, {
	hide: function(){
		console.log('want to hide main')
	},
	die: function(){
		console.log('trying to killkill main')
	},
	blur: function(){
		$(su.ui.els.slider).removeClass("show-start");
	},
	show: function(opts){
		$(su.ui.els.slider).addClass("show-start");
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
	
	die: function(){
		this.dead = true;
		this.blur();
		this.c.remove();
	},
	hide: function(){
		this.blur();
		this.c.addClass('hidden');
	},
	blur: function(){
		$(su.ui.els.slider).removeClass('show-search show-search-results')
	},
	show: function(opts){
		this.c.removeClass('hidden');
		if (opts.userwant){
			this.checkAndHandleData();	
		}
		var _s = su.ui.els.slider.className;
		var new_s = (opts.closed ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			$(su.ui.els.slider).addClass(new_s);
			su.track_page('search results');
		}
		su.ui.search_el = this;
	},
	nav: function(){
		return new sRNav();
	},
	dataHandlers: {
		q: function(query){
			if (!this.D('invstg')){
				this.D('invstg', createSuInvestigation(this.c));
			}
			this.D('invstg').lev = this.lev;
			this.D('invstg').scratchResults(query);

	
		}
	}
});

var artcardLevelResident = function(levdata){
	this.c = su.ui.samples.artcard.clone().appendTo(su.ui.els.artcards);
	this.storage = {};
	this.levdata = levdata;
};
artcardLevelResident.prototype  = new baseLevelResident();
cloneObj(artcardLevelResident.prototype ,{
	die: function(){
		this.dead = true;
		this.blur();
		this.remove();	
		
	},
	remove: function(){
		return this.c.remove();
	},
	hide: function(){
		this.blur();
		return this.c.addClass('hidden');
	},
	blur: function(){
		$(su.ui.els.slider).removeClass('show-art-card');
	},
	show: function(opts){
		if (opts.userwant){
			this.checkAndHandleData();
			su.track_page('art card');
		}
		$(su.ui.els.slider).addClass('show-art-card');
		return this.c.removeClass('hidden');
	},
	wait: function(){
		
	},
	ready: function(){
		
	},
	nav: function(){
		return new artcardNav();
	},
	dataHandlers: {
		artist: function(name){
			if (!this.ui){
				this.ui = new artcardUI(name, this.c);
			}
		}
	}
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
	die: function(){
		this.dead = true;
		this.hide();
		var pl = this.D('pl');
		if (pl){pl.die()}
		this.remove();	
	},
	remove: function(){
		return this.c.remove();
	},
	hide: function(){
		$(su.ui.els.slider).removeClass('show-player-page');
		return this.c.addClass('hidden');
	},
	show: function(opts){
		if (opts.userwant){
			this.checkAndHandleData();
			var pl = this.D('pl');
			if (pl){
				seesu.track_page('playlist', pl.playlist_type);
			}
			
		}
		
		$(su.ui.els.slider).addClass('show-player-page');
		return this.c.removeClass('hidden');
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
			/*
			if (pl.lev && pl.lev.canUse()){
				var lev = pl.lev;
					lev.sliceTillMe();
			} else{
				var lev = (pl.lev = this.m.goDeeper(save_parents, playlistLevelResident));
					lev.setTitle(pl.playlist_title);
			}
			*/
			
			pl.lev = this.lev;

			this.D('pl', pl);
			
			if (pl.ui && pl.ui != this){
				pl.ui.remove();
			}
			
			pl.ui = this;
			if (pl.loading){
				pl.ui.wait()
			}
			if (pl.length){
				su.ui.render_playlist(pl, pl.length > 1);
			}
		}
	}
});

var trackLevelResident = function(levdata){
	this.storage = {};
	this.levdata = levdata;
};
trackLevelResident.prototype = new baseLevelResident();
cloneObj(trackLevelResident.prototype, {
	canUse: function(){return true},
	die: function(){
		this.dead = true;
		this.hide();
		var mo = this.D('mo');
		if (mo){
			su.ui.remove_video();
			mo.deactivate();
		}
	},
	hide: function(){
		$(su.ui.els.slider).removeClass("show-zoom-to-track");
	},
	show: function(opts){
		if (opts.userwant){
			this.checkAndHandleData();
		}
		$(su.ui.els.slider).addClass("show-zoom-to-track");
	},
	nav: function(){
		return new trNav();
	},
	render: function(parent_resident){},
	dataHandlers: {
		mo: function(mo){
			this.D('mo', mo);
			if (mo.ui){
				mo.ui.updateSongContext(true)
			}
			mo.activate();

		}
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
		this.restoreFreezed();
		
		su.ui.views.show_track_page(su.player.c_song);
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
		if (!su.ui.search_el || !su.ui.search_el.lev.isOpened()){
			var lev = this.m.goDeeper(false, sRLevelResident);
		} else {
			var lev = su.ui.search_el.lev;
		}
		
		if (lev.D('q') != query){
			lev.setTitle(query);
			lev.D('q', query);
			lev.setURL('?q=' + query, !no_navi);
		}
	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, artcardLevelResident);
			lev.setTitle(artist);
			lev.D('artist', artist);
			
			lev.setURL('/catalog/' + artist, !no_navi);
			
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		var lev = this.m.goDeeper(save_parents, playlistLevelResident);
			lev.setTitle(pl.playlist_title);
			lev.D('pl', pl);
			lev.setURL(pl.getUrl(), !no_navi);
		return 
	},
	show_track_page: function(mo, no_navi){
		var _this = this,
			title = (mo.plst_titl.belongsToArtist(mo.artist) ? '' : (mo.artist + ' - '))  + mo.track;
		
		var pl = mo.plst_titl;
		pl.lev.sliceTillMe(true);
		var lev = this.m.goDeeper(true, trackLevelResident);
			lev.setTitle(title);
			lev.D('mo', mo);
			lev.setURL(mo.getURLPart(), !no_navi);
	}
};
})();