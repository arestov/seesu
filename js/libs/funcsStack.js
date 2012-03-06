var funcsStack;

(function() {
"use strict";

var fstackAtom = function(stack, func, done, data) {
	this.stack = stack;
	this.func = func;
	this.done = done;
	this.data = data;
};


funcsStack = function(selectNext, initAtom) {
	this.arr = [];
	var _this = this;
	if (initAtom){
		this.initAtom = initAtom;
	}
	this.done =
		selectNext ?
		function() {
			if (this.stack === _this.arr){
				selectNext.call(_this, this, arguments);
			}
			
		}:
		function() {
			if (this.stack === _this.arr){
				if (_this.arr[0] === this){
					_this.arr.shift();
					_this.arr[0].func.apply(_this.arr[0], arguments);
				} else {
					throw new Error("wrong stack, func must be in [0]");
				}
			} else {
				// was reseted - this.reset()
			}
		};
};

funcsStack.prototype = {
	constructor: funcsStack,
	next: function(func, data) {
		var atom = new fstackAtom(this.arr, func, this.done, data);
		if (this.initAtom){
			this.initAtom(atom);
		}
		this.arr.push(atom);
		if (!this.started && this.want_start){
			this.started = true;
			atom.func.apply(this.arr[0], this.start_args);
			delete this.start_args;
		}

		return this;
	},
	start: function() {
		if (!this.want_start){
			
			if (this.arr.length){
				this.arr[0].func.apply(this.arr[0], arguments);
				this.started = true;
			} else {
				this.start_args = arguments;
			}
			this.want_start = true;
		}
		
		return this;
	},
	reset: function() {
		this.arr = [];
		return this;
	}
};


})();
