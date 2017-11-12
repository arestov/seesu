define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('../helpers');
var constr_mention = require('../structure/constr_mention');

var getUnprefixed = spv.getDeprefixFunc( 'nest_rqc-' );
var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

var nestConstructor = constr_mention.nestConstructor;

return function checkNestRqC(self, props) {
  if (!hasPrefixedProps(props)) {
    return;
  }

  self._chi_nest_rqc = spv.cloneObj({}, self.__chi_nest_rqc);
  self._nest_rqc = spv.cloneObj({}, self._nest_rqc);

  for (var name in props) {
    var clean_name = getUnprefixed(name);
    if (!clean_name) {
      continue;
    }
    var key = 'nest_rqc-' + clean_name;
    var cur = props[name];
    if (cur) {
      var item = nestConstructor(cur, key);
      self._nest_rqc[clean_name] = item;
      if (item.type == 'constr') {
        self._chi_nest_rqc[key] = item.value;
      } else {
        self._chi_nest_rqc[key] = null;
      }

    } else {
      self._chi_nest_rqc[key] = null;
      self._nest_rqc[clean_name] = null;
    }

  }
};
})
