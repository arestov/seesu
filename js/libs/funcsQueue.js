var funcsQueue;
(function() {
	"use strict";
	var queueFunc = function(queue, atom){
		this.q = queue;
		this.atom = atom;
	};
	queueFunc.prototype = {
		constructor: queueFunc,
		abort: function(){
			this.aborted = true;
		},
		setPrio: function(num){
			if (typeof num == 'number'){
				this.pr = num;
			} else if (num == 'as-top'){
				this.pr = this.q.getTopPrio() || 1;
			} else if (num == 'highest'){
				this.pr = this.q.getTopPrio() + 1;
			}
		}
	};


	funcsQueue = function(small_delay, big_delay, big_delay_interval){
		var _this = this;
		
		var selectNext = function(prev, args) {
			_this.goAhead(prev);
		};
		var initAtom = function(atom) {
			atom.qf = new queueFunc(_this, atom);
		};

		this.fstack = new funcsStack(selectNext, initAtom);
		

		if (small_delay) {
			this.small_delay = small_delay;
		}
		if (big_delay) {
			this.big_delay = big_delay;
		}
		if (big_delay_interval) {
			this.big_delay_interval = big_delay_interval;
		}
		if (!big_delay || !big_delay_interval){
			this.nobigdelay = true;
		}
		this.using_stat = [];
	};


	funcsQueue.prototype = {
		constructor: funcsQueue,
		getTopPrio: function(){
			var nums = [];
			var queue = this.fstack.getArr();
			for (var i = 0; i < queue.length; i++) {
				var cur = queue[i].qf.pr;
				if (typeof cur == 'number'){
					nums.push(cur);
				}
			}
			if (nums.length){
				return Math.max.apply(Math, nums);
			} else {
				return 0;
			}
		},
		goAhead: function(prev) {
			var _this = this;

			var time = _this.getInterval(prev);
			if (time){
				setTimeout(function(){
					_this.selectNext(prev);
				}, time);
			} else{
				_this.selectNext(prev);
			}
		},
		getInterval: function(){
			var
				time,
				last_num = this.using_stat.length - 1,
				bigdelay_turn = (!this.nobigdelay && last_num > 1  && (last_num  % this.big_delay_interval === 0));
			
			if (bigdelay_turn){
				var real_bdinterval = (new Date()).getTime() - this.using_stat[last_num - (this.big_delay_interval + 1)];
				var _unit = (this.small_delay * this.big_delay_interval + this.big_delay);
				if (real_bdinterval && real_bdinterval > _unit){
					time = Math.max(0, this.big_delay - (real_bdinterval - _unit));
				} else{
					time = this.big_delay;
				}
			} else{
				var last_usage = this.using_stat[last_num] || 0;
				if (!last_usage){
					time = 0;
				} else{
					var time_difference = (new Date()).getTime() - last_usage;
					var interval_diff = this.small_delay  - time_difference;
					if (interval_diff > 0){
						time = interval_diff;
					} else{
						time = 0;
					}
					
				}
				
			}
				
			return  time;
		},
		add: function(func, not_init){
			var
				_this = this,
				my_queue = this.fstack.getArr();

			not_init = not_init || my_queue.length !== 0;

			this.fstack.next(function(){
				var atom = this;
				func();
				_this.using_stat.push((new Date()).getTime());
				this.complete = true;
				atom.done(my_queue);
			});

			var _ob = my_queue[my_queue.length-1].qf;
		
			if (!not_init) {
				this.init();
			}
			return _ob;
		},
		init: function(force){
			if (!force && this.fstack.getArr().inited) {
				return this.fstack.getArr();
			} else {
				this.fstack.getArr().inited = true;
				this.goAhead();
			}
			return this;
		},
		selectNext: function(){
			var
				q = this.fstack.getArr(),
				prior_num = 0,
				prior_el = null,
				first_num = q.length,
				first_el = null;
			
			for (var i=0; i < q.length; i++) {
				var atom = q[i];
				if (!atom.complete && !atom.qf.aborted){
					if (atom.qf.pr && (atom.qf.pr > prior_num)){ //check priority
						prior_num = atom.pr;
						prior_el = atom;
					} else if (!first_el && (i < first_num)){// else check order
						first_num = i;
						first_el = atom;
					}
				}
			}
			var vip = prior_el || first_el;
			
			if (vip){
				vip.func();
				return vip.func;
			} else{
				this.reset();
				return false;
			}

		},
		reset: function(){
			this.fstack.reset();
			return this;
		}
	};
})();