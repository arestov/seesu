define(function() {
'use strict';
return function isBwConnectedView(target, view_space) {
  /*
  поменять на

  если сам
  {nesting_name:"pioneer"
  nesting_space:"main"}
  и родитель map_slice и совпадает с general_navigation_view, то подходит
  */

  //

  if (!target.parent_view || !target.parent_view.parent_view) {
    return;
  }

  var general = target.root_view.general_navigation_view;
  var parent_view = target.parent_view
  if (parent_view.parent_view === general &&
    parent_view.nesting_name === 'map_slice' &&
    parent_view.nesting_space === view_space) {
    return true;
  }

  return
}

});
