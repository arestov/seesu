define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('../../helpers');
var getSubpageItem = require('./getSubpageItem');

var getUnprefixed = spv.getDeprefixFunc( 'sub_page-' );
var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

var buildOne = function(self, props) {
	var build_index = self._build_cache_subpage_one;

	self._build_cache_subpage_one = {};

	for (var prop_name in self) {
		var name = getUnprefixed(prop_name);
		if (!name) {
			continue;
		}

		var item;
		if (props.hasOwnProperty(prop_name)) {
			item = props[prop_name] && getSubpageItem(props[prop_name], 'sub-page-' + name);
		} else {
			item = build_index[name];
		}
		self._build_cache_subpage_one[name] = item;

	}


};

var buildMany = function(self) {
	self._build_cache_subpage_many = {};
	for (var prop_name in self.sub_page) {
		self._build_cache_subpage_many[prop_name] = getSubpageItem(self.sub_page[prop_name], 'sub-page-' + prop_name);
	}
};

return function collectSubpages(self, props) {
	var changed_singled = hasPrefixedProps(props);
	var changed_pack =!!props.sub_page;
	if (!changed_singled && !changed_pack) {
		return;
	}

	for (var prop in props.sub_page) {
		if (props['sub_page-' + prop]) {
			throw new Error('can`t be (in one layer) sub_page in both `sub_page` and "sub_page-"' + prop);
		}
	}

	if (changed_singled) {
		buildOne(self, props);
	}

	if (changed_pack) {
		buildMany(self);
	}

	var check = {};

	for (var key_sep in self._build_cache_subpage_one) {
		var sep = self._build_cache_subpage_one[key_sep];
		if (!sep) {
			continue;
		}
		check[key_sep] = sep;
	}

	for (var key_many in self._build_cache_subpage_many) {
		if (check[key_many]) {
			continue;
		}
		check[key_many] = self._build_cache_subpage_many[key_many];
	}

	self._chi_sub_pages = {};

	for (var page_name in check) {
		var cur = check[page_name];
		self._chi_sub_pages[cur.key] = cur.constr;
	}

	if (self._build_cache_sub_pages_side) {
		for (var side_name in self._build_cache_sub_pages_side) {
			check[side_name] = self._build_cache_sub_pages_side[side_name];
		}
	}

	self._sub_pages = check;


};
});
