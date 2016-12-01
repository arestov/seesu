define(function(require) {
'use strict';
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var addFrom = require('../../nest-watch/addFrom');
var NestSelector = require('./NestSelector');
var Hands= NestSelector.Hands;
var getParsedPath = require('../../initDeclaredNestings').getParsedPath;

function add(start, nwbase, dest_w) {
  var start_point  = nwbase && nwbase.start_point;
  var path_template = start_point && getParsedPath(start_point);
  if (!path_template) {
    var lnw = new LocalWatchRoot(null, nwbase, {
      hands: new Hands(dest_w.declr),
      head: dest_w,
    });
    return addFrom(start, lnw, 0);
  }

  var lnw = new LocalWatchRoot(null, nwbase, {
    hands: new Hands(dest_w.declr),
    head: dest_w,
  });
  addFrom(start, lnw, 0);
}

return function init(self) {
	if (!self.nest_sel_nest_matches) {return;}

	for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
		var cur = self.nest_sel_nest_matches[i];
		var dest_w = new NestSelector(self, cur);
		if (dest_w.state_name) {
			addFrom(self, dest_w, 0);
		}
    add(self, cur.nwbase, dest_w);
	}

};
});
