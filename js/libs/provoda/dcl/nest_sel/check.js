define(function(require) {
'use strict';
var push = Array.prototype.push;
var spv = require('spv');
var getShortStateName = require('../../utils/getShortStateName');
var getPropsPrefixChecker = require('../../utils/getPropsPrefixChecker');
var NestingSourceDr = require('../../utils/NestingSourceDr');

var NestWatch = require('../../nest-watch/NestWatch');

var NestSelector = require('./NestSelector');
var getParsedPath = require('../../initDeclaredNestings').getParsedPath;
var handleChdDeepState = NestSelector.handleChdDeepState;
var handleChdCount = NestSelector.handleChdCount;
var handleAdding = NestSelector.handleAdding;
var handleRemoving = NestSelector.handleRemoving;
var rerun = NestSelector.rerun;

var endsWith = spv.endsWith;
// var constr_mention = require('../structure/constr_mention');

var getUnprefixed = spv.getDeprefixFunc( 'nest_sel-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

// var nestConstructor = constr_mention.nestConstructor;

var SelectNestingDeclaration = function(dest_name, data) {
	this.map = null;
	if (data.map) {
		this.map = typeof data.map == 'string' ? getParsedPath(data.map) : data.map;
	}
	var nesting_source = new NestingSourceDr(data.from);

	this.start_point = nesting_source.start_point;
	this.from = nesting_source.selector;
	this.dest_name = dest_name;
	this.deps_dest = null;
	this.source_state_names = null;
	this.args_schema = null;
	this.selectFn = null;
	this.sortFn = null;

	this.deps = getDeps(data, this.map);

	if (data.sort) {
		this.sortFn = data.sort[1];
	}

	if (Array.isArray(data.where)) {
		this.args_schema = getArgsSchema(data.where[0]);

		if (typeof data.where[1] !== 'function') {
			throw new Error('where[1] should be func');
		}
		this.selectFn = data.where[1];

		this.nwbase = new NestWatch(nesting_source, this.deps.deep.all.shorts, null, null, {
			onchd_count: handleChdCount,
			onchd_state: handleChdDeepState
		}, handleAdding, handleRemoving);
	} else if (this.map) {
		this.nwbase = new NestWatch(nesting_source, this.deps.deep.all.shorts, null, null, {
			onchd_count: handleChdCount,
			onchd_state: rerun
		});
	} else {
		throw new Error();
	}


};

var types = ['sort', 'map', 'cond'];

function combineStates(obj) {
	var result = {
		list: [],
		shorts: [],
	};

	for (var i = 0; i < types.length; i++) {
		var cur = types[i];
		if (obj[cur]) {
			push.apply(result.list, obj[cur].list);
			push.apply(result.shorts, obj[cur].shorts);
		}
	}

	return result;
}


function getDeps(data, map) {
	var base = {all: null};
	var deep = {all: null};

	getConditinal(base, deep, data.where);
	getMap(base, deep, map);
	getSort(base, deep, data.sort);

	base.all = combineStates(base);
	deep.all = combineStates(deep);

	return {
		base: base,
		deep: deep,
	};
}

function getMap(base, deep, map) {
	if (!map) {return;}

	deep.map = {
		list: map.states,
		shorts: map.states.map(getShortStateName)
	};
}

function getSort(base, deep, sort) {
	if (!sort) {return;}

	var state_names = getStates(sort[0]);
	deep.sort = state_names.deep;
	base.sort = state_names.base;
}


function getConditinal(base, deep, where) {
	if (!where) {return;}

	if (!Array.isArray(where)) {
		throw new Error('not implement type of `where`');
	}

	var state_names = getStates(where[0], true);
	deep.cond = state_names.deep;
	base.cond = state_names.base;
}

function getIndex(list) {
	var index = {};
	for (var i = 0; i < list.length; i++) {
		index[list[i]] = true;
	}
	return index;
}

function getStates(list, with_index) {
	var base = [];
	var deep = [];
	for (var i = 0; i < list.length; i++) {
		var cur = list[i];
		var state_name = isForDeep(cur);
		if (state_name) {
			deep.push(state_name);
		} else {
			base.push(cur);
		}
	}
	return {
		base: getComplect(base, with_index),
		deep: getComplect(deep, with_index)
	};
}

function getComplect(list, with_index) {
	if (!list.length) {return;}
	var shorts = list.map(getShortStateName);
	return {
		list: list,
		shorts: shorts,
		index: with_index
			? getIndex(shorts)
			: null
	};
}

function getArgsSchema(list) {
	var args_schema = [];
	for (var i = 0; i < list.length; i++) {
		var cur = list[i];
		var state_name = isForDeep(cur);
		if (state_name) {
			args_schema.push({
				type: 'deep',
				name: state_name
			});

		} else {
			args_schema.push({
				type: 'base',
				name: cur
			});

		}
	}
	return args_schema;
}

function isForDeep(name) {
	return endsWith(name, ":") && name.slice(0, -1);
}


return function checkNestSel(self, props) {
	if (!hasPrefixedProps(props)) {
		return;
	}

	self._chi_nest_sel = spv.cloneObj({}, self._chi_nest_sel);

  for (var name in props) {
  	var clean_name = getUnprefixed(name);
  	if (!clean_name) {
  		continue;
  	}

    self._chi_nest_sel[name] = new SelectNestingDeclaration(clean_name, props[name]);
  }

	self.nest_sel_nest_matches = [];

	for (var sel_res in self._chi_nest_sel) {
		self.nest_sel_nest_matches.push(self._chi_nest_sel[sel_res]);
	}
};
});
