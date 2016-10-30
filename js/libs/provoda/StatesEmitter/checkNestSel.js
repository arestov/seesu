define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('../helpers');
var NestWatch = require('../utils/index').NestWatch;
var getShortStateName = require('../utils/getShortStateName');
var NestingSourceDr = require('../utils/NestingSourceDr');

var NestSelector = require('./NestSelector');
var handleChdDeepState = NestSelector.handleChdDeepState;
var handleChdCount = NestSelector.handleChdCount;
var handleAdding = NestSelector.handleAdding;
var handleRemoving = NestSelector.handleRemoving;

var endsWith = spv.endsWith;
// var constr_mention = require('../structure/constr_mention');

var getUnprefixed = spv.getDeprefixFunc( 'nest_sel-' );
var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

// var nestConstructor = constr_mention.nestConstructor;

var SelectNestingDeclaration = function(dest_name, data) {
	var nesting_source = new NestingSourceDr(data.from);
	this.start_point = nesting_source.start_point;
	this.from = nesting_source.selector;
	this.dest_name = dest_name;
	this.deps_dest = null;
	this.deps_source = null;
	this.args_schema = null;
	this.selectFn = null;
	this.dest_state_names = null;
	this.short_state_name = null;

	if (Array.isArray(data.where)) {
		var deps_dest = [];
		var deps_source = [];

		var args_schema = [];
		for (var i = 0; i < data.where[0].length; i++) {
			var cur = data.where[0][i];
			if (endsWith(cur, ":")) {
				var state_name = cur.slice(0, -1);
				deps_source.push(state_name);
				args_schema.push({
					type: 'source',
					name: state_name
				});
			} else {
				deps_dest.push(cur);
				args_schema.push({
					type: 'dest',
					name: cur
				});
			}
		}
		this.args_schema = args_schema;
		if (deps_source.length) {
			this.deps_source = deps_source;
		}
		if (deps_dest.length) {
			this.deps_dest = deps_dest;
			this.dest_state_names = deps_dest;
			this.short_state_name = deps_dest.map(getShortStateName);
		}

		if (!data.where[1]) {
			throw new Error('where[1] should be func');
		}
		this.selectFn = data.where[1];

		this.nwbase = new NestWatch(nesting_source, deps_source, null, null, {
			onchd_count: handleChdCount,
			onchd_state: handleChdDeepState
		}, handleAdding, handleRemoving);
	} else {
		throw new Error();
	}
};

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
