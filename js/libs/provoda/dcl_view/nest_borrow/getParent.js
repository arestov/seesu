define(function () {
'use strict';

return function getParent(start_view, count) {
  var cur = start_view;
  for (var i = 0; i < count; i++) {
    cur = cur.getStrucParent();
  }
  return cur;
}
;
});
