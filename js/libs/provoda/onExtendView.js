define(function (require) {
'use strict';
var spv = require('spv');
var cloneObj = spv.cloneObj;

var checkApis = require('./StatesEmitter/checkApis');
var checkSubpager = require('./StatesEmitter/checkSubpager');
var collectSubpages = require('./StatesEmitter/collectSubpages');
var collectCompxs = require('./StatesEmitter/collectCompxs');
var checkChi = require('./StatesEmitter/checkChi');
var checkNestRqC = require('./StatesEmitter/checkNestRqC');
var checkNestSel = require('./StatesEmitter/checkNestSel');

var collectBaseExtendStates = require('./dcl/collectBaseExtendStates');


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

var xxxx_morph_props = [['hp_bound','--data--'], 'data_by_urlname', 'data_by_hp', 'head_by_urlname', 'netdata_as_states'];

return function(self, props, original) {
  checkApis(self, props);

	if (self.changeDataMorphDeclarations) {
		self.changeDataMorphDeclarations(props);
	}

	if (self.collectStateChangeHandlers){
		self.collectStateChangeHandlers(props);
	}
	var collches_modified;
	if (self.collectCollectionChangeDeclarations){
		collches_modified = self.collectCollectionChangeDeclarations(props);
	}
	if (self.collectSelectorsOfCollchs) {
		self.collectSelectorsOfCollchs(props);
	}
	collectCompxs(self, props);
	collectSubpages(self, props);
	checkSubpager(self, props);
	checkChi(self, props);
	checkNestRqC(self, props);
	checkNestSel(self, props);



	if (self.hasOwnProperty('st_nest_matches') || self.hasOwnProperty('compx_nest_matches')) {
		self.nest_match = (self.st_nest_matches || []).concat(self.compx_nest_matches || []);
	}

	var base_tree_mofified = props.hasOwnProperty('base_tree');
	if (base_tree_mofified) {
		self.base_tree_list = getBaseTreeCheckList(props.base_tree);
	}
	if (collches_modified || base_tree_mofified) {
		collectBaseExtendStates(self);
	}

	if (self.collectNestingsDeclarations) {
		self.collectNestingsDeclarations(props);
	}

	if (self.changeChildrenViewsDeclarations) {
		self.changeChildrenViewsDeclarations(props);
	}


	for (var i = 0; i < xxxx_morph_props.length; i++) {
		// если есть декларации - парсим, делаем функции
		// на вход функции - одна структура, на выход - другая
		var cur = xxxx_morph_props[i];
		var cur_name = Array.isArray(cur) ? cur[0] : cur;
		var subfield = Array.isArray(cur) && cur[1];
		if (props.hasOwnProperty(cur_name)) {
			if (typeof self[cur_name] != 'function' && self[cur_name] !== true) {
				var obj = {
					props_map: self[cur_name]
				};
				if (subfield) {
					obj.source = subfield;
				}
				self[cur_name] = spv.mmap(obj);
			}

		}
	}

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
