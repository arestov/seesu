define(['pv', 'js/modules/lfmhelp', 'app_serv', 'spv', 'cache_ajax', 'hex_md5', 'js/lastfm_data', 'js/libs/BrowseMap', './Investigation'],
function(pv, lfmhelp, app_serv, spv, cache_ajax, hex_md5, lastfm_data, BrowseMap, base) {
"use strict";
var pvUpdate = pv.update;

var suParseArtistsResults = function() {
	return lfmhelp.parseArtistsResults.apply(this, arguments);
};

var suParseTracksResults = function() {
	return lfmhelp.parseTracksResults.apply(this, arguments);
};
var suParseTagsResults = lfmhelp.parseTagsResults;
var suParseAlbumsResults = lfmhelp.parseAlbumsResults;

var artistSuggest = spv.inh(base.BaseSuggest, {
	init: function(self, opts, data) {
		self.artist = data.artist;
		self.image = data.image;
		self.text_title = self.getTitle();
		self.updateManyStates({
			artist: data.artist,
			image: data.image,
			text_title: self.text_title
		});
	}
}, {
	valueOf: function(){
		return this.artist;
	},
	onView: function(){
		this.app.showArtcardPage(this.artist, this.invstg);
		this.app.trackEvent('Music search', this.q, "artist: " + this.artist );
	}
});

var playlistSuggest = spv.inh(base.BaseSuggest, {
	init: function(self, opts, data) {
		self.pl = data.playlist;
		self.text_title = self.getTitle();
		self.updateManyStates({
			text_title: self.text_title
		});
	}
}, {
	valueOf: function(){
		return this.pl.state('nav_title');
	},
	onView: function(){
		this.pl.showOnMap();
	}
});

var seesuSection = spv.inh(base.SearchSection, {
	init: function(self) {
		if (self.loadMore){

			self.button = self.initSi(base.BaseSectionButton)
				.on('view', function(){
					this.hide();
					self.loadMore();
				})
				.on('state_change-disabled', function(){
					self.trigger('items-change');
				}, {skip_reg: true});
			pv.updateNesting(self, 'button', self.button);
		}

	}
}, {
	'compx-button_text': [
		['any_results', 'query', '#locales.fine-more', '#locales.to-search', 'results_desc_yes', 'results_desc_no'],
		function(have_results, q, lo_fine_more, lo_to_search, results_desc_yes, results_desc_no) {
			if (!lo_fine_more || !lo_to_search) {return;}

			if (have_results) {
				return (lo_fine_more || 'find more') + ' «' + q + '» ' + results_desc_yes;
			} else {
				return (lo_to_search || 'Search ') + ( q ? ('«' + q + '» ') : "" ) + results_desc_no;
			}
		}
	],

	no_results_text: true,
	'compx-no_results_text': [
		['#locales.nothing-found', 'has_no_results'],
		function(desc, no_results) {
			return no_results && desc;
		}
	]
});

var PlaylistsSection = spv.inh(base.SearchSection, {}, {
	'compx-section_title': [['#locales.playlists']],
	model_name: 'section-playlist',
	resItem: playlistSuggest
});

var ArtistsSection = spv.inh(seesuSection, {}, {
	'compx-section_title': [['#locales.Artists']],
	model_name: 'section-artist',
	'compx-results_desc_yes': [['#locales.oartists']],
	'compx-results_desc_no':  [['#locales.in-artists']],
	loadMore: function() {
		var q = this.r.query;
		if (q) {
			lfmhelp.getLastfmSuggests(this.app, 'artist.search', {artist: q}, q, this, suParseArtistsResults, true);
		}
	},
	resItem: artistSuggest
});



var trackSuggest = spv.inh(base.BaseSuggest, {
	init: function(self, opts, data) {
		//artist, track, image, duration
		self.artist = data.artist;
		self.track = data.track;
		self.image = data.image;
		pvUpdate(self, 'artist', data.artist);
		pvUpdate(self, 'track', data.track);
		if (self.image){
			pvUpdate(self, 'image', data.image);
		}


		if (data.duration){
			self.duration = data.duration;
			var track_dur = parseInt(self.duration, 10);
			var digits = track_dur % 60;
			track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			pvUpdate(self, 'duration_text', track_dur);
		}
		self.text_title = self.getTitle();
		pvUpdate(self, 'text_title', self.text_title);
	}
}, {
	valueOf: function(){
		return this.artist + ' - ' + this.track;
	},
	onView: function(){
		this.app.showArtistTopTracks(this.artist, this.invstg, {
			artist: this.artist,
			track: this.track
		});

		this.app.trackEvent('Music search', this.q, "track: " + this.artist + ' - ' + this.track );
	}
});





var TracksSection = spv.inh(seesuSection, {}, {
	'compx-section_title': [['#locales.Tracks']],
	model_name: 'section-track',

	'compx-results_desc_yes': [['#locales.otracks']],
	'compx-results_desc_no':  [['#locales.in-tracks']],

	loadMore: function() {
		var q = this.r.query;
		if (q) {
			lfmhelp.getLastfmSuggests(this.app, 'track.search', {track: q}, q, this, suParseTracksResults, true);
		}
	},
	resItem: trackSuggest
});

var tagSuggest = spv.inh(base.BaseSuggest, {
	init: function(self, opts, data) {
		self.tag = data.tag;
		self.image = null;
		if (data.image){
			self.image = data.image;
		}
		self.text_title = self.getTitle();

		self.updateManyStates({
			tag: data.tag,
			image: data.image,
			text_title: self.text_title
		});
	}
}, {
	valueOf: function(){
		return this.tag;
	},
	onView: function(){
		this.app.show_tag(this.tag, this.invstg);
		this.app.trackEvent('Music search', this.q, "tag: " + this.tag );
	}
});


var TagsSection = spv.inh(seesuSection, {}, {
	'compx-section_title': [['#locales.Tags']],
	model_name: 'section-tag',

	'compx-results_desc_yes': [['#locales.otags']] ,
	'compx-results_desc_no':  [['#locales.in-tags']],

	loadMore: function() {
		var q = this.r.query;
		if (q) {
			lfmhelp.getLastfmSuggests(this.app, 'tag.search', {tag: q}, q, this, suParseTagsResults, true);
		}
	},
	resItem: tagSuggest
});

var albumSuggest = spv.inh(base.BaseSuggest, {
	init: function(self, opts, data) {
		//artist, name, image, id
		self.artist = data.artist;
		self.name = data.album;
		pvUpdate(self, 'artist', data.artist);
		pvUpdate(self, 'name', data.album);

		self.image = null;
		if (data.image){
			self.image = data.image;
			pv.update(self, 'image', data.image);
		}
		if (data.resid){
			self.aid = data.resid;
		}
		self.text_title = self.getTitle();
		pvUpdate(self, 'text_title', self.text_title);
	}
}, {
	valueOf: function(){
		return '( ' + this.artist + ' ) ' + this.name;
	},
	onView: function(){
		this.app.showArtistAlbum({
			album_artist: this.artist,
			album_name: this.name,
			album_id: this.aid
		}, this.invstg);
		this.app.trackEvent('Music search', this.q, "album: " + this.text_title);
	}
});

var AlbumsSection = spv.inh(seesuSection, {}, {
	'compx-section_title': [['#locales.Albums']],
	model_name: 'section-album',

	'compx-results_desc_yes': [['#locales.oalbums']],
	'compx-results_desc_no':  [['#locales.in-albums']],

	loadMore: function() {
		var q = this.r.query;
		if (q) {
			lfmhelp.getLastfmSuggests(this.app, 'album.search', {'album': q}, q, this, suParseAlbumsResults, true);
		}
	},
	resItem: albumSuggest
});

var SearchPage = spv.inh(base.Investigation, {}, {
	// init: function(){
	// 	this._super.apply(this, arguments);
	// 	pv.update(this, 'mp_detailed', false);
	// },


	// init: function(opts) {
	// 	this._super.apply(this, arguments);

	// },
	'compx-focused': [
		['focused', 'mp_has_focus'],
		function (focused, mp_has_focus){
			return focused || mp_has_focus;
		}
	],
	'compx-mp_detailed': [
		['mp_detailed', 'mp_show', 'focused', 'mp_has_focus'],
		function (mp_detailed, mp_show, focused, mp_has_focus) {
			return mp_detailed || (mp_show && focused && !mp_has_focus);
		}
	],
	'nest-section': [[PlaylistsSection, ArtistsSection, AlbumsSection, TagsSection, TracksSection]],
	setItemForEnter: function() {

	},
	complex_states: {
		"needs_search_from": {
			depends_on: ['mp_detailed'],
			fn: function(mp_detailed) {
				return !mp_detailed;
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
		var playlists = this.app.gena.playlists,
			pl_results = [],
			pl_sec,
			i;
		var serplr;


		if (':playlists'.match(spv.getStringPattern(this.q))){
			this.setInactiveAll('section-playlist');
			pl_sec = this.g('section-playlist');
			pl_sec.setActive();
			pl_sec.changeQuery(this.q);


			serplr = this.app.getPlaylists();
			if (serplr.length){
				for (i = 0; i < serplr.length; i++) {
					pl_results.push({
						playlist: serplr[i]
					});
				}
			}

			pl_sec.appendResults(pl_results);
			pl_sec.renderSuggests(true);
		} else if (!this.q.match(/^:/)){
			this.setActiveAll('section-playlist');
			//playlist search


			serplr = this.app.getPlaylists(this.q);
			if (serplr.length){
				for (i = 0; i < serplr.length; i++) {
					pl_results.push({
						playlist: serplr[i]
					});
				}
			}

			if (pl_results.length){
				pl_sec =  this.g('section-playlist');
				if (pl_sec) {
						pl_sec.setActive();
					pl_sec.appendResults(pl_results);
					pl_sec.renderSuggests(true);
				}

			}

			//===playlists search
			this.searchOffline(this.q);
			this.searchNetwork(this.q);
		}
	},
	searchOffline: spv.debounce(function(q){
		var tags = this.g('section-tag');
		var r = this.searchTags(q);
		if (r.length){
			tags.appendResults(r);
			tags.renderSuggests(r);
		}

	},150),
	searchTags: function(q){
		var tags_results = [];

		var tags = spv.searchInArray(lastfm_data.toptags, q);
		for (var i=0; i < tags.length; i++) {
			tags_results.push({
				tag: tags[i]
			});
		}
		return tags_results;
	},
	searchNetwork: (app_serv.app_env.cross_domain_allowed && false) ?
		function(q){
			var _this = this;
			this.loading();
			var hash = hex_md5(q);
			var cache_used = cache_ajax.get('lfm_fs', hash, function(r){

				_this.loaded();
				lfmhelp.fast_suggestion(r, q, _this);
			});
			if (!cache_used) {
				var all_parts = [this.g('section-artist'), this.g('section-track'), this.g('section-tag'), this.g('section-album')];
				for (var i = 0; i < all_parts.length; i++) {
					var el = all_parts[i];
					if (el) {
						el.loading();
					}
				}

				lfmhelp.get_fast_suggests(q, function(r){
					for (var i = 0; i < all_parts.length; i++) {
						var el = all_parts[i];
						if (el) {
							el.loaded();
						}
					}
					lfmhelp.fast_suggestion(r, q, _this);
				}, hash, this);

			}
		}
		:
		spv.debounce(function(q){
			lfmhelp.getLastfmSuggests(this.app, 'artist.search', {artist: q}, q, this.g('section-artist'), suParseArtistsResults);
			lfmhelp.getLastfmSuggests(this.app, 'track.search', {track: q}, q, this.g('section-track'), suParseTracksResults);
			lfmhelp.getLastfmSuggests(this.app, 'tag.search', {tag: q}, q, this.g('section-tag'), suParseTagsResults);
			lfmhelp.getLastfmSuggests(this.app, 'album.search', {album: q}, q, this.g('section-album'), suParseAlbumsResults);
		}, 400),
	'compx-nav_title': [
		['query', '#locales.Search-resuls'],
		function(text, original) {
			if (!original) {
				return;
			}
			if (text){
				return original.replace(this.query_regexp, ' «' + text + '» ').replace(/^\ |\ $/gi, '');
			} else{
				var usual_text = original.replace(this.query_regexp, '');
				var cap = usual_text.charAt(0).toLocaleUpperCase();
				return cap + usual_text.slice(1);
			}
		}
	]
});


return {
	Investigation: base.Investigation,
	BaseSuggest: base.BaseSuggest,
	SearchSection: base.SearchSection,
	SearchPage: SearchPage
};
});
