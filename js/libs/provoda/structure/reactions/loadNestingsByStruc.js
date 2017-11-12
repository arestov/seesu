define(function (require) {
'use strict';

var hp = require('../../helpers');
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSubpages = initDeclaredNestings.getSubpages;

return function loadNestingsByStruc(md, struc) {
  if (!struc) {return;}

  var idx = md.idx_nestings_declarations;
  if (!idx) {return;}

  var obj = struc.main.m_children.children;
  for (var name in obj) {
    var nesting_name = hp.getRightNestingName(md, name);
    var el = idx[nesting_name];
    if (!el) {continue;}

    var item = getSubpages( md, el );
    if (Array.isArray(item) || !item.preloadStart) {
      continue;
    }
    if (item.full_comlxs_index['preview_list'] || item.full_comlxs_index['preview_loading']) {
      continue;
    }
    item.preloadStart();
  }
}

});
