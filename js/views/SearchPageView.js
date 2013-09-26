define(['provoda', 'jquery', 'app_serv', './SearchPageViewBase', './coct'],
	function(provoda, $, app_serv, SearchPageViewBase, coct) {
"use strict";
var localize = app_serv.localize;
var
	default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
var
	baseSuggestUI,
	baseSectionButtonUI,
	searchSectionUI,
	investigationView;

investigationView  = function(){};
provoda.extendFromTo('InvestigationView', coct.SPView, investigationView);


baseSuggestUI = function(){};
provoda.extendFromTo('baseSuggestView', provoda.View, baseSuggestUI);

baseSectionButtonUI = function(){};
provoda.extendFromTo('baseSectionButtonView', baseSuggestUI, baseSectionButtonUI);


var searchPageSuggestView = function() {};
baseSuggestUI.extendTo(searchPageSuggestView, {
	autoscroll: true
});

var searchPageButtonView = function() {};
baseSectionButtonUI.extendTo(searchPageButtonView, {
	autoscroll: true
});

var artistSuggestUI = function(){};
searchPageSuggestView.extendTo(artistSuggestUI, {
	createItem: function(){
		var that = this.mpx.md;

		var a = $("<a></a>");
		$("<img/>").attr({
			src: (that.image || default_sugg_artimage),
			alt: that.artist })
			.appendTo(a);
		$("<span></span>").text(that.text_title)
			.appendTo(a);
		this.a = a.appendTo(this.c);
		this.dom_related_props.push('a');
		return this;
	}
});

var trackSuggestUI = function(){};
searchPageSuggestView.extendTo(trackSuggestUI, {
	createItem: function(){

		var a = $('<a></a>');

		this.img_c = $('<img/>').attr('src', default_sugg_artimage).appendTo(a);
		this.duration_c = $('<span class="sugg-track-dur"></span>').appendTo(a);
		
		this.track_name_c = $('<span class="suggest-track_name"></span>').appendTo(a);
		this.artist_name_c  = $('<span class="suggest-artist_name"></span>').appendTo(a);


		this.a = a.appendTo(this.c);
		this.dom_related_props.push('a', 'img_c', 'duration_c', 'track_name_c', 'artist_name_c');
		return this;
	},
	"stch-artist": function(state) {
		this.artist_name_c.text(state);
		this.img_c.attr('alt', state);
	},
	"stch-track": function(state) {
		this.track_name_c.text(state);
	},
	"stch-image": function(state) {
		this.img_c.attr('src', state);
	},
	"stch-duration_text": function(state) {
		this.duration_c.text(state);
	}
	
});


var tagSuggestUI = function(){};
searchPageSuggestView.extendTo(tagSuggestUI,  {
	createItem: function() {
		var that = this.mpx.md;
		this.a = $("<a></a>")
			.append("<span>" + that.text_title + "</span>")
			.appendTo(this.c);
		this.dom_related_props.push('a');
		return this;
	}
});


var albumSuggestUI = function(){};
searchPageSuggestView.extendTo(albumSuggestUI, {
	createItem: function(){

		var a = $("<a></a>");
		this.img_c = $('<img/>').attr('src', default_sugg_artimage).appendTo(a);

		this.artist_name_c  = $('<span class="suggest-artist_name"></span>').appendTo(a);
		this.album_name_c  = $('<span class="suggest-album_name"></span>').appendTo(a);

		this.a = a.appendTo(this.c);
		this.dom_related_props.push('a', 'img_c', 'artist_name_c', 'album_name_c');
		return this;
	},
	"stch-name": function(state) {
		this.album_name_c.text(state);
		this.img_c.attr('alt', state);

	},
	"stch-artist": function(state) {
		this.artist_name_c.text(state);
		
	},
	"stch-image": function(state) {
		this.img_c.attr('src', state);
	}
});





searchSectionUI = function(){};
provoda.extendFromTo("searchSectionView", provoda.View, searchSectionUI);


var tracksSectionView = function(){};
searchSectionUI.extendTo(tracksSectionView, {
	c_class: "sugg-section results-suggests",
	children_views:{
		item: trackSuggestUI,
		button: searchPageButtonView
	}
});


var tagsSectionView = function() {};
searchSectionUI.extendTo(tagsSectionView, {
	c_class: "sugg-section results-suggests",
	children_views:{
		item: tagSuggestUI,
		button: searchPageButtonView
	}
});


var albumsSectionView = function() {};
searchSectionUI.extendTo(albumsSectionView, {
	c_class: 'sugg-section results-suggests',
	children_views:{
		item: albumSuggestUI,
		button: searchPageButtonView
	}
});


var artistsSectionView = function(){};
searchSectionUI.extendTo(artistsSectionView, {
	c_class: 'sugg-section results-suggests',
	children_views:{
		item: artistSuggestUI,
		button: searchPageButtonView
	}
});


var playlistsSectionView = function() {};
searchSectionUI.extendTo(playlistsSectionView, {
	c_class: 'sugg-section playlist-results',
	children_views:{
		item: searchPageSuggestView
	}
});



var SearchPageView = function() {};
investigationView.extendTo(SearchPageView, {
	children_views: {
		'section-artist': artistsSectionView,
		'section-album': albumsSectionView,
		'section-tag': tagsSectionView,
		'section-playlist': playlistsSectionView,
		'section-track': tracksSectionView
	},
	'stch-needs_search_from': function(state) {
		this.c.toggleClass('does-not-need-search-from', !state);
	},
	createBase: function() {
		this.c = this.root_view.getSample('search_results-container');
		this.createTemplate();

		//this.c = $('<div class="search_results-container"></div>');
		//$('<p class="search-desc"></p>').text(localize('search-control-hint')).appendTo(this.c);
	},
	'stch-mp_show': function(opts) {
		if (opts){
			if (!opts.transit){
				this.expand();
			}
		} else {

		}
	}
});
return SearchPageView;
});
