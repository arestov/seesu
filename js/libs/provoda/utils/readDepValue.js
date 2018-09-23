define(function(require) {
'use strict';

var pvState = require('./state');

var parent = function(md, dep) {
  var count = dep.ancestors;
  var target = md;
  while (count){
    count--;
    target = target.getStrucParent();
  }
  if (!target){
    throw new Error();
  }

  return pvState(target, dep.state_name)
};

var root = function(md, dep) {
  var target = md.getStrucRoot();
  if (!target){
    throw new Error();
  }
  return pvState(target, dep.state_name)
}

var read = {
  parent: parent,
  root: root,
}

return {
  read: read,
  depValue: function(md, dep) {
    switch (dep.rel_type) {
      case "local_state": {
        return pvState(md, dep.state_name)
      }

      case "root": {
        return root(md, dep)
      }

      case "parent": {
        return parent(md, dep)
      }
    }
  }
}
})
