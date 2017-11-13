define(function (require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var view_serv = require('view_serv');

var sync_opt = {sync_tpl: true};

var css_transform = view_serv.css.transform;
var transform_props = css_transform ? [css_transform] : [];
//['-webkit-transform', '-moz-transform', '-o-transform', 'transform'];
var empty_transform_props = {};
transform_props.forEach(function(el) {
  empty_transform_props[el] = '';
});

var arrProtp = Array.prototype;
var concat = arrProtp.concat;
var concatArray = function(array_of_arrays) {
  return concat.apply(arrProtp, array_of_arrays);
};

var inCache = function(cache, key) {
  return cache.hasOwnProperty(key) && cache[key] !== false;
};

var needsDestroing = function(all_changhes) {
  var destroy_insurance = {}, i, cur, target, pvid;
  var result = [];

  for (i = 0; i < all_changhes.length; i++) {
    cur = all_changhes[i];
    target = cur.bwlev.getMD();
    pvid = target._provoda_id;
    if (cur.type == 'destroy'){
      destroy_insurance[pvid] = target;
    } else {
      destroy_insurance[pvid] = false;
    }
  }

  for (i = all_changhes.length - 1; i >= 0; i--) {
    cur = all_changhes[i];
    target = cur.bwlev.getMD();
    pvid = target._provoda_id;
    if (cur.type == 'destroy'){
      if (inCache(destroy_insurance, pvid)) {
        destroy_insurance[pvid] = false;
        result.unshift(target);
      }
    }
  }

  return result;
};


return function(view, transaction_data, animation_data) {
  var all_changhes = spv.filter(transaction_data.array, 'changes');
    all_changhes = concatArray(all_changhes);
  var models = spv.filter(all_changhes, 'target');
  var i;

  if (!view.changes_number) {
    view.changes_number = 0;
  }

  view.changes_number++;

  var changes_number = view.changes_number;

  view.markAnimationStart(models, changes_number);

  var doomed = needsDestroing(all_changhes);
  for (i = doomed.length - 1; i >= 0; i--) {
    view.removeChildViewsByMd(view.getStoredMpx(doomed[i]), 'map_slice');
  }

  for (i = 0; i < all_changhes.length; i++) {
    var change = all_changhes[i];
    var handler = view['model-mapch'][change.type];
    if (handler){
      handler.call(view, change);
    }
  }

  if (transaction_data.bwlev){
    var target_md = transaction_data.bwlev.getMD();
    var current_lev_num = pv.state(target_md, 'map_level_num');

    if (animation_data){
      pv.update(view, 'disallow_animation', true, sync_opt);
      animation_data.lc.c.css(animation_data.transform_values);
      pv.update(view, 'disallow_animation', false, sync_opt);
    }

    pv.update(view, 'current_lev_num', current_lev_num, sync_opt);
    //сейчас анимация происходит в связи с сменой класса при изменении состояния current_lev_num

    if (animation_data && animation_data.lc){
      animation_data.lc.c.height(); //заставляем всё пересчитать
      animation_data.lc.c.css(empty_transform_props);
      /*view.nextLocalTick(function() {

      });*/
      animation_data.lc.c.height(); //заставляем всё пересчитать
    }

  }
  var completeAnimation = function() {
    view.markAnimationEnd(models, changes_number);
  };
  setTimeout(completeAnimation, 16*21*4);
  if (!animation_data){
    completeAnimation();
  } else {
    animation_data.lc.onTransitionEnd(completeAnimation);
  }
};

});
