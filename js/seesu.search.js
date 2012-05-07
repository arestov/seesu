var inputChange;

(function() {
var 
	default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';

inputChange = function(input_value, label, no_navi){
	label.removeClass('loading');

	if (!input_value) {
		su.views.showStartPage();
	} else {
		su.views.showResultsPage(input_value, no_navi);
	}
};


var searchTags = function(q){
	var tags_results = [];
	
	var tags = searchInArray(lastfm_toptags, q);
	for (var i=0; i < tags.length; i++) {
		tags_results.push({
			tag: tags[i]
		});
	}
	return tags_results;
};
	
var offlineSearch = debounce(function(q, invstg){
	var tags = invstg.g('tags');
		var r = searchTags(q);
		if (r.length){
			tags.appendResults(r);
			tags.renderSuggests(r);
		}
		
},150);





var artistSuggest = function(data){
	//artist, image
	this.init();
	this.artist = data.artist;
	this.image = data.image;
};


var artistSuggestUI = function(sugg){};

baseSuggestUI.extendTo(artistSuggestUI, {
	createItem: function(){
		var that = this.md;

		var a = $("<a></a>");
		$("<img/>").attr({ src: (that.image || default_sugg_artimage), alt: that.artist })
			.appendTo(a);
		$("<span></span>").text(that.valueOf())
			.appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});

baseSuggest.extendTo(artistSuggest, {
	valueOf: function(){
		return this.artist;
	},
	onView: function(){
		su.views.showArtcardPage(this.artist, true);
		su.track_event('Music search', this.q, "artist: " + this.artist );
	},
	ui_constr: artistSuggestUI
});









var playlistSuggestUI = function(sugg){};
baseSuggestUI.extendTo(playlistSuggestUI, {
	createItem: function() {
		var that = this.md;
		this.a = $('<a></a>')
			.text(that.valueOf())
			.appendTo(this.c);
		return this;
	}
});


var playlistSuggest = function(pl){
	this.init();
	this.pl = pl;
};
baseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		su.views.showStaticPlaylist(this.pl, true);
	},
	ui_constr: playlistSuggestUI
});
















var seesuSection = function() {};
searchSection.extendTo(seesuSection, {
	no_results_text: localize('nothing-found'),
	init: function() {
		this._super();
		if (this.loadMore){
			var _this = this;
			this.button = (new baseSectionButton())
				.on('view', function(){
					this.hide();
					_this.loadMore();
				})
				.on('disabled-state-change', function(state){
					_this.trigger('items-change');
				});
			this.setButtonText();
		}
	}
});

var playlistsSectionUI = function(seasc) {};
searchSectionUI.extendTo(playlistsSectionUI, {
	head_text: localize('playlists'),
	c_class: 'sugg-section playlist-results'
});

var playlistsSection = function() {
	this.init();
};
searchSection.extendTo(playlistsSection, {
	ui_constr: playlistsSectionUI,
	resItem: playlistSuggest
});




var artistsSectionUI = function(seasc){};

searchSectionUI.extendTo(artistsSectionUI, {
	head_text: localize('Artists','Artists'),
	c_class: 'sugg-section results-suggests'
});
var artistsSection = function(){
	this.init();
};

seesuSection.extendTo(artistsSection, {
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» ' + localize('oartists', 'artists');
		} else{
			return localize('to-search', 'Search ') + ( q ? ('«' + q + '» ') : "" ) + localize('in-artists','in artists');
		}
	},
	loadMore: function() {
		var q = this.r.query;
		if (q) {
			getLastfmSuggests('artist.search', {artist: q}, q, this, parseArtistsResults, true);
		}
	},
	ui_constr: artistsSectionUI,
	resItem: artistSuggest
});


var trackSuggestUI = function(sugg){};
baseSuggestUI.extendTo(trackSuggestUI, {
	createItem: function(){
		var that = this.md;
		var a = $("<a></a>");
		
		$("<img/>").attr({ src: (that.image || default_sugg_artimage) , alt: that.artist }).appendTo(a);
		if (that.duration){
			var track_dur = parseInt(that.duration);
			var digits = track_dur % 60;
			track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			a.append('<span class="sugg-track-dur">' + track_dur + '</span>');
		}
		$("<span></span>").text(that.valueOf()).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});


var trackSuggest = function(data){
	//artist, track, image, duration
	this.init();
	this.artist = data.artist;
	this.track = data.track;
	this.image = data.image;
	if (data.duration){
		this.duration = data.duration;
	}
};
baseSuggest.extendTo(trackSuggest, {
	valueOf: function(){
		return this.artist + ' - ' + this.track;
	},
	onView: function(){
		su.ui.showTopTacks(this.artist, {save_parents: true}, {
			artist: this.artist,
			track: this.track
		});

		seesu.track_event('Music search', this.q, "track: " + this.artist + ' - ' + this.track );
	},
	ui_constr: trackSuggestUI
});



var tracksSectionUI = function(seasc){};
searchSectionUI.extendTo(tracksSectionUI, {
	head_text: localize('Tracks','Tracks'),
	c_class: "sugg-section results-suggests"
});

var tracksSection = function() {
	this.init();
};
seesuSection.extendTo(tracksSection, {
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('otracks', 'tracks');
		} else{
			return localize('to-search', 'Search ') + ( q ? ('«' + q + '» ') : "" ) +localize('in-tracks','in tracks');
		}
	},
	loadMore: function() {
		var q = this.r.query;
		if (q) {
			getLastfmSuggests('track.search', {track: q}, q, this, parseTracksResults, true);
		}
	},
	ui_constr: tracksSectionUI,
	resItem: trackSuggest
});






var tagSuggestUI = function(sugg){};
baseSuggestUI.extendTo(tagSuggestUI,  {
	createItem: function() {
		var that = this.md;
		this.a = $("<a></a>")
			.append("<span>" + that.valueOf() + "</span>")
			.appendTo(this.c);
		return this;
	}
});


var tagSuggest = function(data){
	this.init();
	this.tag = data.tag;
	if (data.image){
		this.image = data.image;
	}
	
};

baseSuggest.extendTo(tagSuggest, {
	valueOf: function(){
		return this.tag;
	},
	onView: function(){
		su.ui.show_tag(this.tag, {save_parents: true});
		seesu.track_event('Music search', this.q, "tag: " + this.tag );
	},
	ui_constr: tagSuggestUI
});



var tagsSectionUI = function(seasc) {};
searchSectionUI.extendTo(tagsSectionUI, {
	head_text: localize('Tags'),
	c_class: "sugg-section results-suggests recommend-tags"
});

var tagsSection = function() {
	this.init();
};
seesuSection.extendTo(tagsSection, {
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('otags', 'tags');
		} else{
			return localize('to-search', 'Search ') + ( q ? ('«' + q + '» ') : "" ) +localize('in-tags' , 'in tags');
		}
	},
	loadMore: function() {
		var q = this.r.query;
		if (q) {
			getLastfmSuggests('tag.search', {tag: q}, q, this, parseTagsResults, true);
		}
	},
	ui_constr: tagsSectionUI,
	resItem: tagSuggest
});







var albumSuggestUI = function(sugg){};

baseSuggestUI.extendTo(albumSuggestUI, {
	createItem: function(){
		var that = this.md;
		var a = $("<a></a>");
		$("<img/>").attr({ src: (that.image || default_sugg_artimage), alt: that.valueOf() }).appendTo(a);
		$("<span></span>").text(that.valueOf()).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});


var albumSuggest = function(data){
	this.init();

	//artist, name, image, id
	this.artist = data.artist;
	this.name = data.album;
	
	if (data.image){
		this.image = data.image;
	}
	if (data.resid){
		this.aid = data.resid;
	}
};
baseSuggest.extendTo(albumSuggest, {
	valueOf: function(){
		return '( ' + this.artist + ' ) ' + this.name;
	},
	onView: function(){
		su.ui.showAlbum({
			artist: this.artist,
			album_name: this.name,
			album_id: this.aid
		}, {save_parents: true});
		seesu.track_event('Music search', this.q, "album: " + this.valueOf());
	},
	ui_constr: albumSuggestUI
});


var albumsSectionUI = function(seasc) {};
searchSectionUI.extendTo(albumsSectionUI, {
	head_text: localize('Albums', 'Albums'),
	c_class: 'sugg-section results-suggests recommend-albums'
});

var albumsSection = function() {
	this.init();
};
seesuSection.extendTo(albumsSection, {
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('oalbums', 'albums');
		} else{
			return localize('to-search', 'Search ') + ( q ? ('«' + q + '» ') : "" ) +localize('in-albums' , 'in albums');
		}
	},
	loadMore: function() {
		var q = this.r.query;
		if (q) {
			getLastfmSuggests('album.search', {'album': q}, q, this, parseAlbumsResults, true);
		}
	},
	ui_constr: albumsSectionUI,
	resItem: albumSuggest
});





arrows_keys_nav = function(e){
	
	var invstg = su.search_el;
	
	if (invstg){
		var _key = e.keyCode;
		if (_key == '13'){
			e.preventDefault();
			invstg.pressEnter();
		} else 
		if((_key == '40') || (_key == '63233')){
			e.preventDefault();
			invstg.selectEnterItemAbove();
		} else 
		if((_key == '38') || (_key == '63232')){
			e.preventDefault();
			invstg.selectEnterItemBelow();
		}
	}
	
};



var network_search = seesu.env.cross_domain_allowed ? 
	function(q, invstg){
		invstg.loading();
		var hash = hex_md5(q);
		var cache_used = cache_ajax.get('lfm_fs', hash, function(r){
			if (su.ui.els.search_input.val() != q){return;}
			invstg.loaded();
			fast_suggestion(r, q, invstg);
		});
		if (!cache_used) {
			get_fast_suggests(q, function(r){	
				if (su.ui.els.search_input.val() != q){return;}
				fast_suggestion(r, q, invstg);
			}, hash, invstg);
			
		}
	} 
	:
	debounce(function(q, invstg){
		getLastfmSuggests('artist.search', {artist: q}, q, invstg.g('artists'), parseArtistsResults);
		getLastfmSuggests('track.search', {track: q}, q, invstg.g('tracks'), parseTracksResults);
		getLastfmSuggests('tag.search', {tag: q}, q, invstg.g('tags'), parseTagsResults);	
		getLastfmSuggests('album.search', {album: q}, q, invstg.g('albums'), parseAlbumsResults);
	}, 400);
	






var SuInvestg = function() {
	this.init();
};
investigation.extendTo(SuInvestg, {
	init: function() {
		this._super();
		this.addSection('playlists', new playlistsSection());
		this.addSection('artists', new artistsSection());
		this.addSection('albums', new albumsSection());
		this.addSection('tags', new tagsSection());
		this.addSection('tracks', new tracksSection());
	},
	searchf: function(q) {
		var playlists = seesu.gena.playlists,
			pl_results = [],
			pl_sec,
			i;
		if (':playlists'.match(new RegExp('\^' + this.q , 'i'))){
			this.setInactiveAll('playlists');
			pl_sec = this.g('playlists');
			pl_sec.setActive();
			pl_sec.scratchResults(this.q);

			for (i=0; i < playlists.length; i++) {
				pl_results.push(new playlistSuggest(playlists[i]));
			}
			pl_sec.appendResults(pl_results);
			pl_sec.renderSuggests(true);
		} else if (!this.q.match(/^:/)){
			this.setActiveAll('playlists');
			//playlist search
			

			var serplr = su.searchPlaylists(this.q);
			if (serplr.length){
				for (var i = 0; i < serplr.length; i++) {
					pl_results.push(new playlistSuggest(serplr[i]));
				}
			}
			
			if (pl_results.length){
				pl_sec =  this.g('playlists'); 
				
				pl_sec.setActive();
				pl_sec.appendResults(pl_results);
				pl_sec.renderSuggests();
			}
			
			//===playlists search
			offlineSearch(this.q, this);
			network_search(this.q, this);
		}
	}
});
createSuInvestigation = function(){
	/*
	investg.on('stateChange', function(state){
		if (state == 'complete'){
			su.ui.els.search_label.removeClass('loading');
		} else if (state == 'loading'){
			su.ui.els.search_label.addClass('loading');
		}

	});
	*/
	return new SuInvestg();
	//return investg;
};




})();
