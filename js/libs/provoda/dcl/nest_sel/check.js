define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var SelectNestingDeclaration = require('./item')

var handle = function(self, _chi_nest_sel) {
  self.nest_sel_nest_matches = [];

  for (var sel_res in _chi_nest_sel) {
    self.nest_sel_nest_matches.push(_chi_nest_sel[sel_res]);
  }
}

var checkNestSel = checkPrefix('nest_sel-', SelectNestingDeclaration, '_chi_nest_sel', handle);

return checkNestSel;
});
