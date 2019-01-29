define(function(require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var prsStCon = require('../prsStCon');
var initWatchList = require('../nest-watch/index').initList;
var initNestSel = require('../dcl/nest_sel/init');
var initNestConcat = require('../dcl/nest_conj/init');
var initNestCompx = require('../dcl/nest_compx/init');
var initApis = require('../dcl/api/init')


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

return function postInitModel(self) {
  connectStates(self)
  connectNests(self)

  initWatchList(self, self.st_nest_matches)

  initApis(self)
}
})
