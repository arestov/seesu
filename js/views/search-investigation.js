
/*

investigationUI



*/


investigationUI  = function(){};
provoda.extendFromTo('InvestigationView', suServView, investigationUI);


baseSuggestUI = function(){};
provoda.extendFromTo('baseSuggestView', suServView, baseSuggestUI);

baseSectionButtonUI = function(sugg){};
provoda.extendFromTo('baseSectionButtonView', baseSuggestUI, baseSectionButtonUI);


baseSectionButtonUI.prototype['stch-button_text'] =  function(text){
	this.text_span.text(text);
};
baseSectionButton.prototype.ui_constr = baseSectionButtonUI;


searchSectionUI = function(){};
provoda.extendFromTo("searchSectionView", suServView, searchSectionUI);


var tracksSectionUI = function(seasc){};
searchSectionUI.extendTo(tracksSectionUI, {
	head_text: localize('Tracks','Tracks'),
	c_class: "sugg-section results-suggests"
});


var tagsSectionUI = function(seasc) {};
searchSectionUI.extendTo(tagsSectionUI, {
	head_text: localize('Tags'),
	c_class: "sugg-section results-suggests recommend-tags"
});



var albumsSectionUI = function(seasc) {};
searchSectionUI.extendTo(albumsSectionUI, {
	head_text: localize('Albums', 'Albums'),
	c_class: 'sugg-section results-suggests recommend-albums'
});


var playlistsSectionUI = function(seasc) {};
searchSectionUI.extendTo(playlistsSectionUI, {
	head_text: localize('playlists'),
	c_class: 'sugg-section playlist-results'
});


var artistsSectionUI = function(seasc){};

searchSectionUI.extendTo(artistsSectionUI, {
	head_text: localize('Artists','Artists'),
	c_class: 'sugg-section results-suggests'
});