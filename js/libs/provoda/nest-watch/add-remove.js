define(function (require) {
'use strict';
var spv = require('spv');

var SublWtch = function SublWtch(nwatch, skip) {
  this.nwatch = nwatch;
  this.skip = skip;
};

var removeNestWatchs = function(item, array, one) {
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			cur.nwatch.one_item_mode = !!one;
			removeNestWatch(item, cur.nwatch, cur.skip + 1);
		}
};

var addNestWatchs = function(item, array, one) {
	for (var i = 0; i < array.length; i++) {
		var cur = array[i];
		cur.nwatch.one_item_mode = !!one;
		addNestWatch(item, cur.nwatch, cur.skip + 1);
	}
};

function checkNestWatchs(md, collection_name, array, removed) {
	if (md.nes_match_index && md.nes_match_index[collection_name]) {
		// console.log('match!', collection_name);
		var nwats = md.nes_match_index[collection_name];

		if (Array.isArray(removed)) {
			for (var i = 0; i < removed.length; i++) {
				if (!removed[i]) {continue;}
				removeNestWatchs(removed[i], nwats);
			}
		} else if (removed){
			removeNestWatchs(array, nwats, true);
		}


		if (Array.isArray(array)) {
			for (var i = 0; i < array.length; i++) {
				if (!array[i]) {continue;}
				addNestWatchs(array[i], nwats);
			}
		} else if(array) {
			addNestWatchs(array, nwats, true);
		}
	}
}

function addNestWatch(self, nwatch, skip) {
  if (!self.nes_match_handeled) {
    self.nes_match_handeled = {};
  }
  if (!self.nes_match_handeled[nwatch.num]) {
    self.nes_match_handeled[nwatch.num] = true;
  } else {
    return;
  }

  if (nwatch.selector.length == skip) {
    // console.log('full match!', self, nwatch);
    if (!nwatch.items_index) {
      nwatch.items_index = {};
    }
    nwatch.items_index[self._provoda_id] = self;
    nwatch.items_changed = true;
    if (nwatch.one_item_mode) {
      nwatch.one_item = self;
    }
    if (!self.states_links) {
      self.states_links = {};
    }
    addNWatchToSI(self.states_links, nwatch);

  } else {
    if (!self.nes_match_index) {
      self.nes_match_index = {};
    }

    var nesting_name = nwatch.selector[skip];
    if (!self.nes_match_index[nesting_name]) {
      self.nes_match_index[nesting_name] = [];
    }
    var subl_wtch = new SublWtch(nwatch, skip);

    self.nes_match_index[nesting_name].push(subl_wtch);


    if (self.children_models) {
      for (var nesting_name in self.children_models) {
        checkNestWatchs(self, nesting_name, self.children_models[nesting_name]);
      }
    }
  }

  var addHandler = nwatch.addHandler;
  if (addHandler) {
    addHandler(self, nwatch, skip);
  }
}

function removeNestWatch(self, nwatch, skip) {
  if (nwatch.selector.length == skip) {
    if (!nwatch.items_index) {
      return;
    }

    nwatch.items_index[self._provoda_id] = null;
    nwatch.items_changed = true;
    if (nwatch.one_item_mode && nwatch.one_item == self) {
      nwatch.one_item = null;
    }

    if (self.states_links) {
      removeNWatchFromSI(self.states_links, nwatch);
    }
    // console.log('full match!', this, nwa);
  } else {
    var nesting_name = nwatch.selector[skip];
    if (self.nes_match_index && self.nes_match_index[nesting_name]) {
      self.nes_match_index[nesting_name] = spv.findAndRemoveItem(self.nes_match_index[nesting_name], nwatch);
      // self.nes_match_index[nesting_name].remoVe();
    }
  }

  var removeHandler = nwatch.removeHandler;
  if (removeHandler) {
    removeHandler(self, nwatch, skip);
  }

}


function addNWOne(states_links, state_name, nwatch) {
	if (!states_links[state_name]) {
		states_links[state_name] = [];
	}
	states_links[state_name].push(nwatch);
}

function addNWatchToSI(states_links, nwatch) {
	if (Array.isArray(nwatch.short_state_name)) {
		for (var i = 0; i < nwatch.short_state_name.length; i++) {
			addNWOne(states_links, nwatch.short_state_name[i], nwatch);
		}
	} else {
		addNWOne(states_links, nwatch.short_state_name, nwatch);
	}
}

function removeOne(states_links, state_name, nwatch) {
	if (!states_links[state_name]) {
		return;
	}
	states_links[state_name] = spv.findAndRemoveItem(states_links[state_name], nwatch);
}

function removeNWatchFromSI(states_links, nwatch) {
	if (Array.isArray(nwatch.short_state_name)) {
		for (var i = 0; i < nwatch.short_state_name.length; i++) {
			removeOne(states_links, nwatch.short_state_name[i], nwatch);
		}
	} else {
		removeOne(states_links, nwatch.short_state_name, nwatch);
	}
}

return {
  addNestWatch: addNestWatch,
  removeNestWatch: removeNestWatch,
  checkNestWatchs: checkNestWatchs,
};

});
