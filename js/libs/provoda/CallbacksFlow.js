define(['./FlowStep', 'spv'], function(FlowStep, spv){
'use strict';


var sortFlows = function(item_one, item_two) {
	if (item_one.aborted && item_two.aborted) {
		return;
	} else if (item_one.aborted) {
		return -1;
	} else if (item_two.aborted) {
		return 1;
	}


	var max_length;

	/*if (item_one.custom_order && item_two.custom_order) {

	} else if (item_one.custom_order) {

	} else if (item_two.custom_order) {

	}*/


	max_length = Math.max(item_one.complex_order.length, item_two.complex_order.length);

	for (var i = 0; i < max_length; i++) {
		var item_one_step = item_one.complex_order[i];
		var item_two_step = item_two.complex_order[i];

		if (typeof item_one_step == 'undefined' && typeof item_two_step == 'undefined'){
			return;
		}
		if (typeof item_one_step == 'undefined'){
			return -1;
		}
		if (typeof item_two_step == 'undefined'){
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
	this.busy = null;
	this.iteration_time = iteration_time || 250;
	this.iteration_delayed = null;
	this.flow_steps_counter = 1;
	this.flow_steps_collating_invalidated = null;
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

CallbacksFlow.prototype = {

	iterateCallbacksFlow: function() {
		var start = Date.now() + this.iteration_time;
		this.iteration_delayed = false;
		this.callbacks_busy = true;
		while (this.flow.length){
			if (Date.now() > start){
				this.pushIteration(this.hndIterateCallbacksFlow);
				break;
			}
			var cur;
			if (typeof this.flow_steps_collating_invalidated == 'number'){
				cur = this.flow[0];
				if (this.flow_steps_collating_invalidated <= cur.complex_order[0]) {
					this.flow_steps_collating_invalidated = null;
					this.flow.sort(sortFlows);
					
				}
			}
			cur = this.flow.shift();
			if (!cur.aborted) {
				cur.call();
			}
		}
		if (!this.flow.length){
			this.callbacks_busy = false;
		}
	},
	checkCallbacksFlow: function() {
		if (!this.iteration_delayed && !this.callbacks_busy){
			this.pushIteration(this.hndIterateCallbacksFlow);
			
			this.iteration_delayed = true;
		}
	},
	pushToFlow: function(fn, context, args, cbf_arg, cb_wrapper, real_context, motivator) {
		var flow_step = new FlowStep(++this.flow_steps_counter, fn, context, args, cbf_arg, cb_wrapper, real_context, motivator);
		if (motivator){
			var last_item = this.flow[ this.flow.length - 1 ];
			var result = last_item && sortFlows(last_item, flow_step);
			if (result === 1) {
				//очевидно, что новый элемент должен в результате занять другую позицию

				var last_matched = -1;
				for (var i = 0; i < this.flow.length; i++) {
					var cur = this.flow[i];
					var match_result = sortFlows(cur, flow_step);
					if (match_result == -1) {
						last_matched = i;
					} else {
						break;
					}
				}

				spv.insertItem(this.flow, flow_step, last_matched + 1);
				
				//this.flow_steps_collating_invalidated = Math.min( flow_step.complex_order[0], this.flow_steps_collating_invalidated || Infinity );
			} else {
				this.flow.push(flow_step);
			}
		} else {
			this.flow.push(flow_step);
		}
		
		
		this.checkCallbacksFlow();
		return flow_step;

	}
};
return CallbacksFlow;
});