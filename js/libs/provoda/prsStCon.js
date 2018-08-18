define(function(require) {
'use strict';

var bind = {
  root: function(bind) {
    return function(md, instructions) {
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

        bind(md, target, cur.state_name, cur.full_name)
      }
    }
  },
  parent: function(bind) {
    return function(md, instructions) {
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

        bind(md, target, cur.state_name, cur.full_name)
      }

    }
  }
}

var copyStates = function(md, target, state_name, full_name) {
  md.wlch(target, state_name, full_name);
}

  var pvState = require('./utils/state');



  return {
    bind: bind,
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
      nesting: function() {},
      parent: bind.parent(copyStates),
      root: bind.root(copyStates),
    }
  };
});
