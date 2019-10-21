define(function(require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var prsStCon = require('../prsStCon');
var initWatchList = require('../nest-watch/index').initList;
var initNestSel = require('../dcl/nest_sel/init');
var initNestConcat = require('../dcl/nest_conj/init');
var initNestCompx = require('../dcl/nest_compx/init');
var initApis = require('../dcl/effects/legacy/api/init')
var __handleInit = require('../dcl/passes/handleInit/handle');


function connectStates(self) {
  // prefill own states before connecting relations
  self.__initStates();

  prsStCon.connect.parent(self, self);
  prsStCon.connect.root(self, self);
  prsStCon.connect.nesting(self, self);

  initWatchList(self, self.compx_nest_matches)
}

function connectNests(self) {
  if (self.nestings_declarations) {
    self.nextTick(initDeclaredNestings, null, false, self.current_motivator);
  }

  initNestSel(self);
  initNestConcat(self);
  initNestCompx(self);
}

function markInitied(md) {
  // - this state shuld be true when all preparations, all initial triggers and subscribtions are done
  // - use it to not produce effects for states changes during initialization
  md.updateState('$meta_inited', true);
}

return function postInitModel(self) {
  connectStates(self)
  connectNests(self)

  initWatchList(self, self.st_nest_matches)


  if (self.init_v2_data) {
    __handleInit(self, self.init_v2_data)
    self.init_v2_data = null
  } else {
    __handleInit(self, null)
  }

  initApis(self)

  self.nextTick(markInitied, null, false, self.current_motivator);
}
})
