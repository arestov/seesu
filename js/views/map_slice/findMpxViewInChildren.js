define(function() {
'use strict';
return function findMpxViewInChildren(self, mpx, nesting_space, nesting_name) {
  nesting_space = nesting_space || 'main';
  var i;
  var views = mpx.getViews();


  var children = [];

  for (i = 0; i < self.children.length; i++) {
    var cur = self.children[i];
    if (cur.nesting_space != nesting_space) {
      continue;
    }
    if (nesting_name && cur.nesting_name != nesting_name) {
      continue;
    }
    children.push(cur);
  }


  for (i = 0; i < views.length; i++) {
    if (children.indexOf(views[i]) != -1) {
      return views[i];
    }
  }
};
});
