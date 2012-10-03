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
		if (!this.prototypes[name]){
			throw new Error('there is no prototype ' + name + ' in my store');
		}
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
	_addEventHandler: function(namespace, cb, opts, once){
		var
			fired,
			_this = this,
			short_name = namespace.split('.')[0];

		if (opts && opts.exlusive){
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
	once: function(namespace, cb, opts){
		return this._addEventHandler(namespace, cb, opts, true);
	},
	on: function(namespace, cb, opts){
		return this._addEventHandler(namespace, cb, opts);
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
				var curn = cb_cs[i].namespace;
				var canbe_matched = !curn.charAt(namespace.length) || curn.charAt(namespace.length) == '.';
				if (canbe_matched &&  curn.indexOf(namespace) === 0){
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
		this.complex_states_index = {};
		this.complex_states_watchers = [];
		return this;
	},
	state: function(name){
		return this.states[name];
	},
	replaceState: function(name, value, skip_handler) {
		if (name){
			var obj_to_change	= this.states,
				old_value		= obj_to_change && obj_to_change[name],
				method;

			var stateChanger = !skip_handler && this['stch-' + name] || (this.state_change && this.state_change[name]);
			if (stateChanger){
				if (typeof stateChanger == 'function'){
					method = stateChanger;
				} else if (this.checkDepVP){
					if (this.checkDepVP(stateChanger)){
						method = stateChanger.fn;
					}
					
				}
			}
			
			if (old_value != value){
				
				if (method){
					method.call(this, value, old_value);
				}
				obj_to_change[name] = value;
				return [old_value];
			}
		}
	},
	getTargetComplexStates: function(state) {
		var r = [];
		var states = toRealArray(state);
		//.indexOf(state) != -1
		for (var i in this.complex_states){
			var cur = this.complex_states[i];
			if (!states.length || states.length != arrayExclude(states, cur.depends_on).length ){
				var temp_comx = {
					name: i,
					obj: this.complex_states[i]
				};
				this.compoundComplexState(temp_comx);
				r.push(temp_comx);
			}
		}
		return r;
	},
	compoundComplexState: function(temp_comx) {
		var values = [];
		for (var i = 0; i < temp_comx.obj.depends_on.length; i++) {
			values.push(this.state(temp_comx.obj.depends_on[i]));
		};
		var value = temp_comx.obj.fn.apply(this, values);
		temp_comx.value = value;
	},
	checkComplexStates: function(state) {
		var co_sts = this.getTargetComplexStates(state);
		for (var i = 0; i < co_sts.length; i++) {
			this._updateProxy(co_sts[i].name, co_sts[i].value);
		};

	},
	iterateCSWatchers: function(state_name) {
		if (this.complex_states_index[state_name]){
			for (var i = 0; i < this.complex_states_index[state_name].length; i++) {
				this.callCSWatcher(this.complex_states_index[state_name][i]);
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
			if (!this.complex_states_index[cur]){
				this.complex_states_index[cur] = [];
			}
			this.complex_states_index[cur].push(watcher);
			
		}
		this.complex_states_watchers.push(watcher);
		if (this.checkCSWatcher(watcher)){
			this.callCSWatcher(watcher);
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
		this.children_models = {};
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
	getChild: function(collection_name) {
		return this.children_models[collection_name]
	},
	setChild: function(collection_name, array, changed) {
		this.children_models[collection_name] = array;
		if (changed){
			this.sendCollectionChange(collection_name, array);
		}
		return this;
	},
	addChild: function(md, name) {
		this.children.push.call(this.children, md);
	},
	getC: function(name){
		throw new Error('take it easy');
		var v = this.getView(name);
		if (v){
			return v.getC();
		}
	},
	getThing: function(name){
		var view = this.getView(name);
		return view && view.getT();
	},
	getFreeView: function(parent_view, name){
		throw new Error ('detach view from model - use parent view attaching!')
		name = name || 'main';
		var
			args	= Array.prototype.slice.call(arguments),
			v		= this.getView(name, true),
			Constr;

		args.shift();
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
				v.init(this, parent_view);
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
	getView: function(name){
		this.removeDeadViews(true);
		name = name || 'main';
		return this.views_index[name] && this.views_index[name][0];
	},
	addView: function(v, name) {
		this.removeDeadViews(true);
		this.views.push( v );
		name = name || 'main';
		(this.views_index[name] = this.views_index[name] || []).push(v);
		return this;
	},
	sendCollectionChange: function(collection_name, array) {
		this.removeDeadViews();
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].collectionChange(collection_name, array);
		}
	},
	_updateProxy: function(name, value){
		value = value || false;
		var old_value = this.replaceState(name, value);
		if (old_value){
			this.removeDeadViews();
			for (var i = 0; i < this.views.length; i++) {
				this.views[i].change(name, value);
			}
			this.trigger('state-change.' + name, {type: name, value: value, old_value: old_value[0]});
		
			this.checkComplexStates(name);
			this.iterateCSWatchers(name);
		
		}
		return this;
	},
	toggleState: function(name){
		this.updateState(name, !this.state(name));
	},
	updateState: function(name, value){
		if (this.complex_states && this.complex_states[name]){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy(name, value);
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
	init: function(view_otps, opts){
		if (view_otps.parent_view){
			this.parent_view = view_otps.parent_view;
		}
		if (view_otps.root_view){
			this.root_view = view_otps.root_view;
		}
		if (opts){
			this.opts = opts;
		}
		
		this._super();
		this.children = [];
		this.children_models = {};
		this.view_parts = {};
		if (!view_otps.md){
			throw new Error('give me model!');
		}
		this.md = view_otps.md;
		this.undetailed_states = {};
		this.undetailed_children_models = {};
		this.children_viewed = {};

		cloneObj(this.undetailed_states, this.md.states);
		cloneObj(this.undetailed_children_models, this.md.children_models);
		return this;
	},
	children_views: {},
	connectChildrenModels: function() {
		var udchm = this.undetailed_children_models;
		delete this.undetailed_children_models
		this.setMdChildren(udchm);
		 
	},
	connectStates: function() {
		var states = this.undetailed_states;
		delete this.undetailed_states;
		this._setStates(states);
		
	},
	requestDetailes: function(){
		if (this.createDetailes){
			this.createDetailes();
		}
		
		this._detailed = true;
		if (!this.manual_states_connect){
			this.connectChildrenModels();
			this.connectStates();
		}
		
		this.appendCon();
	},
	appendCon: function(){
		var con = this.getC();
		var anchor = this._anchor;
		if (con && anchor && anchor.parentNode){
			$(anchor).after(con);
			delete this._anchor;
			$(anchor).remove();
			this.setVisState('con-appended', true);
		} else if (con && con.parent()){
			this.setVisState('con-appended', true);
		}
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
	getFreeCV: function(child_name, view_space, opts) {
		var md = this.getMdChild(child_name);
		if (md){
			var view = this.getFreeChildView(child_name, md, view_space, opts);
			return view;
		} else {
			throw new Error('there is no ' + child_name + ' child model');
		}
	},
	getAFreeCV: function(child_name, view_space, opts) {
		var view = this.getFreeCV(child_name, view_space, opts);
		var anchor = view.getA();
		if (anchor){
			return anchor;
		} else {
			throw new Error('there is no anchor for view of ' + child_name + ' child model');
		}
	
	},
	getFreeChildView: function(child_name, md, view_space, opts) {
		var view = md.getView(view_space, true);
		if (view){
			return false;
		} else {
			view_space = view_space || 'main';
			var ConstrObj = this.children_views[child_name];

			if (typeof ConstrObj == 'function' && view_space == 'main'){
				view = new ConstrObj();
			} else {
				view = new ConstrObj[view_space]();
			}
			view.init({
				md: md,
				parent_view: this,
				root_view: this.root_view
			}, opts);
			md.addView(view, view_space);
			this.addChildView(view, child_name);
			return view;
		}
	},
	addChildView: function(view, child_name) {
		this.children.push.call(this.children, view);
	},
	addChild: function(view, child_name) {
		this.children.push.call(this.children, view);
	},
	remove: function() {
		var c = this.getC();
		if (c){
			c.remove();
		}
		if (this._anchor){
			$(this._anchor).remove();
		}
	},
	die: function(){
		if (!this.marked_as_dead){
			this.remove();
			this.markAsDead();
			this.marked_as_dead = true;
		}
		
		
		return this;
	},
	setModel: function(md, puppet_model){
		throw new Error('what do you do!?');

		this.md = md;
		var was
		if (puppet_model){
			this.puppet_model = puppet_model;
		}
		this.setStates(md.states);
		return this;
	},
	getT: function(){
		return this.c || this._anchor; 
	},
	getC: function(){
		return this.c;
	},
	getA: function(){
		return this._anchor || (this._anchor = document.createComment(''));

		//document.createTextNode('')
	},
	requestAll: function(){
		return this.requestDeepDetLevels();
	},
	requestDeepDetLevels: function(){
		if (this._states_set_processing || this._collections_set_processing){
			return this;
		}
		//iterate TREE
		var depth = 1;
		var incomplete = true;
		while (incomplete) {
			incomplete = this.requestDetalizationLevel(depth);
			depth++;
		}
		return this;
	},
	requestChildrenDetLev: function(rel_depth){
		var incomplete = false;
		if (this.children.length && rel_depth === 0){
			return true;
		} else {
			for (var i = 0; i < this.children.length; i++) {
				var cur_incomplete = this.children[i].requestDetalizationLevel(rel_depth);
				incomplete = incomplete || cur_incomplete;
			}
			return incomplete;
		}
	},
	requestDetalizationLevel: function(rel_depth, last_request){
		if (!this._detailed){
			this.requestDetailes();
		} 
		return this.requestChildrenDetLev(rel_depth - 1);
	},
	getCNode: function(c) {
		return (c = this.getC()) && (typeof length != 'undefined' ? c[0] : c);
	},
	isAlive: function(dead_doc) {
		if (this.dead){
			return false;
		} else {
			if (this.getC()){
				var c = this.getCNode();
				if (!c || (dead_doc && dead_doc === c.ownerDocument) || !getDefaultView(c.ownerDocument)){
					this.markAsDead();
					return false;
				} else {
					return true;
				}
			} else {
				return true;
			}
			
			
		}
	},
	requestAnimationFrame: function(cb, el, w) {
		var c = this.getC() && (this.getC()[0] || this.getC());
		requestAnimationFrame.call(w || getDefaultView(c.ownerDocument), cb);
	},
	_setStates: function(states){
		this._states_set_processing = true;
		//disallow chilren request untill all states will be setted

		this.states = {};
		var _this = this;


		var complex_states = [];


		var states_list = [];
		for (var name in states){
			this.changeState(name, states[name], false);
			states_list.push(name);
		}
		
		this.checkComplexStates(states_list);

		for (var i = 0; i < this.complex_states_watchers.length; i++) {
			var watcher = this.complex_states_watchers[i];
			if (this.checkCSWatcher(watcher)){
				this.callCSWatcher(watcher);
			}
			
		}
		this._states_set_processing = false;
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
	getStateChangeHandlers: function(){
		var r = {};
		for (var i in this) {
			if (i.indexOf('stch-') == 0){
				r[i.replace('stch-','')] = this[i];
			}
		}
		if (this.state_change){
			for (var i in this.state_change) {
				if (!r[i]){
					r[i] = this.state_change[i];
				}
				
			}	
		}
		
		return r;
	},
	requirePart: function(name) {
		if (this.view_parts[name]){
			return this.view_parts[name];
		} else {
			this.view_parts[name] = this.parts_builder[name].call(this);
			if (!this.view_parts[name]){
				throw new Error('"return" me some build result please');
			}
			var stch_hands = this.getStateChangeHandlers();
			for (var i in stch_hands){
				if (i in this.states && typeof stch_hands[i] != 'function'){
					if (this.checkDepVP(stch_hands[i], name)){
						stch_hands[i].fn.call(this, this.states[i]);
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
	_updateProxy: function(name, value){
		this.changeState(name, value, true);
	},
	changeState: function(name, value, allow_complex_watchers, skip_handler) {
		value = value || false;

		if (this.undetailed_states){
			this.undetailed_states[name] = value;
			return this;
		}

		var old_value = this.replaceState(name, value, skip_handler);
		if (old_value){
			this.trigger('state-change.' + name, {type: name, value: value, old_value: old_value[0]});
			if (allow_complex_watchers){
				this.checkComplexStates(name);
				this.iterateCSWatchers(name);
			}
		
		}
		return this;
	},
	change: function(name, value){
		this._updateProxy(name, value);
	},
	overrideStateSilently: function(name, value) {
		this.changeState(name, value, true, true);
	},
	promiseStateUpdate: function(name, value) {
		this._updateProxy(name, value);
	},
	setVisState: function(name, value) {
		this._updateProxy('vis-' + name, value);
	},
	setMdChildren: function(collections) {
		this._collections_set_processing = true;
		for (var i in collections) {
			this.collectionChange(i, collections[i]);
		}
		this._collections_set_processing = false;
	},
	getMdChild: function(name, one_thing) {
		return this.children_models[name]
	},
	getPrevView: function(array, start_index, name) {
		var i = start_index - 1; 
		if (i >= array.length || i < 0){
			return;
		}
		for (; i >= 0; i--) {
			var view = array[i].getView(name);
			var dom_hook = view && view.getT();
			if (dom_hook){
				return dom_hook;
			}
			
		}
	},
	getNextView: function(array, start_index, name) {
		var i = start_index + 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i < array.length; i++) {
			var view = array[i].getView(name);
			var dom_hook = view && view.getT();
			if (dom_hook){
				return dom_hook;
			}
			
		}
	},
	collectionChange: function(name, array) {
		if (this.undetailed_children_models){
			this.undetailed_children_models[name] = array;
			return this;
		}


		var old_value = this.children_models[name];
		this.children_models[name] = array;
		var collectionChanger = this['collch-' + name];
		if (collectionChanger){
			collectionChanger.call(this, name, array, old_value);
		}
		return this;
	},
	parts_builder: {
		
	}
});
})();
