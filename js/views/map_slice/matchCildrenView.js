define(function() {
'use strict';
return function matchCildrenView(self, target_view, nesting_space_in, nesting_name) {
  var nesting_space = nesting_space_in || 'main';
  for (var i = 0; i < self.children.length; i++) {
    var cur = self.children[i];
    if (cur != target_view) {
      continue;
    }
    if (nesting_space && cur.nesting_space != nesting_space) {
      continue;
    }
    if (nesting_name && cur.nesting_name != nesting_name) {
      continue;
    }
    return true;

  }
  return false;
};
});
