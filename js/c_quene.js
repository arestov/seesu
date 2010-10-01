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
	if (!small_delay || !big_delay || !big_delay_interval){
		this.nodelay = true;
	}
	this.last_num = 0;
};

funcs_quene.prototype = {
	add: function(func, not_init){
		var quene_just_for_me = this.big_quene;
		var counter = quene_just_for_me.length;

		var _this = this;

		var _ob = {
			q: _this,
			func: function(){
				func();
				this.done = true;
				var time;
				if (!_this.nodelay){
					time  = (((_this.last_num + 1) % _this.big_delay_interval) === 0) ? _this.big_delay : _this.small_delay;
				} else {
					time = 0;
				}
				setTimeout(function(){
					_this.next(quene_just_for_me);
				}, time);
	
				_this.last_usage = (new Date()).getTime();
				_this.last_num++;
	
			
			}
		
		};
		quene_just_for_me.push(_ob);
	
		if (counter == 0 && !not_init) {
			this.init();
			
		}
		return _ob;
	},
	init: function(){
		if (this.big_quene.inited){return this.big_quene}
		var _this = this;


		if (!_this.nodelay){
			var last_usage = this.last_usage || 0;
			var difference = (new Date()).getTime() - last_usage;
			var time = (((_this.last_num) % _this.big_delay_interval) === 0) ? _this.big_delay : _this.small_delay;
			if (difference < time) {
				setTimeout(function(){
					_this.next(_this.big_quene);
					
				}, time - difference)
			} else{
				_this.next(_this.big_quene);
			}
		} else{
			_this.next(_this.big_quene);
		}
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
		}
	},
	reset: function(){
		this.big_quene = [];
		return this;
	}
};




