

var 
	baseSuggestUI,
	baseSectionButtonUI,
	searchSectionUI,
	investigationView,
	searchPageView;





(function() {
"use strict";
var 
	default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';


investigationView  = function(){};
provoda.extendFromTo('InvestigationView', provoda.View, investigationView);


baseSuggestUI = function(){};
provoda.extendFromTo('baseSuggestView', provoda.View, baseSuggestUI);

baseSectionButtonUI = function(sugg){};
provoda.extendFromTo('baseSectionButtonView', baseSuggestUI, baseSectionButtonUI);


var searchPageSuggestView = function() {};
baseSuggestUI.extendTo(searchPageSuggestView, {
	autoscroll: true
});

var searchPageButtonView = function() {};
baseSectionButtonUI.extendTo(searchPageButtonView, {
	autoscroll: true
});

var artistSuggestUI = function(sugg){};
searchPageSuggestView.extendTo(artistSuggestUI, {
	createItem: function(){
		var that = this.md;

		var a = $("<a></a>");
		$("<img/>").attr({
			src: (that.image || default_sugg_artimage),
			alt: that.artist })
			.appendTo(a);
		$("<span></span>").text(that.text_title)
			.appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});

var trackSuggestUI = function(sugg){};
searchPageSuggestView.extendTo(trackSuggestUI, {
	createItem: function(){
		var that = this.md;
		var a = $("<a></a>");
		
		$("<img/>").attr({ 
			src: (that.image || default_sugg_artimage) , 
			alt: that.artist }).appendTo(a);
		if (that.duration){
			var track_dur = parseInt(that.duration);
			var digits = track_dur % 60;
			track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			a.append('<span class="sugg-track-dur">' + track_dur + '</span>');
		}
		$("<span></span>").text(that.text_title).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});


var tagSuggestUI = function(sugg){};
searchPageSuggestView.extendTo(tagSuggestUI,  {
	createItem: function() {
		var that = this.md;
		this.a = $("<a></a>")
			.append("<span>" + that.text_title + "</span>")
			.appendTo(this.c);
		return this;
	}
});


var albumSuggestUI = function(sugg){};
searchPageSuggestView.extendTo(albumSuggestUI, {
	createItem: function(){
		var that = this.md;
		var a = $("<a></a>");
		$("<img/>").attr({ src: (that.image || default_sugg_artimage), alt: that.text_title }).appendTo(a);
		$("<span></span>").text(that.text_title).appendTo(a);
		this.a = a.appendTo(this.c);
		return this;
	}
});





searchSectionUI = function(){};
provoda.extendFromTo("searchSectionView", provoda.View, searchSectionUI);


var tracksSectionView = function(seasc){};
searchSectionUI.extendTo(tracksSectionView, {
	head_text: localize('Tracks','Tracks'),
	c_class: "sugg-section results-suggests",
	children_views:{
		item: trackSuggestUI,
		button: searchPageButtonView
	}
});


var tagsSectionView = function(seasc) {};
searchSectionUI.extendTo(tagsSectionView, {
	head_text: localize('Tags'),
	c_class: "sugg-section results-suggests recommend-tags",
	children_views:{
		item: tagSuggestUI,
		button: searchPageButtonView
	}
});


var albumsSectionView = function(seasc) {};
searchSectionUI.extendTo(albumsSectionView, {
	head_text: localize('Albums', 'Albums'),
	c_class: 'sugg-section results-suggests recommend-albums',
	children_views:{
		item: albumSuggestUI,
		button: searchPageButtonView
	}
});


var artistsSectionView = function(seasc){};
searchSectionUI.extendTo(artistsSectionView, {
	head_text: localize('Artists','Artists'),
	c_class: 'sugg-section results-suggests',
	children_views:{
		item: artistSuggestUI,
		button: searchPageButtonView
	}
});


var playlistsSectionView = function(seasc) {};
searchSectionUI.extendTo(playlistsSectionView, {
	head_text: localize('playlists'),
	c_class: 'sugg-section playlist-results',
	children_views:{
		item: searchPageSuggestView
	}
});



searchPageView = function() {};
investigationView.extendTo(searchPageView, {
	children_views: {
		'section-artist': artistsSectionView,
		'section-album': albumsSectionView,
		'section-tag': tagsSectionView,
		'section-playlist': playlistsSectionView,
		'section-track': tracksSectionView
	},
	'stch-needs-search-from': function(state) {
		this.c.toggleClass('does-not-need-search-from', !state);
	},
	complex_states: {
		'mp-show-end': {
			depends_on: ['map-animating', 'vis-mp-show', 'mp-show'],
			fn: function(anim, vis_mp_show, mp_show) {
				if (anim) {
					if (vis_mp_show && anim == vis_mp_show.anid){
						return vis_mp_show.value;
					} else {
						return false;
					}
					
				} else {
					return mp_show
				}
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="search-results-container"></div>');
		$('<p class="search-desc"></p>').text(localize('search-control-hint')).appendTo(this.c);
	}
});

})();
