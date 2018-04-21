define(function(require) {
'use strict';
var getAncestorByRooViCon = require('./getAncestorByRooViCon');

return function getRooConPresentation(self, app_view, mplev_view, get_ancestor, only_by_ancestor) {
  var views = self.getViews();
  var cur;

  for (var jj = 0; jj < views.length; jj++) {
    cur = views[jj];
    var ancestor = false;
    if (mplev_view){
      ancestor =
        getAncestorByRooViCon(cur, true, only_by_ancestor)
        || getAncestorByRooViCon(cur, false, only_by_ancestor);
    } else {
      ancestor = getAncestorByRooViCon(cur, false, only_by_ancestor);
    }
    if (ancestor){
      if (get_ancestor){
        return ancestor;
      } else {
        return cur;
      }
    }
  }
}
});
