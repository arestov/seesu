define(function (require) {
'use strict';
var NestSelector = require('../StatesEmitter/NestSelector');
var LocalWatchRoot = require('./LocalWatchRoot');
var initDeclaredNestings = require('../initDeclaredNestings');
var addNestWatch = require('./add-remove').addNestWatch;
var checkNesting = require('./checkNesting');

function init(self) {
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

function addFrom(target, lnest_watch, skip) {
  var start_md = lnest_watch.nwatch.start_point
    ? initDeclaredNestings.getSPByPathTemplate(target.app, target, lnest_watch.nwatch.start_point)
    : target;
  addNestWatch(start_md, lnest_watch, skip);
}

return {
  init: init,
  checkNesting: checkNesting,
};

});
