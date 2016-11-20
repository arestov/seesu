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

  this.ask_for = null;
  this.idle_until = null;
  this.preload_on = null;

  if (!data[1] && !data[2]) {
    return;
  }

  if (data[1] && typeof data[1] == 'object' && !data[2] ) {
    this.ask_for = data[1].ask_for || null;
    this.idle_until = data[1].idle_until || this.ask_for || null;
    this.preload_on = data[1].preload_on || null;
  } else {
    console.warn('fix legacy `nest-` dcl', data[1], data[2]);
    var preload = data[1];
    this.preload_on = (preload === true ? 'mp_has_focus' : preload) || null;
    this.idle_until = data[2] || null;
  }
  /*
  ask_for
  idle_until
  load_on
  */
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
