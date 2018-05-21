define(function (require) {
'use strict';
var LocalWatchRoot = require('./LocalWatchRoot');
var addFrom = require('./addFrom');
var checkNesting = require('./checkNesting');
var checkStates = require('./checkStates');
var initNestSel = require('../dcl/nest_sel/init');
var initNestConcat = require('../dcl/nest_conj/init');

function initList(self, list) {
  self.states_links = self.states_links || null;
  self.nes_match_index = self.nes_match_index || null;

  if (!list) {
    return;
  }

  for (var i = 0; i < list.length; i++) {
    addFrom(self, new LocalWatchRoot(self, list[i]), 0);
  }
}

function init(self) {
  initNestSel(self);
  initNestConcat(self);

  initList(self, self.nest_match)
}


return {
  init: init,
  checkNesting: checkNesting,
  checkStates: checkStates,
};

});
