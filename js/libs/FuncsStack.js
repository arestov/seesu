define(function() {
"use strict";
var none = function() {};

var FstackAtom = function(stack, func, done, data) {
	this.stack = stack;
	this.func = func;
	this.func_result = null;
	this.done = done;
	
	this.data = null;
	this.qf = null;
	this.aborted = null;
	if (data){
		this.data = data;
	}
	this.completePart = done;
};
FstackAtom.prototype.destroy = function() {
	this.stack = null;
	this.func = null;
	this.done = none;
	this.completePart = none;
	this.fail = none;
	this.data = null;
	this.qf = null;
};
FstackAtom.prototype.abort = function() {
	this.destroy();
	this.aborted = true;
};

var FuncsStack = function(selectNext, initAtom) {
	this.chained = null;
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
				if (this.atom_completed){
					throw new Error('executing second time!');
				}
				if (_this.arr[0] === this){
					this.atom_completed = true;

					_this.arr.shift();
					if (_this.arr[0]){
						_this.goAhead(_this.arr[0], arguments);
					} else {
						_this.waitNext(arguments);
					}
				} else {
					throw new Error("wrong stack, func must be in [0]");
				}
			} else {
				// was reseted - this.reset()
			}
		};
};

FuncsStack.prototype = {
	constructor: FuncsStack,
	next: function(func, data) {
		var _this = this;
		var atom = new FstackAtom(this.arr, func, this.done, data);
		if (this.initAtom){
			this.initAtom(atom);
		}
		this.arr.push(atom);
		if (this.want_start && this.arr[0] === atom){
			setTimeout(function() {
				_this.goAhead(atom, _this.wait_next);
			},0);
			
		}

		return this;
	},
	waitNext: function(args) {
		this.wait_next = args;
	},
	goAhead: function(atom, args) {
		this.wait_next = null;
		atom.func_result = atom.func.apply(atom, args);
	},
	start: function() {
		if (!this.want_start){
			
			if (this.arr[0]){
				this.goAhead(this.arr[0], arguments);
			} else {
				this.waitNext(arguments);
			}
			this.want_start = true;
		}
		return this;
	},
	reset: function() {
		this.arr = [];
		return this;
	},
	getArr: function() {
		return this.arr;
	}
};


FuncsStack.chain = function(arr) {
	var fstack = new FuncsStack();
	for (var i = 0; i < arr.length; i++) {
		fstack.next(arr[i]);
	}
	fstack.start(function() {

	});

	return fstack;
};



return FuncsStack;
});
