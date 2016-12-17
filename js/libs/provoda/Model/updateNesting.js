define(function (require) {
'use strict';
var spv = require('spv');
var hp = require('../helpers');
var StatesLabour = require('../StatesLabour');
var updateProxy = require('../updateProxy');
var checkNesting =  require('../nest-watch/index').checkNesting;
var markNestingParticipation = require('./markNestingParticipation');
var pvUpdate = updateProxy.update;
var cloneObj = spv.cloneObj;

var hasDot = spv.memorize(function(nesting_name) {
  return nesting_name.indexOf('.') != -1;
});

return function updateNesting(self, collection_name, array, opts, spec_data) {
  if (hasDot(collection_name)){
    throw new Error('remove "." (dot) from name');
  }

  var zdsv = self.zdsv;
  if (zdsv) {
    zdsv.abortFlowSteps('collch', collection_name);
  }

  if (Array.isArray(array)){
    array = array.slice(0);
  }
  if (!self.children_models) {
    self.children_models = {};
  }

  var old_value = self.children_models[collection_name];
  self.children_models[collection_name] = array;

  if (old_value && array) {
    var arr1 = Array.isArray(old_value);
    var arr2 = Array.isArray(array);
    if (arr1 != arr2) {
      throw new Error('nest type must be stable');
    }
  }

  var removed = hp.getRemovedNestingItems(array, old_value);

  markNestingParticipation(self, collection_name, array, removed);

  checkNesting(self, collection_name, array, removed);
  // !?



  var full_ev_name = hp.getFullChilChEvName(collection_name);

  var chch_cb_cs = self.evcompanion.getMatchedCallbacks(full_ev_name);

  if (chch_cb_cs.length) {
    if (!self.zdsv) {
      self.zdsv = new StatesLabour(!!self.full_comlxs_index, self._has_stchs);
      //debugger;
    }
    zdsv = self.zdsv;
    var flow_steps = zdsv.createFlowStepsArray('collch', collection_name);


    var event_obj = {
      value: null,
      old_value: null,
      target: null,
      nesting_name: collection_name
    };
    if (typeof opts == 'object'){
      cloneObj(event_obj, opts);
    }
    //opts = opts || {};
    event_obj.value = array;
    event_obj.old_value = old_value;
    event_obj.target = self;
    //self.trigger(full_ev_name, event_obj);

    self.evcompanion.triggerCallbacks(chch_cb_cs, false, false, full_ev_name, event_obj, flow_steps);

    hp.markFlowSteps(flow_steps, 'collch', collection_name);

  }

  if (!opts || !opts.skip_report){
    self.sendCollectionChange(collection_name, array, old_value, removed);
  }

  var count = Array.isArray(array)
    ? array.length
    : (array ? 1 : 0);

  pvUpdate(self, collection_name + '$length', count);
  pvUpdate(self, collection_name + '$exists', Boolean(count));

  return self;
}
});
