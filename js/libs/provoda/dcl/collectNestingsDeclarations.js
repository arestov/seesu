define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var declarationConstructor = require('../structure/constr_mention').declarationConstructor;
var getUnprefixed = spv.getDeprefixFunc( 'nest-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

var nestDcl = function (name, data) {
  this.nesting_name = name;
  this.subpages_names_list = declarationConstructor(data[0], 'nest-' + name);

  var preload = data[1];
  this.preload = (preload === true ? 'mp_has_focus' : preload) || null;
  this.init_state_name = data[2] || null;
};

return function(self, props) {
  var
    has_props = hasPrefixedProps(props),
    has_pack = self.hasOwnProperty('nest'),
    prop, cur, real_name;

  if (has_props || has_pack){
    var result = [];

    var used_props = {};

    if (has_props) {
      for (prop in self) {

        if (getUnprefixed(prop)) {

          real_name = getUnprefixed(prop);
          cur = self[prop];
          used_props[real_name] = true;
          result.push(new nestDcl(real_name, cur));
        }
      }
    }

    if (has_pack) {
      for (real_name in self.nest) {
        if (used_props[real_name]) {
          continue;
        }
        cur = self.nest[real_name];
        used_props[real_name] = true;
        result.push(new nestDcl(real_name, cur));
      }
    }

    self.nestings_declarations = result;
    self.idx_nestings_declarations = {};
    self._chi_nest = {};
    for (var i = 0; i < result.length; i++) {
      self.idx_nestings_declarations[result[i].nesting_name] = result[i];

      var item = result[i].subpages_names_list;
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



};
});
