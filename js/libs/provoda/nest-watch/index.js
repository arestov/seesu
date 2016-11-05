define(function (require) {
'use strict';
var NestSelector = require('../StatesEmitter/NestSelector');
var LocalWatchRoot = require('../Model/LocalWatchRoot');
var initDeclaredNestings = require('../initDeclaredNestings');

function init(self) {
  self.nes_match_index = null;

  if (self.nest_sel_nest_matches) {
    for (var i = 0; i < self.nest_sel_nest_matches.length; i++) {
      var cur = self.nest_sel_nest_matches[i];
      var dest_w = new NestSelector(self, cur);
      var source_w = new LocalWatchRoot(self, cur.nwbase, dest_w);
      if (dest_w.state_name) {
        addNestWatch(self, dest_w, 0);
      }
      addNestWatch(self, source_w, 0);
    }
  }

  if (self.nest_match) {
    for (var i = 0; i < self.nest_match.length; i++) {
      addNestWatch(self, new LocalWatchRoot(self, self.nest_match[i]), 0);
    }
  }
}

function addNestWatch(target, lnest_watch, skip) {
  var start_md = lnest_watch.nwatch.start_point
    ? initDeclaredNestings.getSPByPathTemplate(target.app, target, lnest_watch.nwatch.start_point)
    : target;
  start_md.addNestWatch(lnest_watch, skip);
}

return {
  init: init
};

});
