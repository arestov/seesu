define(function (require) {
'use strict';
var checkNestWatchs = require('./add-remove').checkNestWatchs;

return function checkNesting(self, collection_name, array, removed) {
  checkNestWatchs(self, collection_name, array, removed);

  var changed_nawchs = checkChangedNestWatchs(self, collection_name);
  //var calls_flow = (opts && opts.emergency) ? main_calls_flow : self.sputnik._getCallsFlow();
  var calls_flow = self._getCallsFlow();
  if (changed_nawchs) {
    for (var i = 0; i < changed_nawchs.length; i++) {
      var cur = changed_nawchs[i];
      calls_flow.pushToFlow(null, cur, null, array, cur.handler, null, self.current_motivator);
    }
  }
};

function checkChangedNestWatchs(md, collection_name) {
	if (md.nes_match_index && md.nes_match_index[collection_name]) {
		// console.log('match!', collection_name);
		var nwats = md.nes_match_index[collection_name];

		var result = [];
		for (var i = 0; i < nwats.length; i++) {
			var cur = nwats[i].nwatch;
			if (cur.items_changed) {
				result.push(cur);
				// console.log(cur.selector, cur);
			}

		}

		return result.length && result;
	}
}
});
