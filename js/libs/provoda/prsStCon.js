define(function(require) {
'use strict';
  var pvState = require('./utils/state');
  return {
    prefill: {
      parent: function (md, states_list) {
        var list = md.conndst_parent;
        if (!list){
          return;
        }

        for (var i = 0; i < list.length; i++) {
          var cur = list[i];
          var count = cur.ancestors;
          var target = md;
          while (count){
            count--;
            target = target.getStrucParent();
          }
          if (!target){
            throw new Error();
          }
          states_list.push(true, cur.full_name, pvState(target, cur.state_name));
        }
      },
      root: function (md, states_list) {
        var list = md.conndst_root;
        if (!list){
          return;
        }
        for (var i = 0; i < list.length; i++) {
          var cur = list[i];
          var target = md.getStrucRoot();
          if (!target){
            throw new Error();
          }
          states_list.push(true, cur.full_name, pvState(target, cur.state_name));
        }
      }
    },
    connect: {
      parent: function(md, instructions) {
        var list = instructions.conndst_parent;
        if (!list){
          return;
        }
        for (var i = 0; i < list.length; i++) {
          var cur = list[i];
          var count = cur.ancestors;
          var target = md;
          while (count){
            count--;
            target = target.getStrucParent();
          }
          if (!target){
            throw new Error();
          }
          md.wlch(target, cur.state_name, cur.full_name);
        }

      },
      nesting: function() {},
      root: function(md, instructions) {
        var list = instructions.conndst_root;
        if (!list){
          return;
        }
        for (var i = 0; i < list.length; i++) {
          var cur = list[i];
          var target = md.getStrucRoot();
          if (!target){
            throw new Error();
          }
          md.wlch(target, cur.state_name, cur.full_name);
        }

      }
    }
  };
});
