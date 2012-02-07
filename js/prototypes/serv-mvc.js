var eemiter = function(){};
cloneObj(eemiter.prototype, {
	constructor: eemiter,
	init: function(){
		this.subscribes = {};
		this.reg_fires = {};
		this.requests = [];
		return this;
	},
	on: function(name, cb){
		var _this = this;
		if (!this.subscribes[name]){
			this.subscribes[name] = [];
		}
		this.subscribes[name].push(cb);
		if (this.reg_fires[name]){
			this.reg_fires[name].call(this,  function() {
				cb.apply(_this, arguments)	
			});
		}
		return this;
	},
	off: function(name, cb){
		var cbs = this.subscribes[name];
		if (cbs){
			if (cb){
				var clean = [];
				for (var i = 0; i < cbs.length; i++) {
					if (cbs[i] !== cb){
						clean.push(cbs[i])
					}
				};
				if (clean.length != cbs.length){
					this.subscribes[name] = clean;
				}
			} else {
				delete this.subscribes[name];
			}
			
		}
		return this;
	},
	onRegistration: function(name, cb) {
		if (name){
			//this.reg_fires[name] = this.reg_fires[name] || {};
			this.reg_fires[name] = cb
		}
		return this;
	},
	fire: function(){
		var args = Array.prototype.slice.call(arguments);
		var name = args.shift();
		var cbs = this.subscribes[name];

		if (cbs){
			for (var i = 0; i < cbs.length; i++) {
				cbs[i].apply(this, args);
			};
		}
		return this;
	},
	addRequest: function(rq){
		this.requests.push(rq);
		this.fire('request', rq);
	},
	stopRequests: function(){
		while (this.requests.length) {
			var rq = this.requests.pop();
			if (rq && rq.abort) {rq.abort()}
		}
	},
	getQueued: function() {
		return $filter(this.requests, 'queued');	
	},
	setPrio: function(type) {
		var queued = this.getQueued();
		for (var i = 0; i < queued.length; i++) {
			queued[i].setPrio(type);
		};
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
		this.children = [];
		return this;
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
	killViews: function() {
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].die();
		};
	},
	die: function(){
		this.killViews();
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].die();
		};
	},
	addChild: function() {
		this.children.push.apply(this.children, arguments);
	},
	getC: function(name){
		var v = this.getView(name);
		if (v){
			return v.getC();
		}	
	},
	getFreeView: function(name){
		name = name || 'main';
		var v = this.getView(name);
		if (!v){
			if (typeof this.ui_constr == 'function'){
				var constr = name == 'main' && this.ui_constr;
			} else if (this.ui_constr){
				var constr = this.ui_constr[name]
			}
			if (constr){
				v = constr.call(this);
				if (v){
					this.addView(v, name)
					return v;
				}
				
			}
		}
	},
	getView: function(name, many){
		this.removeDeadViews();
		if (many){
			if (name){
				return this.views[name]
			} else {
				return this.views;
			}
		} else {
			name = name || 'main';
			return this.views[name] && this.views[name][0];
		}
	},
	addView: function(v, name) {
		this.views.push( v );
		name = name || 'main';
		(this.views[name] = this.views[name] || []).push(v);
		return this;
	},
	_updateProxy: function(is_prop, name, value){
		this.removeDeadViews();
		if (name){
			var obj_to_change 	= is_prop ? this : this.states,
				method 			= is_prop ? this.prop_change[name] : this.state_change[name],
				old_value 		= obj_to_change && obj_to_change[name];
				
			if (obj_to_change[name] != value){
				
				if (value){
					obj_to_change[name] = value;
				} else {
					obj_to_change[name] = false;
				}
				if (old_value != obj_to_change[name]){
					if (method){
						method.call(this, value, old_value);
					}
					
					for (var i = 0; i < this.views.length; i++) {
						this.views[i].change(is_prop, name, obj_to_change[name])
					};
					this.fire(name + '-state-change', obj_to_change[name], old_value)
				}
				
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
servView.prototype = new eemiter();
cloneObj(servView.prototype, {
	constructor: servView,
	init: function(){
		eemiter.prototype.init.call(this);
		this.states = {};
		this.states_watchers = {};
		this.view_parts = {};
	},
	state: function(name){
		return this.states[name];
	},
	onDie: function(cb) {
		this.on('die', cb)
	},
	die: function(){
		this.dead = true;
		if (this.c){
			this.c.remove()
		}
		this.fire('die');
		return this;
	},
	setModel: function(mdl, puppet_model){
		this.mdl = mdl;
		if (puppet_model){
			this.puppet_model = puppet_model;
		}
		this.setStates(mdl.states)
		return this;
	},
	appendModelTo: function(m, c) {
		var ui = m.getFreeView();
		if (ui){
			if (typeof c == 'function'){
				c(ui.getC());
			} else {
				c.append(ui.getC());
			}
			ui.appended();
		}
	},
	wasAppended: function() {
		return !!this.append_done;
	},
	appended: function(parentView){
		this.append_done = true;
		if (parentView){
			this.parentView = parentView;
		}
		if (this.appendChildren){
			this.appendChildren();
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
		this.states = {};
		for (var name in states){
			this.change(false, name, states[name]);
		}
		return this;
	},
	callStateWatchers: function(state_name, nv, ov) {
		if (this.states_watchers[state_name]){
			for (var i = 0; i < this.states_watchers[state_name].length; i++) {
				this.states_watchers[state_name][i].call(this, nv, ov);
			}
		}
		return this;
	},
	watchState: function(state_name, cb) {
		(this.states_watchers[state_name] = this.states_watchers[state_name] || [])  .push(cb);
		if (this.states[state_name]){
			cb.call(this, this.states[state_name]);
		}
		return this;
	},
	requireAllParts: function() {
		for (var a in parts_builder){
			this.requirePart(parts_builder[a]);
		}
		return this;
	},
	requirePart: function(name) {
		if (this.view_parts[name]){
			return this.view_parts[name];
		} else {
			return this.parts_builder[name]();
		}
	},
	change: function(is_prop, name, value){
		if (name){
			var obj_to_change = !is_prop ? this.states : this.puppet_model,
				method = is_prop ? this.prop_change[name] : this.state_change[name],
				old_value = obj_to_change && obj_to_change[name];
			
			if (method){
				method.call(this, value, old_value);
			}
			if (!is_prop){
				this.callStateWatchers(name, value, old_value)
			}
			if (obj_to_change){
				if (value){
					obj_to_change[name] = value;
				} else {
					obj_to_change[name] = false;
				}
			};
		}
		return this;
	},
	parts_builder: {
		
	},
	prop_change: {
		
	},
	state_change: {
		
	}
});

