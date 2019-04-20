define(function() {
'use strict';
return function getTypedDcls(props) {
  if (!props) {
    return;
  }

  var result = {};

  for (var prop in props) {
    if (!props.hasOwnProperty(prop)) {
      continue;
    }
    var cur = props[prop];

    if (!cur) {
      console.warn('implement erasing')
      continue
    }

    var dcl_type = cur[0];
    var data = cur && cur.slice(1);

    if (!result[dcl_type]) {
      result[dcl_type] = {};
    }

    result[dcl_type][prop] = data;
  }

  return result;
};
});
