define(function (require) {
'use strict';
var LocalWatchRoot = require('./LocalWatchRoot');
var addFrom = require('./addFrom');
var checkNesting = require('./checkNesting');
var checkStates = require('./checkStates');

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

return {
  initList: initList,
  checkNesting: checkNesting,
  checkStates: checkStates,
};

});
