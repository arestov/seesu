define(function(require) {
'use strict'
var build = function(self, cnts) {
  self.nest_concat_nest_matches = [];

  for (var res in cnts) {
    self.nest_concat_nest_matches.push(cnts[res]);
  }
}

return build;
});
