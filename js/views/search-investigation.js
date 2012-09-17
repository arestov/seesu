
/*
baseSuggestUI
baseSectionButtonUI
searchSectionUI

investigationView



*/
var 
	default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';


investigationView  = function(){};
provoda.extendFromTo('InvestigationView', provoda.View, investigationView);


baseSuggestUI = function(){};
provoda.extendFromTo('baseSuggestView', provoda.View, baseSuggestUI);

baseSectionButtonUI = function(sugg){};
provoda.extendFromTo('baseSectionButtonView', baseSuggestUI, baseSectionButtonUI);



var artistSuggestUI = function(sugg){};
baseSuggestUI.extendTo(artistSuggestUI, {
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
baseSuggestUI.extendTo(trackSuggestUI, {
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
baseSuggestUI.extendTo(tagSuggestUI,  {
	createItem: function() {
		var that = this.md;
		this.a = $("<a></a>")
			.append("<span>" + that.text_title + "</span>")
			.appendTo(this.c);
		return this;
	}
});


var albumSuggestUI = function(sugg){};
baseSuggestUI.extendTo(albumSuggestUI, {
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
		button: baseSectionButtonUI
	}
});


var tagsSectionView = function(seasc) {};
searchSectionUI.extendTo(tagsSectionView, {
	head_text: localize('Tags'),
	c_class: "sugg-section results-suggests recommend-tags",
	children_views:{
		item: tagSuggestUI,
		button: baseSectionButtonUI
	}
});


var albumsSectionView = function(seasc) {};
searchSectionUI.extendTo(albumsSectionView, {
	head_text: localize('Albums', 'Albums'),
	c_class: 'sugg-section results-suggests recommend-albums',
	children_views:{
		item: albumSuggestUI,
		button: baseSectionButtonUI
	}
});


var artistsSectionView = function(seasc){};
searchSectionUI.extendTo(artistsSectionView, {
	head_text: localize('Artists','Artists'),
	c_class: 'sugg-section results-suggests',
	children_views:{
		item: artistSuggestUI,
		button: baseSectionButtonUI
	}
});


var playlistsSectionView = function(seasc) {};
searchSectionUI.extendTo(playlistsSectionView, {
	head_text: localize('playlists'),
	c_class: 'sugg-section playlist-results',
	children_views:{
		item: baseSuggestUI
	}
});







var searchPageView = function() {};
investigationView.extendTo(searchPageView, {
	children_views: {
		'section-artist': artistsSectionView,
		'section-album': albumsSectionView,
		'section-tag': tagsSectionView,
		'section-playlist': playlistsSectionView,
		'section-track': tracksSectionView
	}
});