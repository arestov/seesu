define(function(require){
'use strict';
var isBwConnectedView = require('./isBwConnectedView');

return function getAncestorByRooViCon(self, details, strict) {
  //находит родительскую вьюху соеденённую с корневой вьюхой
  //by root view connection

  var view_space = details ? 'detailed' : 'main';
  var cur_ancestor = self;
  var root_view = self.root_view;
  if (strict){
    cur_ancestor = cur_ancestor.parent_view;
  }
  while (cur_ancestor){
    if (cur_ancestor == root_view){
      break;
    }

    if (isBwConnectedView(cur_ancestor, view_space)) {
      return cur_ancestor;
    }

    cur_ancestor = cur_ancestor.parent_view;
  }
};

});
