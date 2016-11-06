define(function (require) {
'use strict';
var NestSelector = require('../StatesEmitter/NestSelector');
var LocalWatchRoot = require('./LocalWatchRoot');
var addFrom = require('./addFrom');
var checkNesting = require('./checkNesting');
var checkStates = require('./checkStates');

function init(self) {
  self.states_links = null;
  self.nes_match_index = null;

  if (self.nest_sel_nest_matches) {
    for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
      var cur = self.nest_sel_nest_matches[i];
      var dest_w = new NestSelector(self, cur);
      var source_w = new LocalWatchRoot(self, cur.nwbase, dest_w);
      if (dest_w.state_name) {
        addFrom(self, dest_w, 0);
      }
      addFrom(self, source_w, 0);
    }
  }

  if (self.nest_match) {
    for (var i = 0; i < self.nest_match.length; i++) {
      addFrom(self, new LocalWatchRoot(self, self.nest_match[i]), 0);
    }
  }
}


return {
  init: init,
  checkNesting: checkNesting,
  checkStates: checkStates,
};

});
