
var sm2proxy = function(fireEvent, c) {
	var _this = this;

	this.fireEvent = fireEvent;

	addEvent(window, "message", function(e){
		if (e.origin.indexOf(_this.origin) === 0){
			_this.handleFrameMessage.apply(_this, e.data);
		}
	});

	this.frame = document.createElement('iframe');
	this.frame.src = this.origin + this.frame_url;
	if (c && c.append){
		c.append(this.frame);
	}
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
	origin: "http://arestov.github.com",
	frame_url: "/SoundManager2/#debugMode=true",
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
				if (this.fireEvent) {
					this.fireEvent.apply(this, arguments);
				}
			}
			//console.log(arguments)
		}
	},
	subscribe: function(cb){
		this.subr = cb;
	},
	desubscribe: function(cb){
		if (this.subr === cb){
			delete this.subr;
		}
	},
	sendMsg: function(msg){
		var args = Array.prototype.slice.call(arguments);
		if (args.length){
			this.frame.contentWindow.postMessage(args, '*');
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
