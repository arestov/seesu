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
	
};

funcs_quene.prototype = {
	add: function(func, not_init){
		var num = this.big_quene.length;

		var _this = this;


		this.big_quene.push(function(){
			func();

			
			var time;
			if (!_this.nodelay){
				time  = (((num + 1) % _this.big_delay_interval) === 0) ? _this.big_delay : _this.small_delay;
			} else {
				time = 0;
			}
			setTimeout(function(){
				if (_this.big_quene[num + 1]) {
					_this.big_quene[num + 1]();
				} else {
					_this.reset();
				}
			}, time);

			_this.last_usage = (new Date()).getTime();
			_this.last_num = num + 1;

		
		});
	
		if (!num && !not_init) {
			this.init();
			
		}
		return this;
	},
	init: function(){
		var _this = this;


		if (!_this.nodelay){
			var last_usage = this.last_usage || 0;
			var difference = (new Date()).getTime() - last_usage;
			var time = (((_this.last_num) % _this.big_delay_interval) === 0) ? _this.big_delay : _this.small_delay;
			if (difference < time) {
				setTimeout(function(){

					if (_this.big_quene[0]) {_this.big_quene[0]();}
				
				}, time - difference)
			} else{
				if (_this.big_quene[0]) {_this.big_quene[0]();}
			}
		} else{
			if (_this.big_quene[0]) {_this.big_quene[0]();}
		}
		
		return this;

		
	},
	reset: function(){
		this.big_quene = [];
		return this;
	}
};




