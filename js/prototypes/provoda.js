var provoda;

(function(){
"use strict";
provoda = {
	prototypes: {},
	Eventor: function(){},
	StatesEmitter: function() {},
	Model: function(){},
	View: function(){},
	addPrototype: function(name, obj){
		if (!this.prototypes[name]){
			this.prototypes[name] = obj;
		} else{
			throw new Error('Already has such prototype');
		}
	},
	extendFromTo: function(name, base, fn){
		base.extendTo(fn, this.prototypes[name]);
		return fn;
	}
};

Class.extendTo(provoda.Eventor, {
	init: function(){
		this.subscribes = {};
		this.reg_fires = {};
		this.requests = [];
		return this;
	},
	_addEventHandler: function(namespace, cb, exlusive, once){
		var
			fired,
			_this = this,
			short_name = namespace.split('.')[0];

		if (exlusive){
			this.off(namespace);
		}

		if (this.reg_fires[short_name]){
			this.reg_fires[short_name].call(this,  function() {
				cb.apply(_this, arguments);

			});
			fired = true;
		}
		if (!(once && fired)){
			if (!this.subscribes[short_name]){
				this.subscribes[short_name] = [];
			}
			this.subscribes[short_name].push({
				namespace: namespace,
				cb: cb,
				once: once
			});
		}
		

		return this;
	},
	once: function(namespace, cb, exlusive){
		return this._addEventHandler(namespace, cb, exlusive, true);
	},
	on: function(namespace, cb, exlusive){
		return this._addEventHandler(namespace, cb, exlusive);
	},
	off: function(namespace, cb, obj){
		var
			clean = [],
			short_name = namespace.split('.')[0],
			queried = this.getMatchedCallbacks(namespace);

		if (this.subscribes[short_name]){
			if (cb || obj){
				for (var i = 0; i < queried.matched.length; i++) {
					var cur = queried.matched[i];
					if (obj ? (obj !== cur) : (cur.cb !== cb)){
						clean.push(queried.matched[i]);
					}
				}
			}
			clean.push.apply(clean, queried.not_matched);
			if (clean.length != this.subscribes[short_name].length){
				this.subscribes[short_name] = clean;
			}
		}
		
	
		
		return this;
	},
	getMatchedCallbacks: function(namespace){
		var
			short_name = namespace.split('.')[0],
			r = {
				matched: [],
				not_matched: []
			};

		var cb_cs = this.subscribes[short_name];
		if (cb_cs){
			for (var i = 0; i < cb_cs.length; i++) {
				if (cb_cs[i].namespace.indexOf(namespace) === 0){
					r.matched.push(cb_cs[i]);
				} else {
					r.not_matched.push(cb_cs[i]);
				}
			}
		}
		
		return r;
	},
	onRegistration: function(name, cb) {
		if (name){
			this.reg_fires[name] = cb;
		}
		return this;
	},
	trigger: function(){
		var args = Array.prototype.slice.call(arguments);
		var name = args.shift();
		var cb_cs = this.getMatchedCallbacks(name).matched;

		if (cb_cs){
			for (var i = 0; i < cb_cs.length; i++) {
				var cur = cb_cs[i]
				cur.cb.apply(this, args);
				if (cur.once){
					this.off(name, false, cur);
				}

				
			}
		}
		return this;
	},
	getRequests: function() {
		return this.requests;
	},
	addRequest: function(rq, depend){
		if (this.requests.indexOf(rq) == -1){
			if (depend){
				if (rq){
					rq.addDepend(this);
				}
			}
			this.requests.push(rq);
			this.trigger('request', rq);
		}
		return this;
		
	},
	stopRequests: function(){
		while (this.requests.length) {
			var rq = this.requests.pop();
			if (rq) {
				if (rq.softAbort){
					rq.softAbort(this);
				} else if (rq.abort){
					rq.abort(this);
				}
			}
		}
		return this;
	},
	getQueued: function() {
		return $filter(this.requests, 'queued');
	},
	setPrio: function(type) {
		var queued = this.getQueued();
		for (var i = 0; i < queued.length; i++) {
			queued[i].setPrio(type);
		}
		return this;
	}
});

var statesEmmiter = provoda.StatesEmitter;
provoda.Eventor.extendTo(provoda.StatesEmitter, {
	init: function(){
		this._super();
		this.states = {};
		this.states_watchers = {};
		this.complex_states = {};
		this.complex_states_watchers = [];
		return this;
	},
	state: function(name){
		return this.states[name];
	},
	replaceState: function(is_prop, name, value) {
		if (name){
			var obj_to_change	= is_prop ? this : this.states,
				old_value		= obj_to_change && obj_to_change[name],
				method			= is_prop && this.prop_change[name];

			if (!method && this.state_change[name]){
				var stateChanger = this.state_change[name];

				if (typeof stateChanger == 'function'){
					method = stateChanger;
				} else if (this.checkDepVP){

					var has_all_dependings = this.checkDepVP(stateChanger);
					if (has_all_dependings){
						method = stateChanger.fn;
					}
					
				}
				
			}
			
			if (old_value != value){
				obj_to_change[name] = value;
				if (method){
					method.call(this, value, old_value);
				}
				return [old_value];
			}
		}
	},
	/*
complex_states: {
	submit_mark: {
		depends_on: ["want_submit", "submited_as"],
		fn: function(want_submit, submited_as){
			return submited_as || want_submit;
		}
	}
},
getComplexStatesIterateArray: function(state){
	var r = [];
	for (var i in this.complex_states){
		var cur = this.complex_states[i];
		if (!state || _indexOf(cur.depends_on, state) != -1){
			r.push({
				name: i,
				done: false,
				obj: this.complex_states[i]
			});
		}
	}
	return r;
},
checkComplexStates: function(md, state){
	return this.getChangedComplexStates(md, this.getComplexStatesIterateArray(state));
},


		
updateState: function(state, value, skip_view_change){
	var md = this.current_model;
	if (md[state] !== value){
		md[state] = value;
		if (!skip_view_change){
			this.changeViewer(state, value);
		}
		var changes = this.checkComplexStates(md);
		for (var i = 0; i < changes.length; i++) {
			md[changes[i].name] = changes[i].value;
			if (!skip_view_change){
				this.changeViewer(changes[i].name, changes[i].value);
			}
		}

	}
},
*/
	iterateCSWatchers: function(state_name) {
		if (this.complex_states[state_name]){
			for (var i = 0; i < this.complex_states[state_name].length; i++) {
				this.callCSWatcher(this.complex_states[state_name][i]);
			}
		}
		return this;
	},
	callCSWatcher: function(watcher) {
		var args = [];
		for (var i = 0; i < watcher.states_list.length; i++) {
			args.push(this.states[watcher.states_list[i]]);
		}
		watcher.func.apply(this, args);
	},
	checkCSWatcher: function(watcher) {
		var match;
		for (var a in this.states) {
			if (watcher.states_list.indexOf(a)){
				match = true;
				break;
			}
		}
		return match;
	},
	watchStates: function(states_list, cb) {
		var watcher = {
			states_list: states_list,
			func: cb
		};

		for (var i = 0; i < states_list.length; i++) {
			var cur = states_list[i];
			if (!this.complex_states[cur]){
				this.complex_states[cur] = [];
			}
			this.complex_states[cur].push(watcher);
			
		}
		this.complex_states_watchers.push(watcher);
		if (this.checkCSWatcher(watcher)){
			this.callCSWatcher(watcher);
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
	}
});


provoda.StatesEmitter.extendTo(provoda.Model, {
	init: function(){
		this._super();
		this.states = {};
		this.views = [];
		this.views_index = {};
		this.children = [];
		return this;
	},
	removeView: function(view){
		var views = [];
		for (var i = 0; i < this.views.length; i++) {
			if (views[i] !== view){
				views.push(views[i]);
			}
		}
		if (views.length != this.views.length){
			this.views = views;
		}
	},
	removeDeadViews: function(hard_deads_check){
		if (hard_deads_check){
			for (var i = 0; i < this.views.length; i++) {
				if (this.views[i].isAlive){
					this.views[i].isAlive();
				}
			}
		}

		var dead = $filter(this.views, 'dead', true);
		var alive = dead.not;

		if (alive.length != this.views.length){
			this.views = alive;
		}

		for (var a in this.views_index){
			this.views_index[a] = arrayExclude(this.views_index[a], dead);
		}

		return this;
	},
	killViews: function() {
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].die();
		}
		this.removeDeadViews();
	},
	die: function(){
		this.stopRequests();
		this.killViews();
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].die();
		}
		this.trigger('die');
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
		var
			args	= Array.prototype.slice.call(arguments),
			v		= this.getView(name, true),
			Constr;

		args.shift();
		args.unshift(this);
		if (!v){
			if (typeof this.ui_constr == 'function'){
				Constr = name == 'main' && this.ui_constr;
			} else if (this.ui_constr){
				Constr = this.ui_constr[name];
			}
			if (Constr){
				v = new Constr();
				v.init.apply(v, args);
				this.addView(v, name);
				return v;
				
			}
		}
	},
	getViews: function(name, hard_deads_check) {
		this.removeDeadViews(hard_deads_check);
		if (name){
			return this.views_index[name];
		} else {
			return this.views;
		}
	},
	getView: function(name, hard_deads_check){
		this.removeDeadViews(hard_deads_check);
		name = name || 'main';
		return this.views_index[name] && this.views_index[name][0];
	},
	addView: function(v, name) {
		this.views.push( v );
		name = name || 'main';
		(this.views_index[name] = this.views_index[name] || []).push(v);
		return this;
	},
	_updateProxy: function(is_prop, name, value){
		value = value || false;
		var old_value = this.replaceState(is_prop, name, value);
		if (old_value){
			this.removeDeadViews();
			for (var i = 0; i < this.views.length; i++) {
				this.views[i].change(is_prop, name, value);
			}
			this.trigger(name + '-state-change', value, old_value[0]);
			if (!is_prop){
				this.callStateWatchers(name, value, old_value[0]);
				this.iterateCSWatchers(name);
			}
		}
		return this;
	},
	updateProp: function(name, value){
		return this._updateProxy(true, name, value);
	},
	toggleState: function(name){
		this.updateState(name, !this.state(name));
	},
	updateState: function(name, value){
		return this._updateProxy(false, name, value);
	},
	prop_change: {
		
	},
	state_change: {
		
	}
});


var
	requestAnimationFrame,
	cancelAnimationFrame;

(function() {
	var
		raf,
		caf,
		lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'];

	if (window.requestAnimationFrame){
		raf = window.requestAnimationFrame;
		caf = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;
	} else {
		for(var x = 0; x < vendors.length && !raf; ++x) {
			raf = window[vendors[x]+'RequestAnimationFrame'];
			caf = caf || 
			  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	}
	
 
	if (!raf) {
		raf = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = 0;
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
		caf = function(id) {
			clearTimeout(id);
		};
	}
	if (!caf){
		caf = function() {};
	}
	requestAnimationFrame = raf;
	cancelAnimationFrame = caf;
		
}());




provoda.StatesEmitter.extendTo(provoda.View, {
	init: function(){
		this._super();
		this.children = [];
		this.view_parts = {};
		return this;
	},
	onDie: function(cb) {
		this.on('die', cb);
	},
	markAsDead: function() {
		this.dead = true;
		this.trigger('die');
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].markAsDead();
		}
	},
	addChild: function() {
		this.children.push.apply(this.children, arguments);
	},
	die: function(){
		if (!this.dead){
			var c = this.getC();
			if (c){
				c.remove();
			}

		}
		this.markAsDead();
		
		return this;
	},
	setModel: function(md, puppet_model){
		if (this.md && this.md !== md && this.reset){
			this.reset();
		}
		this.md = md;
		var was
		if (puppet_model){
			this.puppet_model = puppet_model;
		}
		this.setStates(md.states);
		return this;
	},
	wasAppended: function() {
		return !!this.append_done;
	},
	appended: function(parent_view){
		this.append_done = true;
		if (parent_view){
			this.parent_view = parent_view;
		}
		if (this.onAppend){
			this.onAppend(parent_view);
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
	requestAnimationFrame: function(cb, el, w) {
		var c = this.getC() && (this.getC()[0] || this.getC());
		requestAnimationFrame.call(w || getDefaultView(c.ownerDocument), cb);
	},
	setStates: function(states, reset){
		if (reset && this.reset){
			this.reset();
		}
		this.states = {};
		var _this = this;

		for (var name in states){
			this.changeState(false, name, states[name], false, true);
		}
		for (var i = 0; i < this.complex_states_watchers.length; i++) {
			var watcher = this.complex_states_watchers[i];
			if (this.checkCSWatcher(watcher)){
				this.callCSWatcher(watcher);
			}
			
		}
		
		return this;
	},
	
	requireAllParts: function() {
		for (var a in parts_builder){
			this.requirePart(parts_builder[a]);
		}
		return this;
	},
	getPart: function(name) {
		return this.view_parts[name];
	},
	requirePart: function(name) {
		if (this.view_parts[name]){
			return this.view_parts[name];
		} else {
			this.view_parts[name] = this.parts_builder[name].call(this);
			for (var i in this.state_change){
				if (i in this.states && typeof this.state_change[i] != 'function'){
					if (this.checkDepVP(this.state_change[i], name)){
						this.state_change[i].fn.call(this, this.states[i]);
					}
				}
			}
			return this.view_parts[name];
		}
	},
	checkDepVP: function(state_changer, builded_vp_name) {
		var has_all_dependings;
		if (builded_vp_name && state_changer.dep_vp.indexOf(builded_vp_name) == -1){
			return false;
		}
		for (var i = 0; i < state_changer.dep_vp.length; i++) {
			var cur = state_changer.dep_vp[i];
			if (!this.view_parts[cur]){
				has_all_dependings = false;
				break;
			} else {
				has_all_dependings = true;
			}
		}
		return has_all_dependings;
	},
	changeState: function(is_prop, name, value, allow_complex_watchers, skip_animation_frame) {
		value = value || false;


		var old_value = this.replaceState(is_prop, name, value);
		if (old_value){
			this.trigger(name + '-state-change', value, old_value[0]);
			if (!is_prop){
				this.callStateWatchers(name, value, old_value[0]);
				if (allow_complex_watchers){
					this.iterateCSWatchers(name);
				}
			}
		}

		
		return this;
	},
	change: function(is_prop, name, value){
		this.changeState(is_prop, name, value, true);
	},
	parts_builder: {
		
	},
	prop_change: {
		
	},
	state_change: {
		
	}
});
})();
