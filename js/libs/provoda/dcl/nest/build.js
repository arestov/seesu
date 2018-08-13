define(function(require) {
'use strict'
var build = function(self, result) {
  self.nestings_declarations = [];
  self.idx_nestings_declarations = result;
  self._chi_nest = {};

  for (var name in result) {
    if (!result.hasOwnProperty(name)) {
      continue;
    }
    var cur = result[name]
    self.nestings_declarations.push(cur);
    var item = cur.subpages_names_list;
    if (Array.isArray(item)) {
      for (var kk = 0; kk < item.length; kk++) {
        if (item[kk].type == 'constr') {
          self._chi_nest[item[kk].key] = item[kk].value;
        }
      }
    } else {
      if (item.type == 'constr') {
        self._chi_nest[item.key] = item.value;
      }
    }
  }
}

return build;
});
