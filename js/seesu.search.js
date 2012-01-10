(function() {
var default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';



input_change = function(e, no_navi){
	su.ui.els.search_label.removeClass('loading');
	
	var input = (e && e.target) || e; //e can be EVENT or INPUT  

	var input_value = input.value;
	if (!input_value) {
		su.ui.views.showStartPage();
		return;
	}
	
	su.ui.views.showResultsPage(input_value, no_navi);
};

var searchTags = function(q){
	var tags_results = [];
	
	var tags = searchInArray(lastfm_toptags, q);
	for (var i=0; i < tags.length; i++) {
		tags_results.push(new tagSuggest(tags[i]));
	};
	return tags_results;
};
	
var offlineSearch = $.debounce(function(q, invstg){
	var tags = invstg.g('tags');
		var r = searchTags(q);
		if (r.length){
			tags.r.append(r);
			tags.renderSuggests(r);
		}
		
},150);





var artistSuggest = function(artist, image){
	this.callParentMethod('init');
	this.artist = artist;
	this.image = image;
};
createPrototype(artistSuggest, new baseSuggest(), {
	valueOf: function(){
		return this.artist;
	},
	onView: function(){
		su.ui.views.showArtcardPage(this.artist, true)
		su.track_event('Music search', this.q, "artist: " + this.artist );
	},
	ui_constr: function(){
		return new artistSuggestUI(this);
	}
});

var artistSuggestUI = function(sugg){
	this.callParentMethod('init', sugg);
};
createPrototype(artistSuggestUI, new baseSuggestUI(), {
	createItem: function(){
		var that = this.sugg;

		var a = $("<a></a>");
		$("<img/>").attr({ src: (that.image || default_sugg_artimage), alt: that.artist })
			.appendTo(a);
		$("<span></span>").text(that.valueOf())
			.appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});






var playlistSuggest = function(pl){
	this.callParentMethod('init');
	this.pl = pl;
};
createPrototype(playlistSuggest, new baseSuggest(), {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		su.ui.views.show_playlist_page(this.pl, true);
	},
	ui_constr: function(){
		return new playlistSuggestUI(this);
	}
});




var playlistSuggestUI = function(sugg){
	this.callParentMethod('init', sugg);
};
createPrototype(playlistSuggestUI, new baseSuggestUI(), {
	createItem: function() {
		var that = this.sugg;
		this.a = $('<a></a>')
			.text(that.valueOf())
			.appendTo(this.c);
		return this;
	}
});



var trackSuggest = function(artist, track, image, duration){
	this.callParentMethod('init');
	this.artist = artist;
	this.track = track;
	this.image = image;
	if (duration){
		this.duration = duration;
	}
};
createPrototype(trackSuggest, new baseSuggest(), {
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
	ui_constr: function(){
		return new trackSuggestUI(this);
	}
});


var trackSuggestUI = function(sugg){
	this.callParentMethod('init', sugg);
};
createPrototype(trackSuggestUI, new baseSuggestUI(), {
	createItem: function(){
		var that = this.sugg;
		var a = $("<a></a>");
		
		$("<img/>").attr({ src: (that.image || default_sugg_artimage) , alt: that.artist }).appendTo(a);
		if (that.duration){
			var track_dur = parseInt(that.duration);
			var digits = track_dur % 60
			track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits )
			a.append('<span class="sugg-track-dur">' + track_dur + '</span>');
		}
		$("<span></span>").text(that.valueOf()).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});






var tagSuggest = function(tag, image){
	this.callParentMethod('init');
	this.tag = tag;
	if (image){
		this.image = image;
	}
	
};

createPrototype(tagSuggest, new baseSuggest(), {
	valueOf: function(){
		return this.tag;
	},
	onView: function(){
		su.ui.show_tag(this.tag, {save_parents: true});
		seesu.track_event('Music search', this.q, "tag: " + this.tag );
	},
	ui_constr: function(){
		return new tagSuggestUI(this);
	}
})

var tagSuggestUI = function(sugg){
	this.callParentMethod('init', sugg);
};
createPrototype(tagSuggestUI, new baseSuggestUI, {
	createItem: function() {
		var that = this.sugg;
		this.a = $("<a></a>")
			.append("<span>" + that.valueOf() + "</span>")
			.appendTo(this.c);
		return this;
	}
});



var albumSuggest = function(artist, name, image, id){
	this.callParentMethod('init');
	this.artist = artist;
	this.name = name;
	
	if (image){
		this.image = image;
	}
	if (id){
		this.aid = id;
	}
};
createPrototype(albumSuggest, new baseSuggest(), {
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
	ui_constr: function(){
		return new albumSuggestUI(this);
	}
});


var albumSuggestUI = function(sugg){
	this.callParentMethod('init', sugg);
};

createPrototype(albumSuggestUI, new baseSuggestUI(), {
	createItem: function(){
		var that = this.sugg;
		var a = $("<a></a>");
		$("<img/>").attr({ src: (this.image || default_sugg_artimage), alt: that.valueOf() }).appendTo(a);
		$("<span></span>").text(that.valueOf()).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});

var vkSuggest = function(artist, track, pl){
	this.callParentMethod('init');
	this.artist = artist;
	this.track = track;
	this.pl = pl;
};

createPrototype(vkSuggest, new baseSuggest(), {
	valueOf: function(){
		return this.artist + ' - ' +  this.track;
	},
	ui_constr: function(){
		return new vkSuggestUI(this);
	}
});


var vkSuggestUI = function(sugg) {
	this.callParentMethod('init', sugg);
};
createPrototype(vkSuggestUI, new baseSuggestUI(), {
	createItem: function(){
		$('<span class="vk-track-suggest"></span>')
			.text(this.sugg.valueOf())
			.appendTo(this.c)
		return this;
	}
});


var seesuSection = function() {};
createPrototype(seesuSection,  new searchSection(), {
	no_results_text: localize('nothing-found'),
	init: function() {
		if (this.loadMore){
			var _this = this;
			this.button = (new baseSectionButton())
				.on('view', function(){
					this.hide();
					_this.loadMore();
				})
				.on('disabled-state-change', function(state){
					_this.fire('items-change');
				});
			this.setButtonText();
		}
		this.callParentMethod('init');	
	}
});

var playlistsSectionUI = function(seasc) {
	this.callParentMethod('init', seasc);
};
createPrototype(playlistsSectionUI, new searchSectionUI, {
	head_text: localize('playlists'),
	c_class: 'sugg-section playlist-results'
});

var playlistsSection = function() {
	this.callParentMethod('init');
};
createPrototype(playlistsSection, new searchSection(), {
	ui_constr: function() {
		return 	new playlistsSectionUI(this);
	},
	resItem: playlistSuggest
});




var artistsSectionUI = function(seasc){
	this.callParentMethod('init', seasc);
};
createPrototype(artistsSectionUI, new searchSectionUI, {
	head_text: localize('Artists','Artists'),
	c_class: 'sugg-section results-suggests',

});
var artistsSection = function(){
	this.callParentMethod('init');
};
createPrototype(artistsSection, new seesuSection(), {
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
	ui_constr: function() {
		return 	new artistsSectionUI(this);
	},
	resItem: artistSuggest
});




var tracksSectionUI = function(seasc){
	this.callParentMethod('init', seasc);
};
createPrototype(tracksSectionUI, new searchSectionUI, {
	head_text: localize('Tracks','Tracks'),
	c_class: "sugg-section results-suggests"
});

var tracksSection = function() {
	this.callParentMethod('init');
};
createPrototype(tracksSection, new seesuSection(), {
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
	ui_constr: function(){
		return new tracksSectionUI(this);
	},
	resItem: trackSuggest
});



var tagsSectionUI = function(seasc) {
	this.callParentMethod('init', seasc);
};
createPrototype(tagsSectionUI, new searchSectionUI, {
	head_text: localize('Tags'),
	c_class: "sugg-section results-suggests recommend-tags"
});

var tagsSection = function() {
	this.callParentMethod('init');
};
createPrototype(tagsSection, new seesuSection(), {
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
	ui_constr: function() {
		return new tagsSectionUI(this);
	},
	resItem: tagSuggest
});

var albumsSectionUI = function(seasc) {
	this.callParentMethod('init', seasc);
};
createPrototype(albumsSectionUI, new searchSectionUI(), {
	head_text: localize('Albums', 'Albums'),
	c_class: 'sugg-section results-suggests recommend-albums'
});

var albumsSection = function() {
	this.callParentMethod('init');
};
createPrototype(albumsSection, new seesuSection(), {
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
	ui_constr: function(){
		return new albumsSectionUI(this)
	},
	resItem: albumSuggest
});


var vkSectionUI = function(seasc) {
	this.callParentMethod('init', seasc);
};
createPrototype(vkSectionUI, new searchSectionUI(), {
	head_text: 'Vkontakte'
});

var vkSection = function() {
	this.callParentMethod('init');
};
createPrototype(vkSection, new seesuSection(), {
	getButtonText: function() {
		return this.btext;
	},
	btext: localize('direct-vk-search','Search mp3  directly in vkontakte'),
	loadMore: function() {
		var query = this.r.query;
		if (query) {
			su.ui.show_track({q: query});
		}
	},
	ui_constr: function() {
		return new vkSectionUI(this)
	},
	resItem: vkSuggest
});


/*

this.addSection('vk', {
	head: 'Vkontakte',
	buttonClick: function(e, section){
		var query = section.r.query;
		if (query) {
			su.ui.show_track({q: query});
		}
	},
	button: function(){
		return $('<button type="submit" name="type" value="vk_track"><span>' + localize('direct-vk-search','Search mp3  directly in vkontakte') +'</span></button>')
	},
	nos: true
});



*/



arrows_keys_nav = function(e){
	
	var invstg = su.ui.search_el;
	
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
			if (su.ui.els.search_input.val() != q){return}
			invstg.loaded()
			fast_suggestion(r, q, invstg)
		});
		if (!cache_used) {
			invstg.addRequest(get_fast_suggests(q, function(r){	
				if (su.ui.els.search_input.val() != q){return}
				fast_suggestion(r, q, invstg)
			}, hash, invstg));
			
		}
	} 
	:
	$.debounce(function(q, invstg){
		getLastfmSuggests('artist.search', {artist: q}, q, invstg.g('artists'), parseArtistsResults);
		getLastfmSuggests('track.search', {track: q}, q, invstg.g('tracks'), parseTracksResults);
		getLastfmSuggests('tag.search', {tag: q}, q, invstg.g('tags'), parseTagsResults);	
		getLastfmSuggests('album.search', {album: q}, q, invstg.g('albums'), parseAlbumsResults);
	}, 400);
	





var vk_suggests = $.debounce(function(query, invstg){
	su.mp3_search.find_files({q: query}, 'vk', function(err, pl, c){
		c.done = true;
		pl = pl && pl[0] && pl[0].t;
		if (pl && pl.length){
			var vk_tracks = invstg.g('vk')

			pl = pl.slice(0, 3);
			for (var i=0; i < pl.length; i++) {
				pl[i] = new vk_tracks.resItem(pl[i].artist, pl[i].track);
			};
			
			vk_tracks.r.append(pl);
			vk_tracks.renderSuggests();
		}
	}, false);
},300);

createSuInvestigation = function(){
	var investg =  new investigation(function(){

		this.addSection('playlists', new playlistsSection());
		this.addSection('artists', new artistsSection());
		this.addSection('albums', new albumsSection());
		this.addSection('tags', new tagsSection());
		this.addSection('tracks', new tracksSection());
		this.addSection('vk', new vkSection());
	}, function(q){
		if (':playlists'.match(new RegExp('\^' + this.q , 'i'))){
			this.setInactiveAll('playlists');
			var pl_sec = this.g('playlists');
				pl_sec.setActive();
				pl_sec.scratchResults(this.q);
				
			
			var playlists = seesu.gena.playlists;
			var pl_results = [];
			for (var i=0; i < playlists.length; i++) {
				pl_results.push(new playlistSuggest(playlists[i]));
			};
			pl_sec.r.append(pl_results)
			pl_sec.renderSuggests(true);
		} else if (!this.q.match(/^:/)){
			this.setActiveAll('playlists');
			//playlist search
			var playlists = seesu.gena.playlists;
			var pl_results = [];
			for (var i=0; i < playlists.length; i++) {
				var ple = new playlistSuggest(playlists[i]);
				if (playlists[i].playlist_title == this.q){
					pl_results.unshift(ple);
				} else if (playlists[i].playlist_title.match(new  RegExp('\\b' + this.q))){
					 pl_results.push(ple);
				}

			};

			
			if (pl_results.length){
				var pl_sec =  this.g('playlists'); 
				
				pl_sec.setActive();
				pl_sec.r.append(pl_results)
				pl_sec.renderSuggests();
			}
			
			//===playlists search
			offlineSearch(this.q, this)
			network_search(this.q, this);
			vk_suggests(this.q, this);
		}
	});
	investg.on('stateChange', function(state){
		if (state == 'complete'){
			su.ui.els.search_label.removeClass('loading');
		} else if (state == 'loading'){
			su.ui.els.search_label.addClass('loading');
		}

	});

	return investg;
};




})();
