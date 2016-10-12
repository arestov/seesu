define(['spv', '../helpers', '../updateProxy'],function(spv, hp, updateProxy){
'use strict';

var lw_count = 0;
var buildItems = function(lnwatch) {
	if (!lnwatch.items_changed) {return;}
	lnwatch.items_changed = false;

	if (lnwatch.items) {
		lnwatch.items.length = 0;
	}

	if (lnwatch.one_item_mode) {
		return lnwatch;
	}

	if (!lnwatch.items) {
		lnwatch.items = [];
	}




	for (var provoda_id in lnwatch.items_index) {
		if (!lnwatch.items_index[provoda_id]) {
			continue;
		}
		lnwatch.items.push(lnwatch.items_index[provoda_id]);
	}
	return lnwatch;
};

var pvState = hp.state;
var pvUpdate = updateProxy.update;

var stateOf = spv.memorize(function(state_name) {
	return function(md) {
		return pvState(md, state_name);
	};
});

var stateG = function(callback) {
	return function(state_name) {
		return callback(stateOf(state_name));
	};
};

var toZipFunc = function(toValue) {
	return spv.memorize(stateG(toValue));
};

var map = toZipFunc(function(state) {
	return function(array) {
		return array && array.map(state);
	};
});

var some = toZipFunc(function(state) {
	return function(array) {
		return array.some(state);
	};
});

var every = toZipFunc(function(state) {
	return function(array) {
		return array.every(state);
	};
});

var one = toZipFunc(function(state) {
	return function(array) {
		return array[0] && state(array[0]);
	};
});

var arrayClone = function(array) {
	if (Array.isArray(array)) {
		return array.slice(0);
	} else {
		return array;
	}
};


var getZipFunc = spv.memorize(function(state_name, zip_name) {
	if (!state_name) {
		return arrayClone;
	}

	if (!zip_name) {
		return map(state_name);
	} else {
		switch (zip_name) {
			case 'one': {
				return one(state_name);
			}
			case 'some': {
				return some(state_name);
			}
			case 'every': {
				return every(state_name);
			}
			default: {
				throw new Error('unknow zip func ' + zip_name);
			}
		}
	}
}, function(state_name, zip_name) {
	return (state_name || "") + '-' + (zip_name || "");
});

function hdkey(full_name, state_name, zip_func) {
	return (full_name || '') + '-' + (state_name || '') + '-' + (zip_func || '');
}

function standart(callback) {
	return function standart(motivator, fn, context, args, lnwatch) {
		buildItems(lnwatch);
		var md = lnwatch.md;
		var old_value = md.current_motivator;
		md.current_motivator = motivator;

		var items = lnwatch.one_item_mode ? ( lnwatch.state_name ? [lnwatch.one_item] : lnwatch.one_item ) : lnwatch.items;

		callback(md, items, lnwatch, args, motivator, fn, context);

		md.current_motivator = old_value;
	};
}

var wrapper = standart(function wrapper(md, items, lnwatch) {
	var callback = lnwatch.callback;
	callback(md, null, null, {
		items: items,
		item: null
	});
});

var getStateWriter = spv.memorize(function(full_name, state_name, zip_name) {
	var zip_func = getZipFunc(state_name, zip_name);
	return standart(function stateHandler(md, items) {
		pvUpdate(md, full_name, items && zip_func(items));
	});
}, hdkey);


var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
	if (!args.length) {return;}
	var callback = lnwatch.callback;
	callback(md, args[1], args[2], {
		items: items,
		item: args[3]
	});
});


return function LocalWatchRoot(md, nwatch, data) {
		this.num = ++lw_count;
		this.selector = nwatch.selector;

		var full_name = nwatch.full_name;
		this.md = md;
		this.state_name = nwatch.state_name;
		this.short_state_name = nwatch.short_state_name;
		// this.itemChange = handler;
		this.items_changed = false;
		this.items_index = null;
		this.items = null;
		this.one_item = null;
		this.one_item_mode = false;

		this.state_handler = nwatch.state_handler;
		this.zip_name = nwatch.zip_func;
		this.distance = 0;
		this.callback = nwatch.handler; // mainely for 'stch-'

		// если есть full_name значит нам надо записать новое состояние
		// если нет, значит просто передать массив в пользовательскую функцию
		var full_name_handler = full_name && getStateWriter(full_name, this.state_name, this.zip_name);

		this.state_handler = this.state_name ? ( full_name ? full_name_handler : stateHandler) : null;
		// handle state change

		this.handler = full_name ? full_name_handler : wrapper;
		// handle count/order change

		this.addHandler = nwatch.addHandler;
		this.removeHandler = nwatch.removeHandler;

		if (!full_name) {
			// debugger;
		}

		if (!this.handler) {
			// debugger;
		}

		this.data = data;
		// если есть state_name значит массив будет состоять не из моделей
		// а из состояния этих моделей с соостветствующим названим


		// if (cur.state_name) {
		// 			md.archivateChildrenStates(cur.nesting_name, cur.state_name, cur.zip_func, cur.full_name);
		// 		} else {
		// 			watchNestingAsState(md, cur.nesting_name, cur.full_name);
		// 		}

		this.nwatch = nwatch;
	};
});
