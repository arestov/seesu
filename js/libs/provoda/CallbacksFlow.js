define(function(require) {
'use strict';

var FlowStep = require('./FlowStep');
var spv = require('spv');

var Group = function(num) {
	this.num = num;
	this.complex_order = [num];
	this.inited_order = this.complex_order;
};

var compareComplexOrder = function (array_one, array_two) {
	var max_length = Math.max(array_one.length, array_two.length);

	for (var i = 0; i < max_length; i++) {
		var item_one_step = array_one[i];
		var item_two_step = array_two[i];

		if (typeof item_one_step == 'undefined' && typeof item_two_step == 'undefined'){
			return;
		}
		if (typeof item_one_step == 'undefined'){
			// __[1, 2] vs [1, 2, 3] => __[1, 2], [1, 2, 3]
			return -1;
		}
		if (typeof item_two_step == 'undefined'){
			// __[1, 2, 3] vs [1, 2] => [1, 2], __[1, 2, 3]
			return 1;
		}
		if (item_one_step > item_two_step){
			return 1;
		}
		if (item_one_step < item_two_step){
			return -1;
		}
	}
};

var compareInitOrder = function (array_one, array_two, end_one, end_two) {
	var max_length = Math.max(array_one.length, array_two.length);

	for (var i = 0; i < max_length; i++) {
		var item_one_step = array_one[i];
		var item_two_step = array_two[i];

		if (typeof item_one_step == 'undefined' && typeof item_two_step == 'undefined'){
			return;
		}
		if (typeof item_one_step == 'undefined'){
			// __[1, 2]*END, [1, 2, 3]*END => [1, 2, 3]*END, __[1, 2]*END
			if (end_one && end_two) {
				return 1;
			}

			// __[1, 2]*END vs [1, 2, 3] => [1, 2, 3], __[1, 2]*END
			if (end_one) {
				return 1;
			}

			// __[1, 2], [1, 2, 3]*END => __[1, 2], [1, 2, 3]*END
			if (end_two) {
				return -1;
			}

			// __[1, 2] vs [1, 2, 3] => __[1, 2], [1, 2, 3]
			return -1;
		}
 		if (typeof item_two_step == 'undefined'){
			// __[1, 2, 3]*END, [1, 2]*END => __[1, 2, 3]*END, [1, 2]*END
			if (end_one && end_two) {
				return -1;
			}

			// __[1, 2, 3]*END, [1, 2] => [1, 2], __[1, 2, 3]*END
			if (end_one) {
				return 1;
			}

			// __[1, 2, 3], [1, 2]*END => __[1, 2, 3], [1, 2]*END
			if (end_two) {
				return -1;
			}

			//__[1, 2, 3], [1, 2] vs  => [1, 2], __[1, 2, 3]
			return 1;
		}
		if (item_one_step > item_two_step){
			return 1;
		}
		if (item_one_step < item_two_step){
			return -1;
		}
	}
};

var sortFlows = function(item_one, item_two) {
	var none_one = !item_one || item_one.aborted;
	var none_two = !item_two || item_two.aborted;

	if (none_one && none_two) {
		return;
	} else if (none_one) {
		return -1;
	} else if (none_two) {
		return 1;
	}

	if (item_one.finup && item_two.finup) {

	} else if (item_one.finup){
		return 1;
	} else if (item_two.finup) {
		return -1;
	}

	if (item_one.init_end || item_two.init_end) {
		return compareInitOrder(item_one.inited_order, item_two.inited_order, item_one.init_end, item_two.init_end);
	}




	/*if (item_one.custom_order && item_two.custom_order) {

	} else if (item_one.custom_order) {

	} else if (item_two.custom_order) {

	}*/

	return compareComplexOrder(item_one.complex_order, item_two.complex_order);
};


var getBoxedSetImmFunc = function(win) {
	return win.setImmediate || (function() {
		//http://learn.javascript.ru/setimmediate

		var head = {
			func: null,
			next: null
		}, tail = head; // очередь вызовов, 1-связный список

		var ID = Math.random(); // уникальный идентификатор

		var onmessage = function(e) {
			if ( e.data != ID ) {
				return;
			} // не наше сообщение
			head = head.next;
			var func = head.func;
			head.func = null;
			func();
		};

		if ( win.addEventListener ) { // IE9+, другие браузеры
			win.addEventListener('message', onmessage, false);
		} else { // IE8
			win.attachEvent( 'onmessage', onmessage );
		}

		return win.postMessage ? function(func) {
			if (!win || win.closed) {
				return;
			}
			tail = tail.next = { func: func, next: null };
			win.postMessage(ID, "*");
		} :
		function(func) { // IE<8
			setTimeout(func, 0);
		};
	}());
};

var getBoxedRAFFunc = function(win) {
	var raf;

	if ( win.requestAnimationFrame ){
		raf = win.requestAnimationFrame;
	} else {
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !raf; ++x) {
			raf = win[vendors[x]+'RequestAnimationFrame'];
		}
	}
	return raf && function(fn) {
		return raf.call(win, fn);
	};
};

var CallbacksFlow = function(win, rendering_flow, iteration_time) {
	this.flow = [];
	this.flow_start = null;
	this.flow_end = null;
	this.busy = null;
	this.iteration_time = iteration_time || 250;
	this.iteration_delayed = null;
	this.flow_steps_counter = 1;
	// this.flow_steps_collating_invalidated = null;
	var _this = this;
	this.hndIterateCallbacksFlow = function() {
		_this.iterateCallbacksFlow();
	};
	var raf = rendering_flow && getBoxedRAFFunc(win);
	if ( raf ) {
		this.pushIteration = function(fn) {
			return raf(fn);
		};
	} else {
		var setImmediate = getBoxedSetImmFunc(win);
		this.pushIteration = function(fn) {
			return setImmediate(fn);
		};
	}
};
var insertItem = spv.insertItem;
CallbacksFlow.prototype = {
	startGroup: function() {
		return new Group(++this.flow_steps_counter);
	},
	iterateCallbacksFlow: function() {
		var start = Date.now() + this.iteration_time;
		this.iteration_delayed = false;
		this.callbacks_busy = true;

		var stopped;
		for (var cur = this.flow_start; cur;) {
			this.flow_start = cur;
			if (!this.flow_start) {
				this.flow_end = null;
			}
			if (Date.now() > start){
				stopped = cur;
				this.pushIteration(this.hndIterateCallbacksFlow);
				break;
			}
			this.flow_start = cur.next;
			if (!this.flow_start) {
				this.flow_end = null;
			}

			if (!cur.aborted) {
				cur.call();
			}

			if (this.flow_start == cur) {
				cur = cur.next;
			} else {
				cur = this.flow_start;
			}
		}
		this.flow_start = stopped;
		if (!stopped) {
			this.flow_end = null;
		}

		if (!this.flow_start) {
			this.callbacks_busy = false;
		}

	},
	checkCallbacksFlow: function() {
		if (!this.iteration_delayed && !this.callbacks_busy){
			this.pushIteration(this.hndIterateCallbacksFlow);

			this.iteration_delayed = true;
		}
	},
	pushToFlow: function(fn, context, args, cbf_arg, cb_wrapper, real_context, motivator, finup, initiator, init_end) {
		var flow_step = new FlowStep(++this.flow_steps_counter, fn, context, args, cbf_arg, cb_wrapper, real_context, motivator, finup, initiator, init_end);
		order(this, flow_step, motivator);
		this.checkCallbacksFlow();
		return flow_step;

	}
};

function order(self, flow_step) {
	var last_item = self.flow_end;

	var result = last_item && sortFlows(flow_step, last_item);

	if (result >= 0) {
		//очевидно, что новый элемент должен стать в конец
		return toEnd(self, flow_step);
	}

	var last_matched;
	for (var cur = self.flow_start; cur; cur = cur.next) {
		var match_result = sortFlows(cur, flow_step);
		if (match_result == -1) {
			last_matched = cur;
		} else {
			break;
		}
	}

	if (!cur) {
		throw new Error('something wrong');
	}

	if (!last_matched) {
		flow_step.next = self.flow_start;
		self.flow_start = flow_step;
	} else {
		flow_step.next = last_matched.next;
		last_matched.next = flow_step;
	}
}

function toEnd(self, flow_step) {
	if (self.flow_end) {
		self.flow_end.next = flow_step;
	}
	self.flow_end = flow_step;
	if (!self.flow_start) {
		self.flow_start = flow_step;
	}

	return flow_step;
}
return CallbacksFlow;
});
