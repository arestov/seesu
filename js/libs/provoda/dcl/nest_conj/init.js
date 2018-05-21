define(function(require) {
'use strict';
var addFrom = require('../../nest-watch/addFrom');
var NestConcat = require('./NestConcat');

return function init(self) {
  self.states_links = self.states_links || null;
  self.nes_match_index = self.nes_match_index || null;

  if (!self.nest_concat_nest_matches) {
    return;
  }
  for (var i = 0; i < self.nest_concat_nest_matches.length; i++) {
    var cur = new NestConcat(self, self.nest_concat_nest_matches[i]);

    for (var jj = 0; jj < cur.lnwatches.length; jj++) {
      addFrom(self, cur.lnwatches[jj]);
    }
  }
};
});
