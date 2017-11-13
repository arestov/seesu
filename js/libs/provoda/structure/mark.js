define(function(require) {
'use strict';
var spv = require('spv');

function mark(Constr, RootConstr) {
  var self = Constr.prototype;

  self._all_chi = {};

  var all = {};

  spv.cloneObj(all, self._chi);
  spv.cloneObj(all, self._chi_sub_pager);
  spv.cloneObj(all, self._chi_sub_pages);
  spv.cloneObj(all, self._chi_sub_pages_side);
  spv.cloneObj(all, self._chi_nest);
  spv.cloneObj(all, self._chi_nest_rqc);

  for (var prop in all) {
    var item = all[prop] && spv.inh(all[prop], {
      skip_code_path: true
    }, {
      pconstr_id: self.constr_id,
      _parent_constr: Constr,
      _root_constr: RootConstr
    });

    self._all_chi[prop] = item && mark(item, RootConstr);
  }

  return Constr;
}

return mark;
});
