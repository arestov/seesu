define(function (require) {
'use strict';
var pvState = require('../../utils/state');
var executeStringTemplate = require('../../initDeclaredNestings').executeStringTemplate;

var count = 1;
var NestSelector = function (md, declr) {
	this.num = 'nsel-' + (count++);
	this.md = md;
	this.items = [];
	this.declr = declr;

  this.items_changed = null;
	// this.waiting_chd_count = false;

  this.state_name = declr.deps.base.all.list;
  this.short_state_name = declr.deps.base.all.shorts;

	this.item_cond_index = null;
	this.item_cond_index = declr.selectFn && (declr.deps.base.cond || declr.deps.deep.cond) && {};
	this.deep_item_states_index = declr.selectFn && {};
	this.base_states = null;

	if (declr.selectFn && declr.deps.base.all.list) {
		var base_states = {};
		for (var i = 0; i < declr.deps.base.all.list.length; i++) {
			var cur = declr.deps.base.all.list[i];
			base_states[cur] = pvState(md, cur);
		}
		this.base_states = base_states;
	}

};

NestSelector.prototype.selector = [];
NestSelector.prototype.state_handler = handleChdDestState;

NestSelector.handleChdDeepState = handleChdDeepState;
NestSelector.handleChdCount = handleChdCount;
NestSelector.handleAdding = handleAdding;
NestSelector.handleRemoving = handleRemoving;
NestSelector.rerun = rerun;

function handleChdDestState(motivator, fn, nestsel, args) {
	// input - changed "dest" state
	// expected - invalidated all item conditions, rerunned query, updated nesting

	if (!nestsel.declr.selectFn) {
		return runFilter(motivator, nestsel);
	}

	var state_name = args[0];
	var value = args[1];

	var states = nestsel.base_states;
	states[state_name] = value;
	var base = nestsel.declr.deps.base;
	if (base.cond && base.cond.index[state_name] === true) {
		nestsel.item_cond_index = {};
	}

	runFilter(motivator, nestsel);
}

function handleChdDeepState(motivator, _, lnwatch, args) {
	// input - changed "deep source" state
	// expected - invalidated one item condition, rerunned query, updated nesting
	var state_name = args[0];
	var value = args[1];
	var md = args[3];

	var nestsel = lnwatch.data;
	var _provoda_id = md._provoda_id;
	var states = nestsel.deep_item_states_index[_provoda_id];
	states[state_name] = value;
	nestsel.deep_item_states_index[_provoda_id] = states;

	var deep = nestsel.declr.deps.deep;
	if (deep.cond && deep.cond.index[state_name] === true) {
		delete nestsel.item_cond_index[_provoda_id];
	}

	runFilter(motivator, nestsel);
}

function rerun(motivator, _, lnwatch) {
	var nestsel = lnwatch.data;
	runFilter(motivator, nestsel);
}

function checkCondition(nestsel, _provoda_id) {
	var deep_states = nestsel.deep_item_states_index[_provoda_id];
	var base_states = nestsel.base_states;
	var args_schema = nestsel.declr.args_schema;

	var args = new Array(args_schema.length);
	for (var i = 0; i < args_schema.length; i++) {
		var cur = args_schema[i];
		var value;
		switch (cur.type) {
			case 'deep':
				value = deep_states[cur.name];
				break;
			case 'base':
				value = base_states[cur.name];
				break;
			default:
				throw new Error('unknow type dep type');
		}
		args[i] = value;
	}
	return Boolean(nestsel.declr.selectFn.apply(null, args));
}


function isFine(md, nestsel) {
	var _provoda_id = md._provoda_id;
	if (!nestsel.item_cond_index.hasOwnProperty(_provoda_id)) {
		nestsel.item_cond_index[_provoda_id] = checkCondition(nestsel, _provoda_id);
	}
	return nestsel.item_cond_index[_provoda_id];
}

function switchDistant(do_switch, base, deep) {
	return do_switch ? deep : base;
}

function getMatchedItems(nestsel) {
	var dcl = nestsel.declr;
	var cond_base = dcl.deps.base.cond;
	var cond_deep = dcl.deps.deep.cond;
	if (!(cond_base && cond_base.list) && !(cond_deep && cond_deep.list)) {
		if (!dcl.map) {
			return nestsel.items;
		}

		if (typeof dcl.map === 'object') {
			if (!nestsel.items) {return;}
			var arr = new Array(nestsel.items.length);
			var distant = dcl.map.from_distant_model;
			for (var i = 0; i < nestsel.items.length; i++) {
				var cur = nestsel.items[i];
				var md_from = switchDistant(distant, nestsel.md, cur);
				var md_states_from = switchDistant(distant, cur, nestsel.md);

				arr[i] = executeStringTemplate(
					nestsel.md.app, md_from, dcl.map, false, md_states_from
				);
			}
			return arr;

		} else {
			throw new Error('unsupported map type');
		}
	}

	if (dcl.map) {
		throw new Error('implement map support');
	}


	if (!nestsel.items) {
		return;
	}
	var result = [];

	for (var i = 0; i < nestsel.items.length; i++) {
		var cur = nestsel.items[i];
		if (isFine(cur, nestsel)) {
			result.push(cur);
		}
	}

	return result;
}

function runFilter(motivator, nestsel) {
	// item_cond_index
	// deep_item_states_index
	// base_states
	var result = getMatchedItems(nestsel);
	if (result && nestsel.declr.sortFn) {
		// curretly just always sort
		result.sort(function (one, two) {
			return nestsel.declr.sortFn.call(null, one, two, nestsel.md);
		});
	}

	var md = nestsel.md;
	var old_motivator = md.current_motivator;
	md.current_motivator = motivator;
	md.updateNesting(nestsel.declr.dest_name, result);
	md.current_motivator = old_motivator;

	return result;
}

function handleChdCount(motivator, _, lnwatch, __, items) {
	// input - changed list order or length
	// expected - rerunned query, updated nesting

	var nestsel = lnwatch.data;
	nestsel.items = items;
	runFilter(motivator, nestsel);
}

function handleAdding(md, lnwatch, skip) {
	// input - signal of added to list item
	// expected - prepared item state cache

	if (skip !== lnwatch.selector.length) {return;}

	var nestsel = lnwatch.data;
	var _provoda_id = md._provoda_id;

	var states = {};
	var deep = nestsel.declr.deps.deep;
	for (var i = 0; i < deep.cond.list.length; i++) {
		var cur = deep.cond.list[i];
		states[cur] = pvState(md, cur);
	}
	nestsel.deep_item_states_index[_provoda_id] = states;
}

function handleRemoving(md, lnwatch, skip) {
	// input - signal of removed item form list
	// expected - removed item state cache

	if (skip !== lnwatch.selector.length) {return;}

	var nestsel = lnwatch.data;
	var _provoda_id = md._provoda_id;
	delete nestsel.deep_item_states_index[_provoda_id];
}

return NestSelector;
});
