define(function (require) {
'use strict';
var pvState = require('../../utils/state');

var count = 1;
var NestSelector = function (md, declr) {
	this.num = 'nsel-' + (count++);
	this.md = md;
	this.items = [];
	this.declr = declr;


  this.items_index = null;
  this.items_changed = null;
	// this.waiting_chd_count = false;

  this.state_name = declr.dest_state_names;
  this.short_state_name = declr.short_state_name;

	this.item_cond_index = {};
	this.item_states_index = {};
	this.dest_states = null;

	if (declr.deps_dest) {
		var dest_states = {};
		for (var i = 0; i < declr.deps_dest.length; i++) {
			var cur = declr.deps_dest[i];
			dest_states[cur] = pvState(md, cur);
		}
		this.dest_states = dest_states;
	}

};

NestSelector.prototype.selector = [];
NestSelector.prototype.state_handler = handleChdDestState;

NestSelector.handleChdDeepState = handleChdDeepState;
NestSelector.handleChdCount = handleChdCount;
NestSelector.handleAdding = handleAdding;
NestSelector.handleRemoving = handleRemoving;

function handleChdDestState(motivator, fn, nestsel, args) {
	// input - changed "dest" state
	// expected - invalidated all item conditions, rerunned query, updated nesting

	var state_name = args[0];
	var value = args[1];

	var states = nestsel.dest_states;
	states[state_name] = value;
	nestsel.item_cond_index = {};
	runFilter(motivator, nestsel);
}


function handleChdDeepState(motivator, _, lnwatch, args) {
	// input - changed "deep source" state
	// expected - rerunned query, updated nesting

	var state_name = args[0];
	var value = args[1];
	var md = args[3];

	var nestsel = lnwatch.data;
	var _provoda_id = md._provoda_id;
	var states = nestsel.item_states_index[_provoda_id];
	states[state_name] = value;
	nestsel.item_states_index[_provoda_id] = states;

	runFilter(motivator, nestsel);
}

function checkCondition(nestsel, _provoda_id) {
	var source_states = nestsel.item_states_index[_provoda_id];
	var dest_states = nestsel.dest_states;
	var args_schema = nestsel.declr.args_schema;

	var args = new Array(args_schema.length);
	for (var i = 0; i < args_schema.length; i++) {
		var cur = args_schema[i];
		var value;
		switch (cur.type) {
			case 'source':
				value = source_states[cur.name];
				break;
			case 'dest':
				value = dest_states[cur.name];
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

function getMatchedItems(nestsel) {
	if (!nestsel.declr.deps_dest && !nestsel.declr.deps_source) {
		return nestsel.items;
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
	// item_states_index
	// dest_states
	var result = getMatchedItems(nestsel);

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
	for (var i = 0; i < nestsel.declr.deps_source.length; i++) {
		var cur = nestsel.declr.deps_source[i];
		states[cur] = pvState(md, cur);
	}
	nestsel.item_states_index[_provoda_id] = states;
}

function handleRemoving(md, lnwatch, skip) {
	// input - signal of removed item form list
	// expected - removed item state cache

	if (skip !== lnwatch.selector.length) {return;}

	var nestsel = lnwatch.data;
	var _provoda_id = md._provoda_id;
	delete nestsel.item_states_index[_provoda_id];
}

return NestSelector;
});
