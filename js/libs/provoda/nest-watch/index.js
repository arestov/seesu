define(function (require) {
'use strict';
var LocalWatchRoot = require('./LocalWatchRoot');
var addFrom = require('./addFrom');
var checkNesting = require('./checkNesting');
var checkStates = require('./checkStates');
var initNestSel = require('../dcl/nest_sel/init');
var initNestConcat = require('../dcl/nest_conj/init');

function initList(self, list) {
  if (!list) {
    return;
  }

  for (var i = 0; i < list.length; i++) {
    addFrom(self, new LocalWatchRoot(self, list[i]), 0);
  }
}

function init(self) {
  self.states_links = null;
  self.nes_match_index = null;

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
