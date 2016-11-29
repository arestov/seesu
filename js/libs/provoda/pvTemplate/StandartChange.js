define(function(require) {
'use strict';

var spv = require('spv');
var angbo = require('angbo');

var abortFlowStep = function(tpl, w_cache_key) {
	var flow_step = tpl.calls_flow_index[w_cache_key];
	if (flow_step) {
		tpl.calls_flow_index[w_cache_key] = null;
		flow_step.abort();
	}
};

var removeFlowStep = function(tpl, w_cache_key) {
	tpl.calls_flow_index[w_cache_key] = null;
};

var setMotive = function(context, fn, motivator, args, arg) {
	//устанавливаем мотиватор конечному пользователю события
	var ov_c = context.current_motivator;
	context.current_motivator = motivator;

	var ov_t;

	if (this != context) {
		//устанавливаем мотиватор реальному владельцу события, чтобы его могли взять вручную
		//что-то вроде api
		ov_t = this.current_motivator;
		this.current_motivator = motivator;
	}

	if (args){
		fn.apply(context, args);
	} else {
		fn.call(context, arg);
	}

	if (context.current_motivator != motivator){
		throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
	}
	context.current_motivator = ov_c;

	if (this != context) {
		if (this.current_motivator != motivator){
			throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
		}
		this.current_motivator = ov_t;
	}
};

var wrapChange = function(motivator, fn, context, args, arg) {

	setMotive.call(context, context, fn, motivator, args, arg);
	// debugger;
}

var getFieldsTreesBases = function(all_vs) {
	var sfy_values = new Array(all_vs.length);
	for (var i = 0; i < all_vs.length; i++) {
		var parts = all_vs[i].split('.');
		var main_part = parts[0];
		sfy_values[i] = main_part;
	}
	return sfy_values;
};


var StandartChange = function(node, opts, w_cache_subkey) {
	var calculator = opts.calculator;
	var all_vs;
	if (!calculator){
		if (opts.complex_statement){
			calculator = angbo.interpolateExpressions(opts.complex_statement);
			var all_values = spv.filter(calculator.parts,'propsToWatch');
			all_vs = [];
			all_vs = all_vs.concat.apply(all_vs, all_values);
		} else if (opts.statement){
			calculator = angbo.parseExpression(opts.statement);
			all_vs = calculator.propsToWatch;
		}
	}

	if (!w_cache_subkey) {
		throw new Error('w_cache_subkey (usualy just directive_name) must be provided');
	}

	this.current_motivator = null;
	this.w_cache_subkey = w_cache_subkey;
	this.data = opts.data;
	this.calculator = calculator;
	this.all_vs = all_vs;
	this.simplifyValue = opts.simplifyValue;
	this.setValue = opts.setValue;
	this.getValue = opts.getValue;
	this.sfy_values = calculator ? getFieldsTreesBases(this.all_vs) : null;

	if (calculator){
		var original_value = this.getValue(node, this.data);
		if (this.simplifyValue){
			original_value = this.simplifyValue.call(this, original_value);
		}
		this.original_value = original_value;
	}

	if (!node.pvprsd) {
		//debugger;
	}
	//this.w_cache_key = node.pvprsd + '_' + node.pvprsd_inst + '*' + directive_name;

};
var calc = function (calculator, states) {
	try { // FIXME
		return calculator(states);
	} catch (e) {}
};

StandartChange.prototype = {
	changeValue: function(new_value, wwtch) {
		removeFlowStep(wwtch.context, wwtch.w_cache_key);
		if (wwtch.current_value != new_value) {
			var old_value = wwtch.current_value;
			wwtch.current_value = new_value;
			this.setValue(wwtch.node, new_value, old_value, wwtch);
		}

	},
	checkFunc: function(states, wwtch, async_changes, current_motivator) {
		abortFlowStep(wwtch.context, wwtch.w_cache_key);
		var new_value = calc(this.calculator, states);
		if (this.simplifyValue){
			new_value = this.simplifyValue(new_value);
		}
		if (wwtch.current_value != new_value){
			if (async_changes) {
				// fn, context, args, cbf_arg, cb_wrapper, real_context, motivator, finup
				var flow_step = wwtch.context.calls_flow.pushToFlow(this.changeValue, this, [new_value, wwtch], false, wrapChange, false, current_motivator);
				wwtch.context.calls_flow_index[wwtch.w_cache_key] = flow_step;
				//).pushToFlow(cb, mo_context, reg_args, one_reg_arg, callbacks_wrapper, this.sputnik, this.sputnik.current_motivator);
			} else {
				this.changeValue(new_value, wwtch);
			}

		}
	},
	createBinding: (function() {
		var checkFuncPublic = function(states, async_changes, current_motivator) {
			this.standch.checkFunc(states, this, async_changes, current_motivator);
		};

		return function(node, context) {
			var wwtch = {
				w_cache_key: node.pvprsd + '_' + node.pvprsd_inst + '*' + this.w_cache_subkey,
				data: this.data,
				standch: this,
				context: context,
				node: node,
				current_value: this.original_value,
				pv_type_data: null,

				values: this.all_vs,
				sfy_values: this.sfy_values,
				checkFunc: checkFuncPublic
			};
			return wwtch;
		};
	})()
};

StandartChange.getFieldsTreesBases = getFieldsTreesBases;

return StandartChange;
});
