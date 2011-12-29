var eemiter = function(){};
cloneObj(eemiter.prototype, {
	constructor: eemiter,
	init: function(){
		this.subscribes = {};
		this.requests = [];
	},
	on: function(name, cb){
		if (!this.subscribes[name]){
			this.subscribes[name] = [];
		}
		this.subscribes[name].push(cb)
		return this;
	},
	off: function(name, cb){
		var cbs = this.subscribes[name];
		if (cbs){
			var clean = [];
			for (var i = 0; i < cbs.length; i++) {
				if (cbs[i] !== cb){
					clean.push(cbs[i])
				}
			};
			if (clean.length != cbs.length){
				this.subscribes[name] = clean;
			}
		}
		return this;
	},
	fire: function(){
		var args = Array.prototype.slice.call(arguments);
		var name = args.shift();
		var cbs = this.subscribes[name];

		if (cbs){
			for (var i = 0; i < cbs.length; i++) {
				cbs[i].apply(null, args);
			};
		}
		return this;
	},
	addRequest: function(rq){
		this.requests.push(rq);
	},
	stopRequests: function(){
		while (this.requests.length) {
			var rq = this.requests.pop();
			if (rq && rq.abort) {rq.abort()}
		}
	}
});

var servModel = function(){};
servModel.prototype = new eemiter();
cloneObj(servModel.prototype, {
	constructor: servModel,
	init: function(){
		eemiter.prototype.init.call(this);
		this.states = {};
		this.views = [];
	},
	state: function(name){
		return this.states[name];
	},
	removeView: function(view){
		var views = [];
		for (var i = 0; i < this.views.length; i++) {
			if (views[i] !== view){
				views.push(views[i])
			}
		};
		if (views.length != this.views.length){
			this.views = views;
		}
	},
	removeDeadViews: function(){
		var alive = $filter(this.views, 'dead', true).not;
		if (alive.length != this.views.length){
			this.views = alive;
		}
		return this;
	},
	getC: function(){
		var v = this.getView();
		if (v){
			return v.getC();
		}	
	},
	getView: function(many){
		return many ? this.views : this.views[0];	
	},
	addView: function(v) {
		this.views.push( v );
		return this;
	},
	_updateProxy: function(is_prop, name, value){
		this.removeDeadViews();
		if (name){
			var obj_to_change = is_prop ? this : this.states,
				method = is_prop ? this.prop_change[name] : this.state_change[name];
				
			if (obj_to_change[name] != value){
				if (method){
					method.call(this, value, obj_to_change && obj_to_change[name]);
				}
				if (value){
					obj_to_change[name] = value;
				} else {
					delete obj_to_change[name];
				}
				for (var i = 0; i < this.views.length; i++) {
					this.views[i].change(is_prop, name, obj_to_change[name])
				};
			}
			
		}
		return this;
	},
	updateProp: function(name, value){
		return this._updateProxy(true, name, value);
	},
	updateState: function(name, value){
		return this._updateProxy(false, name, value);
	},
	prop_change: {
		
	},
	state_change: {
		
	}
});


var servView = function(){};
cloneObj(servView.prototype, {
	init: function(){
		this.states = {};
	},
	die: function(){
		this.dead = true;
		return this;
	},
	setModel: function(mdl, puppet_model){
		this.mdl = mdl;
		if (puppet_model){
			this.puppet_model = puppet_model;
		}
		return this;
	},
	getC: function(){
		return this.c;	
	},
	setC: function(c){
		this.c = c;
	},
	setStates: function(states){
		if (this.reset){
			this.reset();
		}
		delete this.states;
		for (var name in states){
			this.change(false, name, states[name]);
		}
		return this;
	},
	change: function(is_prop, name, value){
		if (name){
			var obj_to_change = !is_prop ? this.states : (this.puppet_model && this.mdl),
				method = is_prop ? this.prop_change[name] : this.state_change[name];
			
			if (method){
				method.call(this, value, obj_to_change && obj_to_change[name]);
			}

			if (obj_to_change){
				if (value){
					obj_to_change[name] = value;
				} else {
					delete obj_to_change[name];
				}
			};
		}
		return this;
	},
	prop_change: {
		
	},
	state_change: {
		
	}
});

