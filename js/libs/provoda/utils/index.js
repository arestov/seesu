define(function (require) {
'use strict';
var spv = require('spv');

var NestWatch = function(selector, state_name, zip_func, full_name, handler, addHandler, removeHandler) {
	this.selector = selector;
	this.state_name = state_name;
	this.short_state_name = state_name && getShortStateName(state_name);
	this.full_name = full_name;
	this.zip_func = zip_func;
	this.handler = handler; // mainely for 'stch-'
	this.addHandler = addHandler;
	this.removeHandler = removeHandler;
};

var enc_states = {
	'^': (function(){
		// parent

		var parent_count_regexp = /^\^+/gi;

		return function parent(string) {
			//example: '^visible'

			var state_name = string.replace(parent_count_regexp, '');
			var count = string.length - state_name.length;
			return {
				rel_type: 'parent',
				full_name: string,
				ancestors: count,
				state_name: state_name
			};
		};
	})(),
	'@': function nesting(string) {
		// nesting

		//example:  '@some:complete:list'
		var nesting_and_state_name = string.slice(1);
		var parts = nesting_and_state_name.split(':');

		var nesting_name = parts.pop();
		var state_name = parts.pop();
		var zip_func = parts.pop();

		return {
			rel_type: 'nesting',
			full_name: string,
			nesting_name: nesting_name,
			state_name: state_name,
			zip_func: zip_func || itself,
			nwatch: new NestWatch(nesting_name.split('.'), state_name, zip_func, string)
		};
	},
	'#': function(string) {
		// root

		//example: '#vk_id'
		var state_name = string.slice(1);
		if (!state_name) {
			throw new Error('should be state_name');
		}
		return {
			rel_type: 'root',
			full_name: string,
			state_name: state_name
		};
	}
};


var getEncodedState = spv.memorize(function getEncodedState(state_name) {
	var start = state_name.charAt(0);
	if (enc_states[start]) {
		return enc_states[start](state_name);
	} else {
		return null;
	}
});

function getShortStateName(state_path) {
	var enc = getEncodedState(state_path);
	return enc ? state_path : spv.getFieldsTree(state_path)[0];
}

function itself(item) {return item;}

return {
	getShortStateName: getShortStateName,
	getEncodedState: getEncodedState,
	NestWatch: NestWatch
};
});
