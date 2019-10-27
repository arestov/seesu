define(function(require) {
'use strict';
var addRemove = require('../../nest-watch/add-remove');
var addRootNestWatch = addRemove.addRootNestWatch;

var LocalWatchRoot = require('../../nest-watch/LocalWatchRoot');
var addFrom = require('../../nest-watch/addFrom');
var getStartModel = require('../../nest-watch/getStartModel')

var NestSelector = require('./NestSelector');
var Hands= NestSelector.Hands;
var addHead = NestSelector.addHead;

function add(self, nwbase, dcl) {
  var start_md = getStartModel(self, nwbase)
  if (self == start_md) {
    var lnw = new LocalWatchRoot(null, nwbase, new Hands(dcl));
    addFrom(self, lnw);
    return lnw;
  }

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
  self.states_links = self.states_links || null;
  self.nes_match_index = self.nes_match_index || null;

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
