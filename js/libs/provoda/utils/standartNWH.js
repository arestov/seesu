define(function () {
'use strict';

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
		// TODO: FIX. LOOSING ORDER OF LIST HERE BY WRITING FIELDS IN RANDOM ORDER!?!?
		lnwatch.items.push(lnwatch.items_index[provoda_id]);
	}
	return lnwatch;
};


return function standart(callback) {
	return function standart(motivator, fn, lnwatch, args) {
		buildItems(lnwatch);
		var md = lnwatch.md;
		var old_value = md.current_motivator;
		md.current_motivator = motivator;

		var items = lnwatch.one_item_mode ? ( lnwatch.state_name ? [lnwatch.one_item] : lnwatch.one_item ) : lnwatch.items;

		callback(md, items, lnwatch, args, motivator, fn);

		md.current_motivator = old_value;
	};
};
});
