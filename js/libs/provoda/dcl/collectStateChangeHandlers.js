define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc( 'stch-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );


return function (self, props) {
  if (!props.hasOwnProperty('state_change') && !hasPrefixedProps(props)) {
    return;
  }

  var result_index = spv.cloneObj({}, self.__state_change_index || {});

  for (var lprop in props.state_change) {
    result_index[lprop] = props.state_change[lprop];
  }

  for (var prop_name in props) {
    if (getUnprefixed(prop_name)) {
      var string = getUnprefixed(prop_name);
      if (props.state_change && props.state_change[string]) {
        throw new Error('stch dup for: ' + string);
      }
      result_index[string] = props[prop_name];
    }
  }

  self.__state_change_index = result_index;
  return result_index;

};

});
