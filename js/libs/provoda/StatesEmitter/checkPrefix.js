define(function (require) {
'use strict';

var spv = require('spv');
var hp = require('../helpers');

return function checkPrefix(prefix, Declr, result_prop) {
  var getUnprefixed = spv.getDeprefixFunc( prefix );
  var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );
  var merge = mergePrefixed(prefix);

  return function (self, props) {
    if (!hasPrefixedProps(props)) {
      return;
    }

    var fresh = {};

    for (var prop_name in props) {
      var item_name = getUnprefixed(prop_name);
      if (!item_name) {continue;}

      fresh[item_name] = new Declr(item_name, props[prop_name]);
    }

    self[result_prop] = merge(self, self[result_prop], fresh);
    return self[result_prop];
  };
};

function mergePrefixed(prefix) {
  var getUnprefixed = spv.getDeprefixFunc( prefix );
  return function (self, old, fresh) {
    var result = {};

    for (var prop_name in self) {
      var item_name = getUnprefixed(prop_name);
      if (!item_name) {continue;}

      result[item_name] = fresh.hasOwnProperty(item_name)
        ? fresh[item_name]
        : old[item_name];
    }

    return result;
  };
}
});
