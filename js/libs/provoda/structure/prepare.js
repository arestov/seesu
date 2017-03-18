define(function (require) {
'use strict';
var mark = require('./mark');

return function prepare(root) {
  var augmented = root;
  return mark(augmented, augmented);
};

});
