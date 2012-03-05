var funcsStack;

(function() {
"use strict";

var fstackAtom = function(stack, cb, done, data) {
	this.stack = stack;
	this.cb = cb;
	this.done = done;
	this.data = data;
};


funcsStack = function(selectNext) {
	this.arr = [];
	var _this = this;

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
					this.arr[0].cb.apply(this.arr[0].cb, arguments);
				} else {
					throw new Error("wrong stack, func must be in [0]");
				}
			}
		};
};

funcsStack.prototype = {
	constructor: funcsStack,
	next: function(func, data) {
		this.arr.push(new fstackAtom(this.arr, func, this.done, data));
		return this;
	},
	start: function() {
		if (this.arr.length){
			this.arr[0].cb();
		}
		return this;
	},
	reset: function() {
		this.arr = [];
		return this;
	}
};


})();
