define(function (require) {
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var getUnprefixed = spv.getDeprefixFunc( 'regfr-', true );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );


return function(self, props) {
  if (!hasPrefixedProps(props)){
    return;
  }
  var prop;

  self.reg_fires = {
    by_namespace: null,
    by_test: null,
    cache: null
  };
  for (prop in self){

    if (!getUnprefixed(prop)){
      continue;
    }

    var cur = self[prop];
    if (cur.event_name){
      if (!self.reg_fires.by_namespace){
        self.reg_fires.by_namespace = {};
      }
      self.reg_fires.by_namespace[cur.event_name] = cur;
    } else if (cur.test){
      if (!self.reg_fires.by_test){
        self.reg_fires.by_test = [];
      }
      self.reg_fires.by_test.push(cur);
    }
  }
};
});
