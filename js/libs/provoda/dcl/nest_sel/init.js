define(function(require) {
'use strict';
var initDeclaredNestings = require('../../initDeclaredNestings');
var getParsedPath = initDeclaredNestings.getParsedPath;
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;
var addRootNestWatch = require('../../nest-watch/add-remove').addRootNestWatch;

var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var addFrom = require('../../nest-watch/addFrom');
var NestSelector = require('./NestSelector');
var Hands= NestSelector.Hands;
var addHead = NestSelector.addHead;

function add(self, nwbase, dcl) {
  var start_point  = nwbase && nwbase.start_point;
  var path_template = start_point && getParsedPath(start_point);
  if (!path_template) {
    var lnw = new LocalWatchRoot(null, nwbase, new Hands(dcl));
    addFrom(self, lnw);
    return lnw;
  }

  var start_md = getSPByPathTemplate(self.app, self, start_point);

  if (!start_md.shared_nest_sel_hands) {
    start_md.shared_nest_sel_hands = {};
  }

  var key = nwbase.num;

  if (!start_md.shared_nest_sel_hands[key]) {
    var lnw = new LocalWatchRoot(null, nwbase, new Hands(dcl));
    addRootNestWatch(start_md, lnw);
    start_md.shared_nest_sel_hands[key] = lnw;
  }

  return start_md.shared_nest_sel_hands[key];
}

return function init(self) {
	if (!self.nest_sel_nest_matches) {return;}

	for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
		var dcl = self.nest_sel_nest_matches[i];
    var deep_nwatch = add(self, dcl.nwbase, dcl);
    var hands = deep_nwatch.data;
		var dest_w = new NestSelector(self, dcl, hands);
		if (dest_w.state_name) {
			addFrom(self, dest_w);
		}

    addHead(self, hands, dest_w);
	}

};
});
