define(function(require){
'use strict';

var spv = require('spv');
var getTypedDcls = require('../dcl-h/getTypedDcls');
var collectCompxs = require('../StatesEmitter/collectCompxs');
var checkChi = require('../StatesEmitter/checkChi');
var checkNestRqC = require('../StatesEmitter/checkNestRqC');
var checkNestSel = require('../dcl/nest_sel/check');
var checkNestCnt = require('../dcl/nest_conj/check');
var checkModernNests = require('../dcl/nests/check');
var checkPasses = require('../dcl/passes/check')
var checkSubpager = require('../dcl/sub_pager/check');
var collectSubpages = require('../dcl/sub_pager/collectSubpages');

var checkEffects = require('../dcl/effects/check')
var checkNest = require('../dcl/nest/check');
var collectStateChangeHandlers= require('../dcl/m-collectStateChangeHandlers');

var updateStatesDcls = function(self, props, original) {
  if (!props['+states']) {
    return;
  }
  var original_ext = original.__states_dcls || {};
  var __states_dcls = spv.cloneObj({}, original_ext);
  __states_dcls = spv.cloneObj(__states_dcls, props['+states']);
  self.__states_dcls = __states_dcls;

  /*
  {
    '+states': {
      full_name: null
    }
  }

  should remove cache for `full_name` (compx, effect, ect)

  */
};

var check = /initStates/gi;

var checkSideeffects = function(self, props, typed_state_dcls, params) {

  collectStateChangeHandlers(self, props, typed_state_dcls);
  checkEffects(self, props, typed_state_dcls)

  var init = params && params.init || props.init;
  if (init) {
    if (init.length > 2 && !self.hasOwnProperty('network_data_as_states')) {
      self.network_data_as_states = false;
    }
    if (self.toString().search(check) != -1) {
      self.manual_states_init = true;
    }
  }
}

var checkNests = function(self, props) {
  checkNestRqC(self, props);
  checkNestSel(self, props);
  checkNestCnt(self, props);
  checkNest(self, props);
  checkModernNests(self, props)
}

return function(self, props, original, params) {
  updateStatesDcls(self, props, original);
  var typed_state_dcls = getTypedDcls(props['+states']) || {};

  checkSideeffects(self, props, typed_state_dcls, params)

  collectCompxs(self, props, typed_state_dcls && typed_state_dcls['compx']);

  collectSubpages(self, props);
  checkSubpager(self, props);

  checkNests(self, props)

  checkPasses(self, props)


  checkChi(self, props);

};

});
