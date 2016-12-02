define(function(require) {
'use strict';
var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var addFrom = require('../../nest-watch/addFrom');
var NestSelector = require('./NestSelector');
var Hands= NestSelector.Hands;
var addHead = NestSelector.addHead;
var getParsedPath = require('../../initDeclaredNestings').getParsedPath;

function add(start, nwbase, dest_w, hands) {
  var start_point  = nwbase && nwbase.start_point;
  var path_template = start_point && getParsedPath(start_point);
  if (!path_template) {
    var lnw = new LocalWatchRoot(null, nwbase, hands);
    return addFrom(start, lnw, 0);
  }

  var lnw = new LocalWatchRoot(null, nwbase, hands);
  addFrom(start, lnw, 0);
}

return function init(self) {
	if (!self.nest_sel_nest_matches) {return;}

	for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
		var dcl = self.nest_sel_nest_matches[i];
    var hands = new Hands(dcl);
		var dest_w = new NestSelector(self, dcl, hands);
		if (dest_w.state_name) {
			addFrom(self, dest_w, 0);
		}
    add(self, dcl.nwbase, dest_w, hands);
    addHead(self, hands, dest_w);
	}

};
});
