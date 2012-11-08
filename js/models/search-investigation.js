var 
	investigation,
	baseSuggest,
	baseSectionButton,
	searchSection,
	SearchPage;



(function() {
"use strict";


var suParseArtistsResults = function(r, item_constr, method) {
	return parseArtistsResults.apply(this, arguments);
};

var suParseTracksResults = function(r, item_constr, method) {
	return parseTracksResults.apply(this, arguments);
};
var suParseTagsResults = parseTagsResults;
var suParseAlbumsResults = parseAlbumsResults;

baseSuggest = function(){};
provoda.extendFromTo('baseSuggest', provoda.Model, baseSuggest);



baseSectionButton = function(){
	this.init();
};
provoda.extendFromTo('baseSectionButton', baseSuggest, baseSectionButton);


searchSection = function(){};
provoda.extendFromTo("searchSection", provoda.Model, searchSection);


var artistSuggest = function(data){
	//artist, image
	this.init();
	this.artist = data.artist;
	this.image = data.image;
	this.text_title = this.getTitle();
};




baseSuggest.extendTo(artistSuggest, {
	valueOf: function(){
		return this.artist;
	},
	onView: function(){
		su.showArtcardPage(this.artist, {
			page_md: this.invstg,
			source_md: this
		});
		su.trackEvent('Music search', this.q, "artist: " + this.artist );
	}
});


var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.text_title = this.getTitle();
};
baseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		su.showStaticPlaylist(this.pl, {
			page_md: this.invstg,
			source_md: this
		});
	}
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
				.on('state-change.disabled', function(e){
					_this.trigger('items-change');
				});
			this.setButtonText();
			this.setChild('button', this.button);
		}
	}
});


var playlistsSection = function() {
	this.init();
};
searchSection.extendTo(playlistsSection, {
	model_name: 'section-playlist',
	resItem: playlistSuggest
});





var artistsSection = function(){
	this.init();
};

seesuSection.extendTo(artistsSection, {
	model_name: 'section-artist',
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
			getLastfmSuggests('artist.search', {artist: q}, q, this, suParseArtistsResults, true);
		}
	},
	resItem: artistSuggest
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
	this.text_title = this.getTitle();
};
baseSuggest.extendTo(trackSuggest, {
	valueOf: function(){
		return this.artist + ' - ' + this.track;
	},
	onView: function(){
		su.showTopTacks(this.artist, {
			source_info: {
				page_md: this.invstg,
				source_md: this
			}
		}, {
			artist: this.artist,
			track: this.track
		});

		seesu.trackEvent('Music search', this.q, "track: " + this.artist + ' - ' + this.track );
	}
});





var tracksSection = function() {
	this.init();
};
seesuSection.extendTo(tracksSection, {
	model_name: 'section-track',
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
			getLastfmSuggests('track.search', {track: q}, q, this, suParseTracksResults, true);
		}
	},
	resItem: trackSuggest
});








var tagSuggest = function(data){
	this.init();
	this.tag = data.tag;
	if (data.image){
		this.image = data.image;
	}
	this.text_title = this.getTitle();
};

baseSuggest.extendTo(tagSuggest, {
	valueOf: function(){
		return this.tag;
	},
	onView: function(){
		su.show_tag(this.tag, {
			source_info: {
				page_md: this.invstg,
				source_md: this
			}
		});
		seesu.trackEvent('Music search', this.q, "tag: " + this.tag );
	}
});



var tagsSection = function() {
	this.init();
};
seesuSection.extendTo(tagsSection, {
	model_name: 'section-tag',
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
			getLastfmSuggests('tag.search', {tag: q}, q, this, suParseTagsResults, true);
		}
	},
	resItem: tagSuggest
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
	this.text_title = this.getTitle();
};
baseSuggest.extendTo(albumSuggest, {
	valueOf: function(){
		return '( ' + this.artist + ' ) ' + this.name;
	},
	onView: function(){
		su.showAlbum({
			artist: this.artist,
			album_name: this.name,
			album_id: this.aid
		}, {
			source_info: {
				page_md: this.invstg,
				source_md: this
			}
		});
		seesu.trackEvent('Music search', this.q, "album: " + this.text_title);
	}
});


var albumsSection = function() {
	this.init();
};
seesuSection.extendTo(albumsSection, {
	model_name: 'section-album',
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
			getLastfmSuggests('album.search', {'album': q}, q, this, suParseAlbumsResults, true);
		}
	},
	resItem: albumSuggest
});



investigation = function(){};
provoda.extendFromTo('Investigation', mapLevelModel, investigation);


SearchPage = function() {};
investigation.extendTo(SearchPage, {
	init: function() {
		this._super();
		this.addSection('playlists', new playlistsSection());
		this.addSection('artists', new artistsSection());
		this.addSection('albums', new albumsSection());
		this.addSection('tags', new tagsSection());
		this.addSection('tracks', new tracksSection());
		this.updateState('mp-freezed', false);
		
	},
	complex_states: {
		"needs-search-from": {
			depends_on: ['mp-freezed'],
			fn: function(frzd) {
				return !frzd
			}
		}
	},
	key_name_nav: {
		'Enter': function() {
			this.pressEnter();
		},
		"Up": function() {
			this.selectEnterItemAbove();
		},
		"Down": function() {
			this.selectEnterItemBelow();
		}
	},
	getURL: function() {
		return '?q=' + encodeURIComponent(this.q || '');
	},
	searchf: function() {
		var playlists = seesu.gena.playlists,
			pl_results = [],
			pl_sec,
			i;
		if (':playlists'.match(new RegExp('\^' + this.q , 'i'))){
			this.setInactiveAll('playlists');
			pl_sec = this.g('playlists');
			pl_sec.setActive();
			pl_sec.changeQuery(this.q);


			var serplr = su.getPlaylists();
			if (serplr.length){
				for (var i = 0; i < serplr.length; i++) {
					pl_results.push({
						playlist: serplr[i]
					});
				}
			}

			pl_sec.appendResults(pl_results);
			pl_sec.renderSuggests(true);
		} else if (!this.q.match(/^:/)){
			this.setActiveAll('playlists');
			//playlist search
			

			var serplr = su.getPlaylists(this.q);
			if (serplr.length){
				for (var i = 0; i < serplr.length; i++) {
					pl_results.push({
						playlist: serplr[i]
					});
				}
			}
			
			if (pl_results.length){
				pl_sec =  this.g('playlists'); 
				
				pl_sec.setActive();
				pl_sec.appendResults(pl_results);
				pl_sec.renderSuggests(true);
			}
			
			//===playlists search
			this.searchOffline(this.q);
			this.searchNetwork(this.q);
		}
	},
	searchOffline: debounce(function(q){
		var tags = this.g('tags');
		var r = this.searchTags(q);
		if (r.length){
			tags.appendResults(r);
			tags.renderSuggests(r);
		}
			
	},150),
	searchTags: function(q){
		var tags_results = [];
		
		var tags = searchInArray(lastfm_toptags, q);
		for (var i=0; i < tags.length; i++) {
			tags_results.push({
				tag: tags[i]
			});
		}
		return tags_results;
	},
	searchNetwork: seesu.env.cross_domain_allowed ? 
		function(q){
			var _this = this;
			this.loading();
			var hash = hex_md5(q);
			var cache_used = cache_ajax.get('lfm_fs', hash, function(r){
				
				_this.loaded();
				fast_suggestion(r, q, _this);
			});
			if (!cache_used) {
				var all_parts = [this.g('artists'), this.g('tracks'), this.g('tags'), this.g('albums')];
				$.each(all_parts, function(i, el) {
					el.loading();
				});
				get_fast_suggests(q, function(r){	
					$.each(all_parts, function(i, el) {
						el.loaded();
					});
					fast_suggestion(r, q, _this);
				}, hash, this);
				
			}
		} 
		:
		debounce(function(q){
			getLastfmSuggests('artist.search', {artist: q}, q, this.g('artists'), suParseArtistsResults);
			getLastfmSuggests('track.search', {track: q}, q, this.g('tracks'), suParseTracksResults);
			getLastfmSuggests('tag.search', {tag: q}, q, this.g('tags'), suParseTagsResults);	
			getLastfmSuggests('album.search', {album: q}, q, this.g('albums'), suParseAlbumsResults);
		}, 400),
	getTitleString: function(text){
		var original = localize('Search-resuls');
		
		if (text){
			return original.replace(this.query_regexp, ' «' + text + '» ').replace(/^\ |\ $/gi, '');
		} else{
			var usual_text = original.replace(this.query_regexp, '');
			var cap = usual_text.charAt(0).toLocaleUpperCase();
			return cap + usual_text.slice(1);
		}
	}
});

})();
