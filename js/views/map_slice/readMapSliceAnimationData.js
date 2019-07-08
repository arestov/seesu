define(function (require) {
'use strict';
var pv = require('pv');
var view_serv = require('view_serv');
// var findMpxViewInChildren = require('./findMpxViewInChildren')

var can_animate = view_serv.css.transform && view_serv.css.transition;
var css_transform = view_serv.css.transform;
var transform_props = css_transform ? [css_transform] : [];

var getNavOHeight = function() {
  return this.root_view.els.navs.outerHeight();
};
var getAMCWidth = function() {
  return this.root_view.els.app_map_con.width();
};
var getAMCOffset = function() {
  return this.root_view.els.app_map_con.offset();
};

return function readMapSliceAnimationData(view, transaction_data) {
  if (!transaction_data || !transaction_data.bwlev) {return;}

  var target_md = transaction_data.bwlev.getMD();
  var current_lev_num = pv.state(target_md, 'map_level_num');
  var one_zoom_in = transaction_data.array.length == 1 && transaction_data.array[0].name == "zoom-in" && transaction_data.array[0].changes.length < 3;

  if (!(can_animate && current_lev_num != -1 && one_zoom_in)) {return;}

  var target_in_parent = view.getMapSliceChildInParenView(target_md, transaction_data.target.getMD());
  if (!target_in_parent) {return;}

  var targt_con = target_in_parent.getC();

  // var offset_parent_node = targt_con.offsetParent();
  var parent_offset = view.getBoxDemension(getAMCOffset, 'screens_offset');
  // или ни о чего не зависит или зависит от позиции скрола, если шапка не скролится

  // var offset = targt_con.offset(); //domread
  var offset = target_in_parent.getBoxDemension(function() {
    return targt_con.offset();
  }, 'con_offset', target_in_parent._lbr.innesting_pos_current, view.root_view.state('window_height'), view.root_view.state('workarea_width'));

  var width = target_in_parent.getBoxDemension(function() {
    return targt_con.outerWidth();
  }, 'con_width', view.root_view.state('window_height'), view.root_view.state('workarea_width'));

  var height = target_in_parent.getBoxDemension(function() {
    return targt_con.outerHeight();
  }, 'con_height', view.root_view.state('window_height'), view.root_view.state('workarea_width'));


  // var width = targt_con.outerWidth();  //domread
  // var height = targt_con.outerHeight(); //domread

  var top = offset.top - parent_offset.top;

  var con_height = view.root_view.state('window_height') - view.getBoxDemension(getNavOHeight, 'navs_height'); //domread, can_be_cached
  var con_width = view.getBoxDemension(getAMCWidth, 'screens_width', view.root_view.state('workarea_width'));

  var scale_x = width/con_width;
  var scale_y = height/con_height;
  var min_scale = Math.min(scale_x, scale_y);

  var shift_x = width/2 - min_scale * con_width/2;
  var shift_y = height/2 - min_scale * con_height/2;

  var lc = view.getLevelContainer(current_lev_num);

  var transform_values = {};
  var value = 'translate(' + (offset.left + shift_x) + 'px, ' + (top + shift_y) + 'px)  scale(' + min_scale + ')';
  transform_props.forEach(function(el) {
    transform_values[el] = value;
  });

  // from small size (size of button) to size of viewport

  return {
    lc: lc,
    transform_values: transform_values
  };
};

// function getMapSliceChildInParenViewOLD(md) {
//   var parent_md = md.map_parent;
//
//
//   var parent_view = this.getMapSliceView(parent_md);
//   if (!parent_view){
//     return;
//   }
//   var target_in_parent = findMpxViewInChildren(parent_view, this.getStoredMpx(md));
//   if (!target_in_parent){
//     var view = parent_view.getChildViewsByMpx(this.getStoredMpx(md));
//     target_in_parent = view && view[0];
//   }
//   return target_in_parent;
// };
});
