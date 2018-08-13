define(function(require) {
'use strict'
var build = function(self, _chi_nest_sel) {
  self.nest_sel_nest_matches = [];

  for (var sel_res in _chi_nest_sel) {
    self.nest_sel_nest_matches.push(_chi_nest_sel[sel_res]);
  }
}
return build;
});
