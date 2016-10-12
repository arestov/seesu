define(['spv', '../helpers', '../utils/standartNWH', '../utils/getStateWriter'],function(spv, hp, standart, getStateWriter){
'use strict';

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
		// this.zip_name = nwatch.zip_func;
		this.distance = 0;
		this.callback = nwatch.handler; // mainely for 'stch-'

		this.state_handler = nwatch.handle_state_change;
		// handle state change

		this.handler = nwatch.handle_count_or_order_change;
		// handle count/order change

		this.addHandler = nwatch.addHandler;
		this.removeHandler = nwatch.removeHandler;

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
