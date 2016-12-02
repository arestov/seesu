define(function (require) {
'use strict';
var getShortStateName = require('../utils/getShortStateName');

var getStateWriter = require('./getStateWriter');
var standart = require('./standartNWH');

var wrapper = standart(function wrapper(md, items, lnwatch) {
	var callback = lnwatch.callback;
	callback(md, null, null, {
		items: items,
		item: null
	});
});


var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
	if (!args.length) {return;}
	var callback = lnwatch.callback;
	callback(md, args[1], args[2], {
		items: items,
		item: args[3]
	});
});

var counter = 1;
var NestWatch = function(nesting_source, state_name, zip_func, result_state_name, handler, addHandler, removeHandler) {
	var selector = nesting_source.selector;
	if (!Array.isArray(selector)) {
		throw new Error('selector should be array');
	}
	if (Array.isArray(state_name)) {
		if (result_state_name) {
			throw new Error('state_name cant be array when result_state_name is presented');
		}
		if (!handler.onchd_count || !handler.onchd_state) {
			throw new Error('should be both onchd_count and onchd_state');
		}
	}
	this.num = counter++;
	this.handled_subl_wtchs = null;

	this.selector = selector;
	this.start_point = nesting_source.start_point || null;
	this.state_name = state_name;
	this.short_state_name = state_name &&
		(Array.isArray(state_name)
			? (state_name.map(getShortStateName))
			: getShortStateName(state_name));
	this.full_name = result_state_name;
	this.zip_func = zip_func;
	this.handler = handler; // mainely for 'stch-'
	this.addHandler = addHandler;
	this.removeHandler = removeHandler;

	this.handle_state_change = null;
	this.handle_count_or_order_change = null;

	this.model_groups = null;


	if (Array.isArray(state_name) || typeof handler == 'object') {
		this.handle_state_change = handler.onchd_state;
		this.handle_count_or_order_change = handler.onchd_count;
	} else {
		// если есть full_name значит нам надо записать новое состояние
		// если нет, значит просто передать массив в пользовательскую функцию
		var full_name_handler = result_state_name && getStateWriter(result_state_name, state_name, zip_func);

		this.handle_state_change = this.state_name ? ( result_state_name ? full_name_handler : stateHandler) : null;
		this.handle_count_or_order_change = result_state_name ? full_name_handler : wrapper;
	}

};

return NestWatch;
});
