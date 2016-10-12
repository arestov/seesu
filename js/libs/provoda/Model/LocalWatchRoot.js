define(['spv', '../helpers', '../utils/standartNWH', '../utils/getStateWriter'],function(spv, hp, standart, getStateWriter){
'use strict';

var wrapper = standart(function wrapper(md, items, lnwatch) {
	var callback = lnwatch.callback;
	callback(md, null, null, {
		items: items,
		item: null
	});
});


var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
	if (!args.length) {return;}
	var callback = lnwatch.callback;
	callback(md, args[1], args[2], {
		items: items,
		item: args[3]
	});
});

var lw_count = 0;
return function LocalWatchRoot(md, nwatch, data) {
		this.num = ++lw_count;
		this.selector = nwatch.selector;
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

		var full_name = nwatch.full_name;
		// если есть full_name значит нам надо записать новое состояние
		// если нет, значит просто передать массив в пользовательскую функцию
		var full_name_handler = full_name && getStateWriter(full_name, this.state_name, this.zip_name);


		var handle_state_change = this.state_name ? ( full_name ? full_name_handler : stateHandler) : null;
		var handle_count_or_order_change = full_name ? full_name_handler : wrapper;

		this.state_handler = handle_state_change;
		// handle state change

		this.handler = handle_count_or_order_change;
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
