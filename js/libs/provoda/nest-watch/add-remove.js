define(function (require) {
'use strict';
var spv = require('spv');
var orderItems = require('./orderItems');

var SublWtch = function SublWtch(nwatch, skip, md, parent) {
  this.nwatch = nwatch;
  this.skip = skip;
  this.md = md;
  this.parent = parent;
  this.handeled_position = 0;
  this.position = 0;
  this.models_list = null;
};

function handlePosition(subw) {
  if (subw.position == subw.handeled_position) {
    return;
  }
  subw.handeled_position = subw.position;
  subw.nwatch.ordered_items_changed = true;

  var key = getKey(subw.md, subw.skip);
  if (subw.position == -1) {
    delete subw.nwatch.model_groups[key];
    subw.nwatch.handled_subl_wtchs[key] = false;
  }
}

function handleNestingChange(subw, array) {
  if (subw.skip + 1 != subw.nwatch.selector.length) {return;}

  subw.models_list = array;
  subw.nwatch.ordered_items_changed = true;
}

var removeNestWatchs = function(item, array, one) {
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			cur.nwatch.one_item_mode = !!one;
			removeNestWatch(item, cur.nwatch, cur.skip + 1);

      markPosition(cur.nwatch, cur.skip, item, -1);
		}
};

function noNesting(nwatch) {
  return !nwatch.selector.length;
}

function isDeepestLevel(nwatch, skip) {
  return nwatch.selector.length == skip;
}

function markPosition(nwatch, skip, md, num) {
  if (isDeepestLevel(nwatch, skip + 1)) {
    return;
  }
  var key = getKey(md, skip + 1);
  var subw = nwatch.model_groups[key];
  subw.position = num;
}

var addNestWatchs = function(item, array, one, num) {
  // one item and many nwatches
	for (var i = 0; i < array.length; i++) {
		var cur = array[i];
		cur.nwatch.one_item_mode = !!one;
		addNestWatch(item, cur.nwatch, cur.skip + 1, cur);

    markPosition(cur.nwatch, cur.skip, item, num);
	}
};

function checkNestWatchs(md, collection_name, array, removed) {
	if (!md.nes_match_index || !md.nes_match_index[collection_name]) {return;}
  // console.log('match!', collection_name);
  var nwats = md.nes_match_index[collection_name];

  if (Array.isArray(removed)) {
    for (var i = 0; i < removed.length; i++) {
      if (!removed[i]) {continue;}
      removeNestWatchs(removed[i], nwats, false);
    }
  } else if (removed){
    removeNestWatchs(array, nwats, true);
  }


  if (Array.isArray(array)) {
    for (var i = 0; i < array.length; i++) {
      if (!array[i]) {continue;}
      addNestWatchs(array[i], nwats, false, i);
    }
  } else if(array) {
    addNestWatchs(array, nwats, true, 0);
  }

  for (var i = 0; i < nwats.length; i++) {
    handlePosition(nwats[i]);
    handleNestingChange(nwats[i], (Array.isArray(array) || !array) ? array : [array], removed);
  }
}

function getKey(md, skip) {
  return md._provoda_id + '-' + skip;
}

function addNestWatch(self, nwatch, skip, parent_subl_wtch) {
  // задача кода:
  // установится для наблюдений за вложениями(1) и в конечном счёте за состояниями(2)
  // инвалидировать кеш для сброса результата

  if (!nwatch.handled_subl_wtchs) {
    nwatch.handled_subl_wtchs = {};
  }
  var key = getKey(self, skip);
  if (!nwatch.handled_subl_wtchs[key]) {
    nwatch.handled_subl_wtchs[key] = true;
  } else {
    return;
  }

  if (isDeepestLevel(nwatch, skip)) {
    // console.log('full match!', self, nwatch);
    if (!self.states_links) {
      self.states_links = {};
    }
    addNWatchToStatesIndex(self.states_links, nwatch);
    if (noNesting(nwatch)) {
      nwatch.ordered_items = self;
    }
  } else {
    if (!self.nes_match_index) {
      self.nes_match_index = {};
    }

    var nesting_name = nwatch.selector[skip];
    if (!self.nes_match_index[nesting_name]) {
      self.nes_match_index[nesting_name] = [];
    }

    var subl_wtch = new SublWtch(nwatch, skip, self, parent_subl_wtch);
    self.nes_match_index[nesting_name].push(subl_wtch);

    nwatch.model_groups = nwatch.model_groups || {};
    nwatch.model_groups[key] = subl_wtch;

    if (self.children_models) {
      for (var nesting_name in self.children_models) {
        checkNestWatchs(self, nesting_name, self.children_models[nesting_name]);
      }
    }

    if (skip === 0) {
      var calls_flow = self._getCallsFlow();
      calls_flow.pushToFlow(null, subl_wtch.nwatch, null, null, handleEndItems, null, self.current_motivator);
    }
  }

  var addHandler = nwatch.addHandler;
  if (addHandler) {
    addHandler(self, nwatch, skip);
  }
}


function handleEndItems(motivator, _, lnwatch) {
  orderItems(lnwatch);
  lnwatch.handler.call(null, motivator, null, lnwatch, null, lnwatch.ordered_items);
}


function removeNestWatch(self, nwatch, skip) {
  if (isDeepestLevel(nwatch, skip)) {
    if (self.states_links) {
      removeNWatchFromSI(self.states_links, nwatch);
    }
    if (noNesting(nwatch)) {
      nwatch.ordered_items = null;
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

function addNWatchToStatesIndex(states_links, nwatch) {
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
