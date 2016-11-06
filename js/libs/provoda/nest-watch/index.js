define(function (require) {
'use strict';
var LocalWatchRoot = require('./LocalWatchRoot');
var addFrom = require('./addFrom');
var checkNesting = require('./checkNesting');
var checkStates = require('./checkStates');
var initNestSel = require('../StatesEmitter/initNestSel');

function init(self) {
  self.states_links = null;
  self.nes_match_index = null;

  initNestSel(self);

  if (self.nest_match) {
    for (var i = 0; i < self.nest_match.length; i++) {
      addFrom(self, new LocalWatchRoot(self, self.nest_match[i]), 0);
    }
  }
}


return {
  init: init,
  checkNesting: checkNesting,
  checkStates: checkStates,
};

});