define(function (require) {
'use strict';
var spv = require('spv');
return {
  getSTEVNameVIP: spv.getPrefixingFunc('vip_state_change-'),
  getSTEVNameDefault: spv.getPrefixingFunc('state_change-'),
  getSTEVNameLight: spv.getPrefixingFunc('lgh_sch-'),
  getFullChilChEvName: spv.getPrefixingFunc('child_change-'),
  wipeObj: function (obj){
    for (var p in obj){
      if (obj.hasOwnProperty(p)){
        delete obj[p];
      }
    }
  },
  nullObjValues: function(obj) {
    for (var p in obj){
      if (obj.hasOwnProperty(p)){
        obj[p] = null;
      }
    }
  },
  markFlowSteps: function(flow_steps, p_space, p_index_key) {
    for (var i = 0; i < flow_steps.length; i++) {
      flow_steps[i].p_space = p_space;
      flow_steps[i].p_index_key = p_index_key;
    }
  }
};
});
