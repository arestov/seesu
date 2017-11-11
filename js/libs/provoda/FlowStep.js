define(function() {
'use strict';

function initedOrder(initiator, parent_motivator) {
	if (initiator) {
		return initiator.inited_order.slice();
	}
	if (parent_motivator) {
		return parent_motivator.inited_order.slice();
	}

	return [];
}

var FlowStep = function(num, fn, context, args, arg, cb_wrapper, real_context, parent_motivator, finup, initiator, init_end) {
	this.aborted = false;
	this.p_space = '';
	this.p_index_key = '';
	this.num = num;
	this.fn = fn;
	this.context = context;
	this.args = args;
	this.arg = arg || null;
	this.cb_wrapper = cb_wrapper || null;
	this.real_context = real_context;
	this.finup = !!finup || null;
	this.complex_order = ( parent_motivator && parent_motivator.complex_order.slice() ) || [];
	this.complex_order.push(this.num);
	this.inited_order = initedOrder(initiator, parent_motivator);
	this.inited_order.push(this.num);
	this.init_end = Boolean(init_end) || null;

	this.next = null;

	if (!this.fn && !this.cb_wrapper) {
		throw new Error('how to handle this step!?');
	}
	//this.custom_order = null;
};
FlowStep.prototype.abort = function() {
	this.aborted = true;
	this.num = null;
	this.fn = null;
	this.context = null;
	this.args = null;
	this.arg = null;
	this.cb_wrapper = null;
	this.real_context = null;
	//this.complex_order = null;
};
FlowStep.prototype.call = function() {
	if (this.cb_wrapper){
		/*
		вместо того, что бы просто выполнить отложенную функцию мы можем вызвать специальный обработчик, который сможет сделать некие действиями, имея в распоряжении
		в первую очередь мотиватор, далее контекст для самого себя, контекст колбэка, сам колбэк и аргументы для колбэка

		*/
		this.cb_wrapper.call(this.real_context, this, this.fn, this.context, this.args, this.arg);
	} else {
		if (this.args){
			if (this.args.length > 1) {
				this.fn.apply(this.context, this.args);
			} else {
				this.fn.call(this.context, this.args[0]);
			}

		} else {
			this.fn.call(this.context, this.arg);
		}
	}

};
return FlowStep;
});
