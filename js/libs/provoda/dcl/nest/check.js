define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc( 'nest-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );
var NestDcl = require('./item');

var handle = function(self, result) {
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

return function(self, props) {
  var
    has_props = hasPrefixedProps(props),
    has_pack = self.hasOwnProperty('nest'),
    prop, real_name;

  if (!has_props && !has_pack) {
    return;
  }

  var result = {};

  var used_props = {};

  if (has_props) {
    for (prop in self) {

      if (getUnprefixed(prop)) {

        real_name = getUnprefixed(prop);
        var cur = self[prop];
        used_props[real_name] = true;
        result[real_name] = new NestDcl(real_name, cur);
      }
    }
  }

  if (has_pack) {
    for (real_name in self.nest) {
      if (used_props[real_name]) {
        continue;
      }
      var cur = self.nest[real_name];
      used_props[real_name] = true;
      result[real_name] = new NestDcl(real_name, cur);
    }
  }

  handle(self, result)
};
});
