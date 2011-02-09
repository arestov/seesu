funcs_quene = function(small_delay, big_delay, big_delay_interval){
	this.big_quene = [];
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

funcs_quene.prototype = {
	get_interval: function(){
		var last_num = this.using_stat.length - 1;
		var bigdelay_turn = (!this.nobigdelay && last_num > 1  && (last_num  % this.big_delay_interval === 0));
		
		if (bigdelay_turn){
			var real_bdinterval = (new Date()).getTime() - this.using_stat[last_num - (this.big_delay_interval + 1)];
			var _unit = (this.small_delay * this.big_delay_interval + this.big_delay);
			if (real_bdinterval && real_bdinterval > _unit){
				var time = Math.max(0, this.big_delay - (real_bdinterval - _unit));
			} else{
				var time = this.big_delay;
			}
		} else{
			var last_usage = this.using_stat[last_num] || 0;
			if (!last_usage){
				var time = 0;
			} else{
				var time_difference = (new Date()).getTime() - last_usage;
				var interval_diff = this.small_delay  - time_difference;
				if (interval_diff > 0){
					var time = interval_diff
				} else{
					var time = 0;
				}
				
			}
			
		}
			
		return  time;
	},
	add: function(func, not_init){
		var quene_just_for_me = this.big_quene;
		var counter = quene_just_for_me.length;

		var _this = this;

		var _ob = {
			q: _this,
			func: function(){
				func();
				_this.using_stat.push((new Date()).getTime());
				this.done = true;
				
				var time = _this.get_interval();
			
				setTimeout(function(){
					_this.next(quene_just_for_me);
				}, time);
			}
		
		};
		quene_just_for_me.push(_ob);
	
		if (counter == 0 && !not_init) {
			this.init();
			
		}
		return _ob;
	},
	init: function(){
		if (this.big_quene.inited) {return this.big_quene;}
		var _this = this;


		var time = this.get_interval();
		setTimeout(function(){
			_this.next(_this.big_quene);
		}, time)
			
		
		this.big_quene.inited = true;
		return this;

		
	},
	next: function(q){
		if (this.big_quene == q){
			var prior_num = 0;
			var prior_el = null;
			
			var first_num = q.length;
			var first_el = null;
			
			for (var i=0; i < q.length; i++) {
				var _e = q[i];
				if (!_e.done){
					if (_e.pr && (_e.pr > prior_num)){ //check priority
						prior_num = _e.pr;
						prior_el = _e;
					} else if (!first_el && (i < first_num)){// else check order
						first_num = i;
						first_el = _e;
						
					}
				}
				
			};
			
			var vip = prior_el || first_el;
			
			if (vip){
				vip.func();
				return vip.func;
			} else{
				this.reset();
				return false;
			}
		} else{
			console.log('its another q')
		}
	},
	reset: function(){
		this.big_quene = [];
		return this;
	}
};




