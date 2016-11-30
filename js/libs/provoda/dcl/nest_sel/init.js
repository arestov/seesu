define(function(require) {
'use strict';
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var addFrom = require('../../nest-watch/addFrom');
var NestSelector = require('./NestSelector');

return function init(self) {
	if (!self.nest_sel_nest_matches) {return;}

	for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
		var cur = self.nest_sel_nest_matches[i];
		var dest_w = new NestSelector(self, cur);
		var source_w = new LocalWatchRoot(null, cur.nwbase, dest_w);
		if (dest_w.state_name) {
			addFrom(self, dest_w, 0);
		}
		addFrom(self, source_w, 0);
	}

};
});
