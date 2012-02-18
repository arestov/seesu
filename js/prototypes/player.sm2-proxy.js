
var sm2proxy = function(origin, path, opts) {
	var _this = this;
	this.origin = origin;
	

	addEvent(window, "message", function(e){
		if (e.origin.indexOf(_this.origin) === 0){
			_this.handleFrameMessage.apply(_this, (e.data === Object(e.data) ? e.data : JSON.parse(e.data)));
		}
	});

	if (opts && opts === Object(opts)){
		var params_string = stringifyParams(opts, false, '=', '&');
		if (params_string){
			path = path + '#' + params_string
		}
	}

	this.frame = document.createElement('iframe');
	this.frame.src = this.origin + path;
	this.def = $.Deferred();
	
};

sm2proxy.prototype = {
	fail: function(cb){
		this.def.fail(cb);
		return this;
	},
	done: function(cb){
		this.def.done(cb);
		return this;
	},
	getC: function(){
		return this.frame;
	},
	handleFrameMessage: function(func, arg){
		if (func){
			if (func === 'sm2loaded'){
				if (func){
					this.def.resolve()
				} else {
					this.def.reject()
				}
			} else {
				if (this.subr){
					this.subr.apply(this, arguments);
				}
			}
			//console.log(arguments)
		}
	},
	subscribe: function(cb){
		this.subr = cb;
		return this;
	},
	desubscribe: function(cb){
		if (this.subr === cb){
			delete this.subr;
		}
	},
	sendMsg: function(msg){
		var args = Array.prototype.slice.call(arguments);
		if (args.length){
			this.frame.contentWindow.postMessage(JSON.stringify(args), '*');
		}
	},
	callSongMethod: function(method, id) {
		this.sendMsg.apply(this, arguments)
	}
};
