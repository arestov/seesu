define(function(require){
'use strict';
var matchCildrenView = require('./matchCildrenView');
return function getAncestorByRooViCon(self, view_space, strict) { //находит родительскую вьюху соеденённую с корневой вьюхой
  //by root view connection
  var target_ancestor;
  var cur_ancestor = self;
  var root_view = self.root_view;
  if (strict){
    cur_ancestor = cur_ancestor.parent_view;
  }
  while (!target_ancestor && cur_ancestor){
    if (cur_ancestor == root_view){
      break;
    } else {
      if (cur_ancestor.parent_view == root_view){
        if ( matchCildrenView(
          root_view.general_navigation_view,
          cur_ancestor,
          view_space,
          'map_slice'
        ) ) {
          target_ancestor = cur_ancestor;
          break;
        }

      }
    }

    cur_ancestor = cur_ancestor.parent_view;
  }
  return target_ancestor;
}
});
