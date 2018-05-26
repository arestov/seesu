define(function(require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../../utils/getPropsPrefixChecker');

var getUnprefixed = spv.getDeprefixFunc( 'nest_sel-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );
var SelectNestingDeclaration = require('./item')

return function checkNestSel(self, props) {
  if (!hasPrefixedProps(props)) {
    return;
  }

  self._chi_nest_sel = spv.cloneObj({}, self._chi_nest_sel);

  for (var name in props) {
    var clean_name = getUnprefixed(name);
    if (!clean_name) {
      continue;
    }

    self._chi_nest_sel[name] = new SelectNestingDeclaration(clean_name, props[name]);
  }

  self.nest_sel_nest_matches = [];

  for (var sel_res in self._chi_nest_sel) {
    self.nest_sel_nest_matches.push(self._chi_nest_sel[sel_res]);
  }
};
});
