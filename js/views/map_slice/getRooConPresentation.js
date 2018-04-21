define(function(require) {
'use strict';
var matchCildrenView = require('./matchCildrenView');
var getAncestorByRooViCon = require('./getAncestorByRooViCon');

return function getRooConPresentation(self, app_view, mplev_view, get_ancestor, only_by_ancestor) {
  var views = self.getViews();
  var cur;
  if (!only_by_ancestor){
    for (var i = 0; i < views.length; i++) {
      cur = views[i];
      if (matchCildrenView(app_view.general_navigation_view,  cur, false, 'map_slice' ) ) {
        return cur;
      }


    }
  }
  for (var jj = 0; jj < views.length; jj++) {
    cur = views[jj];
    var ancestor = false;
    if (mplev_view){
      ancestor = getAncestorByRooViCon(cur, 'all-sufficient-details', only_by_ancestor);
    } else {
      ancestor = getAncestorByRooViCon(cur, 'main', only_by_ancestor);
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
