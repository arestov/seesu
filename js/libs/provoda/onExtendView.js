define(function (require) {
'use strict';
var spv = require('spv');
var cloneObj = spv.cloneObj;

var checkApis = require('./StatesEmitter/checkApis');
var collectCompxs = require('./StatesEmitter/collectCompxs');
var collectSelectorsOfCollchs = require('./dcl/collectSelectorsOfCollchs');
var collectCollectionChangeDeclarations = require('./dcl/collectCollectionChangeDeclarations');
var changeChildrenViewsDeclarations = require('./dcl/changeChildrenViewsDeclarations');
var collectStateChangeHandlers = require('./dcl/v-collectStateChangeHandlers');

var getBaseTreeCheckList = function(start) {
	var i, result = [];
	var chunks_counter = 0;
	var all_items = [null, start];

	while (all_items.length) {


		var cur_parent = all_items.shift();
		var cur = all_items.shift();

		cur.parent = cur_parent;
		cur.chunk_num = chunks_counter;

		if (cur.children_by_selector) {
			for (i = cur.children_by_selector.length - 1; i >= 0; i--) {
				all_items.push( cur, cur.children_by_selector[i] );
			}
		}

		if (cur.children_by_anchor) {
			for (i = cur.children_by_anchor.length - 1; i >= 0; i--) {
				all_items.push( cur, cur.children_by_anchor[i] );
			}

		}

		result.push( cur );
		chunks_counter++;


	}
	return result;

};

return function(self, props, original) {
  checkApis(self, props);

	collectStateChangeHandlers(self, props);
	collectCollectionChangeDeclarations(self, props);

	collectSelectorsOfCollchs(self, props);

	collectCompxs(self, props);

	if (self.hasOwnProperty('st_nest_matches') || self.hasOwnProperty('compx_nest_matches')) {
		self.nest_match = (self.st_nest_matches || []).concat(self.compx_nest_matches || []);
	}

	var base_tree_mofified = props.hasOwnProperty('base_tree');
	if (base_tree_mofified) {
		self.base_tree_list = getBaseTreeCheckList(props.base_tree);
	}

	changeChildrenViewsDeclarations(self, props);

	if (props.tpl_events) {
		self.tpl_events = {};
		cloneObj(self.tpl_events, original.tpl_events);
		cloneObj(self.tpl_events, props.tpl_events);
	}

	if (props.tpl_r_events) {
		self.tpl_r_events = {};
		cloneObj(self.tpl_r_events, original.tpl_r_events);
		cloneObj(self.tpl_r_events, props.tpl_r_events);
	}
};
});
