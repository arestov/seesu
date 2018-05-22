define(function(require){
'use strict';

var spv = require('spv');
var getTypedDcls = require('../dcl-h/getTypedDcls');
var checkApis = require('../StatesEmitter/checkApis');
var collectCompxs = require('../StatesEmitter/collectCompxs');
var checkChi = require('../StatesEmitter/checkChi');
var checkNestRqC = require('../StatesEmitter/checkNestRqC');
var checkNestSel = require('../dcl/nest_sel/check');
var checkNestCnt = require('../dcl/nest_conj/check');
var checkSubpager = require('../dcl/sub_pager/check');
var collectSubpages = require('../dcl/sub_pager/collectSubpages');

var changeDataMorphDeclarations = require('../dcl/changeDataMorphDeclarations');
var collectNestingsDeclarations = require('../dcl/collectNestingsDeclarations');
var collectStateChangeHandlers= require('../dcl/m-collectStateChangeHandlers');

var xxxx_morph_props = ['head_by_urlname', 'netdata_as_states'];

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
return function(self, props, original, params) {
  updateStatesDcls(self, props, original);
  var typed_state_dcls = getTypedDcls(props['+states']) || {};

  checkApis(self, props, typed_state_dcls);

  changeDataMorphDeclarations(self, props, typed_state_dcls);
  collectStateChangeHandlers(self, props, typed_state_dcls);

  collectCompxs(self, props, typed_state_dcls && typed_state_dcls['compx']);
  collectSubpages(self, props);
  checkSubpager(self, props);
  checkChi(self, props);

  checkNestRqC(self, props);
  checkNestSel(self, props);
  checkNestCnt(self, props);
  collectNestingsDeclarations(self, props);

  for (var i = 0; i < xxxx_morph_props.length; i++) {
    // если есть декларации - парсим, делаем функции
    // на вход функции - одна структура, на выход - другая
    var cur = xxxx_morph_props[i];
    var cur_name = Array.isArray(cur) ? cur[0] : cur;
    if (props.hasOwnProperty(cur_name)) {
      if (typeof self[cur_name] != 'function' && self[cur_name] !== true) {
        var obj = {
          props_map: self[cur_name]
        };
        self[cur_name] = spv.mmap(obj);
      }

    }
  }

  var init = params && params.init || props.init;
  if (init) {
    if (init.length > 2 && !self.hasOwnProperty('network_data_as_states')) {
      self.network_data_as_states = false;
    }
    if (self.toString().search(check) != -1) {
      self.manual_states_init = true;
    }
  }

};

});
