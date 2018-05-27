define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc( 'nest-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );
var NestDcl = require('./item');
var build = require('./build');

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

  build(self, result)
};
});
