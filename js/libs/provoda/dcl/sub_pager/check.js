define(function(require) {
'use strict';

var getSubpageItem = require('./getSubpageItem');

return function checkSubpager(self, props) {
	var sub_pager = props.sub_pager;

	if (!sub_pager) {
		return;
	}

	if (sub_pager.item && sub_pager.by_type) {
		throw new Error('can`t be both `item` and `by_type`');
	}

	self._sub_pager = {
		key: null,
		item: null,
		by_type: null,
		type: null,
		can_be_reusable: null,
	};

	self._sub_pager.key = sub_pager.key;

	self._chi_sub_pager = {};

	if (sub_pager.item) {
		var item = getSubpageItem(sub_pager.item, 'sub-pager-item');
		self._sub_pager.item = item;
		self._chi_sub_pager[item.key] = item.constr;
		self._sub_pager.can_be_reusable = canBeReusable(item.constr);
	} else {
		self._sub_pager.type = sub_pager.type;
		self._sub_pager.by_type = {};
		var can_be_reusable = false;
		for (var type in sub_pager.by_type) {
			var cur = self._sub_pager.by_type[type] = getSubpageItem(sub_pager.by_type[type], 'sub-pager-by_type-' + type, true);
			self._chi_sub_pager[cur.key] = cur.constr;
			can_be_reusable = can_be_reusable || canBeReusable(cur.constr);
		}
		self._sub_pager.can_be_reusable = can_be_reusable;
	}

};

function canBeReusable(constr) {
	return Boolean(constr.prototype.hasComplexStateFn('$$reusable_url'));
}
});
