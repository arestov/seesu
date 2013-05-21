define(['provoda', 'spv', 'app_serv', 'js/libs/BrowseMap'],
function(provoda, spv, app_serv, BrowseMap) {
'use strict';
var SongCard = function() {};
BrowseMap.Model.extendTo(SongCard, {
	model_name: 'songcard',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	}
});

});