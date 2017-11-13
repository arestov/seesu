define(function() {
'use strict';

var nestConstructor = function(item, key) {
  if (typeof item == 'string') {
    return {
      type: 'route',
      value: item
    };
  } else {
    return {
      type: 'constr',
      value: item,
      key: key
    };
  }
};

var declarationConstructor = function(cur, key) {
  if (Array.isArray(cur)) {
    var result = [];
    for (var i = 0; i < cur.length; i++) {
      result[i] = nestConstructor(cur[i], key + '-' + i);
    }
    return result;
  } else {
    return nestConstructor(cur, key);
  }
};

return {
  nestConstructor: nestConstructor,
  declarationConstructor: declarationConstructor
};
});
