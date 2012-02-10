
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
	create: function(id, opts){
		this.sendMsg('create', id, opts);
	},
	play: function(id){
		this.sendMsg('play', id);
	},
	stop: function(id){
		this.sendMsg('stop', id);
	},
	pause: function(id){
		this.sendMsg('pause', id);
	},
	setVolume: function(id, vol){
		this.sendMsg('setVolume', id, vol);
	},
	setPosition: function(id, pos){
		this.sendMsg('setPosition', id, pos);
	},
	remove: function(id){
		this.sendMsg('remove', id);
	},
	load: function(id){
		this.sendMsg('load', id);
	},
	unload: function(id){
		this.sendMsg('load', id);
	}
};
