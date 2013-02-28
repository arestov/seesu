var provoda;

(function(){
"use strict";
provoda = {
	prototypes: {},
	Eventor: function(){},
	StatesEmitter: function(){},
	Model: function(){},
	View: function(){},
	ItemsEvents: function(){},
	StatesArchiver: function(){},
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

Class.extendTo(provoda.ItemsEvents, {
	init: function(event_name, eventCallback, skip_event_regf) {
		this.controls_list = [];
		this.event_name = event_name;
		this.eventCallback = eventCallback;
		this.skip_event_regf = skip_event_regf;
	},
	unsubcribeOld: function() {
		if (this.controls_list.length){
			for (var i = 0; i < this.controls_list.length; i++) {
				this.controls_list[i].unsubcribe();
			}
		}
	},
	setItems: function(items_list) {
		this.unsubcribeOld();
		this.items_list = items_list;
		this.controls_list = [];
		for (var i = 0; i < items_list.length; i++) {
			this.controls_list.push(
				items_list[i].on(this.event_name, this.eventCallback, {
					easy_bind_control: true,
					skip_reg: this.skip_event_regf
				})
			);
		}
	}

});

provoda.ItemsEvents.extendTo(provoda.StatesArchiver, {
	init: function(state_name, opts) {
		var _this = this;
		this.checkFunc = function(e) {
			var item = this;
			_this.getItemsValues(item);
		};
		this.state_name = state_name;
		this._super('state-change.' + this.state_name, this.checkFunc, true);
		
		this.returnResult = opts.returnResult;
		var calcR = opts.calculateResult;
		if (calcR){
			if (typeof calcR == 'function'){
				this.calculateResult = calcR;
			} else {
				if (calcR == 'some'){
					this.calculateResult = this.some;
				} else if (calcR == 'every'){
					this.calculateResult = this.every;
				}
			}

			
		} else {
			this.calculateResult = this.some;
		}
	},
	calculateResult: null,
	every: function(values_array) {
		for (var i = 0; i < values_array.length; i++) {
			var cur = values_array[i];
			if (!cur){
				return false;
			}
		}
		return true;
	},
	some: function(values_array, fn) {
		for (var i = 0; i < values_array.length; i++) {
			var cur = values_array[i];
			if (cur){
				return true;
			}
		}
		return false;
	},
	getItemsValues: function(item) {
		var values_list = [];
		for (var i = 0; i < this.items_list.length; i++) {
			values_list.push(this.items_list[i].state(this.state_name));
		}

		this.returnResult.call(this, this.calculateResult.call(this, values_list));
		return values_list;
	},
	unsubcribeOld: function() {
		if (this.controls_list.length){
			for (var i = 0; i < this.controls_list.length; i++) {
				this.controls_list[i].unsubcribe();
			}
		}
	},
	setItems: function(items_list) {
		this._super(items_list);
		this.checkFunc();
	}
});

var BindControl = function() {};
Class.extendTo(BindControl, {
	init: function(eventor, short_name, namespace, cb, once) {
		this.ev = eventor;
		this.short_name = short_name;
		this.namespace = namespace;
		this.cb = cb;
		this.once = once;
	},
	subscribe: function() {
		this.unsubcribe();
		this.ev._pushCallbackToStack(this.short_name, this.namespace, this.cb, this.once);
	},
	unsubcribe: function() {
		this.ev.off(this.namespace, this.cb);
	}
});

Class.extendTo(provoda.Eventor, {
	init: function(){
		this.subscribes = {};
		this.reg_fires = {};
		this.requests = {};
		return this;
	},
	_pushCallbackToStack: function(short_name, namespace, cb, once) {
		if (!this.subscribes[short_name]){
			this.subscribes[short_name] = [];
		}
		this.subscribes[short_name].push({
			namespace: namespace,
			cb: cb,
			once: once
		});
	},
	getPossibleRegfires: function(namespace) {
		var parts = namespace.split('.');
		var funcs = [];
		for (var i = parts.length - 1; i > -1; i--) {
			var posb_namespace = parts.slice(0, i + 1).join('.');
			if (this.reg_fires[posb_namespace]){
				funcs.push(this.reg_fires[posb_namespace]);
			}
		}
		return funcs;
	},
	_addEventHandler: function(namespace, cb, opts, once){
		if (this.convertEventName){
			namespace = this.convertEventName(name);
		}

		var
			fired,
			_this = this,
			name_parts = namespace.split('.'),
			short_name = name_parts[0];

		if (opts && opts.exlusive){
			this.off(namespace);
		}
		if (!opts || !opts.skip_reg){
			var reg_fires = this.getPossibleRegfires(namespace);
			if (reg_fires.length){
				reg_fires[0].call(this, function() {
					fired = true;
					var args = arguments;
					if (opts && opts.soft_reg){
						setTimeout(function() {
							cb.apply(_this, args);
						}, 0);
					} else {
						cb.apply(_this, args);
					}
					
					
					
				}, namespace, opts, name_parts);
			}
		}
		

		/*if (this.reg_fires[short_name]){
			this.reg_fires[short_name]
			
		}*/
		if (!(once && fired)){
			this._pushCallbackToStack(short_name, namespace, cb, once);
		}
		if (opts && opts.easy_bind_control){
			var bind_control = new BindControl();
			bind_control.init(this, short_name, namespace, cb, once);
			return bind_control;
		} else {
			return this;
		}
		

		
	},
	once: function(namespace, cb, opts){
		return this._addEventHandler(namespace, cb, opts, true);
	},
	on: function(namespace, cb, opts){
		return this._addEventHandler(namespace, cb, opts);
	},
	off: function(namespace, cb, obj){
		if (this.convertEventName){
			namespace = this.convertEventName(name);
		}
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
		if (this.convertEventName){
			name = this.convertEventName(name);
		}

		var cb_cs = this.getMatchedCallbacks(name).matched;

		if (cb_cs){
			for (var i = 0; i < cb_cs.length; i++) {
				var cur = cb_cs[i];
				cur.cb.apply(this, args);
				if (cur.once){
					this.off(name, false, cur);
				}

				
			}
		}
		return this;
	},
	getRequests: function(space) {
		space = space || 'common';
		return this.requests[space] || [];
	},
	addRequest: function(rq, opts){
		opts = opts || {};
		//space, depend
		var space = opts.space || 'common';
		if (opts.order){
			rq.order = opts.order;
		}
		if (!this.requests[space]){
			this.requests[space] = [];
		}
		var target_arr = this.requests[space];


		if (target_arr.indexOf(rq) == -1){
			if (opts.depend){
				if (rq){
					rq.addDepend(this);
				}
			}
		//	console.group(target_arr);
			target_arr.push(rq);
			this.sortRequests(target_arr, space);
		//	console.group(target_arr);
		//	console.groupEnd()
			this.trigger('request', rq, space);
		}
		return this;
		
	},
	sortRequests: function(requests, space) {
		return requests.sort(function(a,b ){return sortByRules(a, b, ['order'])});
	},
	getAllRequests: function() {
		var all_requests = [];
		for (var space in this.requests){
			all_requests = all_requests.concat(this.requests[space]);
		}
		return all_requests;
	},
	stopRequests: function(){

		var all_requests = this.getAllRequests();

		while (all_requests.length) {
			var rq = all_requests.pop();
			if (rq) {
				if (rq.softAbort){
					rq.softAbort(this);
				} else if (rq.abort){
					rq.abort(this);
				}
			}
		}
		this.requests = {};
		return this;
	},
	getQueued: function(space) {
		var requests = this.getRequests(space);
		return $filter(requests, 'queued');
	},
	setPrio: function(type, space) {
		var queued = this.getQueued(space);
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
		this.states_changing_stack = [];

		this.onRegistration('state-change', function(cb, namespace, opts, name_parts) {
			var state_name = name_parts[1];
			cb({
				value: this.state(state_name)
			});
		});
		return this;
	},
	state: function(name){
		return this.states[name];
	},
	compressStatesChanges: function(changes_list) {
		var result_changes = {};
		var result_changes_list = [];

		for (var i = 0; i < changes_list.length; i++) {
			var cur = changes_list[i];
			if (!result_changes[cur.name]){
				var obj = {name: cur.name};
				result_changes[cur.name] = obj;
				result_changes_list.push(obj);
			}
			result_changes[cur.name].value = cur.value;
		}
		return result_changes_list;
	},
	_replaceState: function(name, value, skip_handler) {
		if (name){
			var obj_to_change	= this.states,
				old_value		= obj_to_change && obj_to_change[name],
				method;

			var stateChanger = !skip_handler && (this['stch-' + name] || (this.state_change && this.state_change[name]));
			if (stateChanger){
				if (typeof stateChanger == 'function'){
					method = stateChanger;
				} else if (this.checkDepVP){
					if (this.checkDepVP(stateChanger)){
						method = stateChanger.fn;
					}
					
				}
			}
			//
			value = value || false;
			//less calculations? (since false and "" and null and undefinded now os equeal and do not triggering changes)
			//
			
			if (old_value != value){
				
				obj_to_change[name] = value;
				
				if (method){
					method.call(this, value, old_value);
				}
				
				return [old_value];
			}
		}
	},
	_updateProxy: function(changes_list, opts) {
		var i, cur;
		if (this.undetailed_states){
			for (i = 0; i < changes_list.length; i++) {
				cur = changes_list[i];
				this.undetailed_states[cur.name] = cur.value;
				
			}
			return this;
		}
		this.states_changing_stack.push({
			list: changes_list,
			opts: opts
		});

		if (this.collecting_states_changing){
			return this;
		}
		this.collecting_states_changing = true;

		var total_all_states_ch = [];

		//пораждать события изменившихся состояний (в передлах одного стэка/вызова)
		//для пользователя пока пользователь не перестанет изменять новые состояния
		while (this.states_changing_stack.length){
			var all_i_cg = [];
			var original_states = cloneObj({}, this.states);
			var cur_changes = this.states_changing_stack.shift();

			//получить изменения для состояний, которые изменил пользователь через публичный метод
			var changed_states = this.getChanges(cur_changes.list, cur_changes.opts);

			var all_ch_compxs = [];
			//проверить комплексные состояния
			var first_compxs_chs = this.getComplexChanges(changed_states);
			if (first_compxs_chs.length){
				all_ch_compxs = all_ch_compxs.concat(first_compxs_chs);
			}
			
			var current_compx_chs = first_compxs_chs;
			
			//довести изменения комплексных состояний до самого конца
			while (current_compx_chs.length){
				var cascade_part = this.getComplexChanges(current_compx_chs);
				current_compx_chs = cascade_part;
				if (cascade_part.length){
					all_ch_compxs = all_ch_compxs.concat(cascade_part);
				}
				
			}

			//собираем все группы изменений
			all_i_cg = all_i_cg.concat(changed_states, all_ch_compxs);

			//устраняем измененное дважды и более
			var result_changes_list = this.compressStatesChanges(all_i_cg);

			


			var called_watchers = [];
			for (i = 0; i < result_changes_list.length; i++) {
				cur = result_changes_list[i];


				//вызов стандартного события
				this.trigger('state-change.' + cur.name, {
					type: cur.name,
					value: cur.value,
					old_value: original_states[cur.name]
				});

				//вызов комплексного наблюдателя
				var watchers = this.complex_states_index[cur.name];
				if (watchers){
					for (var jj = 0; jj < watchers.length; jj++) {
						var watcher = watchers[jj];
						if (called_watchers.indexOf(watcher) == -1){
							this.callCSWatcher(watcher);
							called_watchers.push(watcher);
						}
					}
				}
			}
			total_all_states_ch = total_all_states_ch.concat(result_changes_list);
		}
		//устраняем измененное дважды и более
		var total_result_changes = this.compressStatesChanges(total_all_states_ch);

		if (this.sendStatesToViews){
			this.sendStatesToViews(total_result_changes);
		}


		this.collecting_states_changing = false;
		return this;
	},
	getComplexChanges: function(changes_list) {
		return this.getChanges(this.checkComplexStates(changes_list));
	},
	getChanges: function(changes_list, opts) {
		var changed_states = [];
		for (var i = 0; i < changes_list.length; i++) {
			var cur = changes_list[i];
			
			var old_value = this._replaceState(cur.name, cur.value, opts && opts.skip_handler);
			if (old_value){
				changed_states.push({
					name: cur.name,
					old_value: old_value[0],
					value: cur.value
				});
			}
		}
		if (this.tpl){
			this.tpl.setStates(this.states);
		}
		return changed_states;
	},
	checkComplexStates: function(changed_states) {
		var list = $filter(changed_states, 'name');
		var co_sts = this.getTargetComplexStates(list);
		return co_sts;
	},
	getTargetComplexStates: function(state) {
		var states = toRealArray(state);
		if (!state){
			throw new Error('something wrong');
		}

		var compx_check = {};
		var full_comlxs_list = [];
		var result_array = [];
		var comlx_name;

		for (comlx_name in this){
			if (comlx_name.indexOf('compx-') === 0){
				var name = comlx_name.replace('compx-', '');
				compx_check[name] = true;
				full_comlxs_list.push({
					name: name,
					obj: this[comlx_name]
				});
			}
		}
		for (comlx_name in this.complex_states){
			if (!compx_check[comlx_name]){
				full_comlxs_list.push({
					name: comlx_name,
					obj: this.complex_states[comlx_name]
				});
			}
		}

		for (var i = 0; i < full_comlxs_list.length; i++) {
			var cur = full_comlxs_list[i];
			if (states.length != arrayExclude(states, cur.obj.depends_on).length ){
				cur.value = this.compoundComplexState(cur);
				result_array.push(cur);
			}
		}

		return result_array;
	},
	compoundComplexState: function(temp_comx) {
		var values = [];
		for (var i = 0; i < temp_comx.obj.depends_on.length; i++) {
			values.push(this.state(temp_comx.obj.depends_on[i]));
		}
		return temp_comx.obj.fn.apply(this, values);
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

var models_counters = 0;
provoda.StatesEmitter.extendTo(provoda.Model, {
	init: function(){

		this._super();

		this.onRegistration('child-change', function(cb, namespace, opts, name_parts) {
			var child_name = name_parts[1];
			var child = this.getChild(child_name);
			if (child){
				cb({
					value: child
				});
			}
		});

		this._provoda_id = models_counters++;
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
		return this;
	},
	die: function(){
		this.stopRequests();
		this.killViews();
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].die();
		}
		this.trigger('die');
		return this;
	},
	watchChildrenStates: function(collection_name, state_name, callback) {
		//
		var _this = this;
		var items_events = new provoda.ItemsEvents();
		items_events.init('state-change.' + state_name, function() {
			callback.call(_this, {
				item: this,
				args: arguments
			});
		}, true);
		this.on('child-change.' + collection_name, function(e) {
			items_events.setItems(e.value);
		});
	},
	archivateChildrenStates: function(collection_name, collection_state, statesCalcFunc, result_state_name) {
		var _this = this;
		var archiver = new provoda.StatesArchiver();
		archiver.init(collection_state, {
			returnResult: function(value) {
				_this.updateState(result_state_name || collection_state, value);
			},
			calculateResult: statesCalcFunc
		});
		this.on('child-change.' + collection_name, function(e) {
			archiver.setItems(e.value);
		});
	},
	getChild: function(collection_name) {
		return this.children_models[collection_name];
	},
	setChild: function(collection_name, array, changed) {
		if (collection_name.indexOf('.') != -1){
			throw new Error('remove "." (dot) from name');
		}
		this.children_models[collection_name] = array;

		var event_obj = {};
		if (typeof changed == 'object'){
			cloneObj(event_obj, changed);
		}
		event_obj.value = array;
		event_obj.no_changing_mark = !changed;
		
		this.trigger('child-change.' + collection_name, event_obj);

		if (changed){
			this.sendCollectionChange(collection_name, array);
		}

		return this;
	},
	addChild: function(md, name) {
		if (this.children.indexOf(md) == -1){
			this.children.push.call(this.children, md);
		}
		
	},
	getRooConPresentation: function(mplev_view, get_ancestor) {
		var views = this.getViews();
		var cur;
		for (var i = 0; i < views.length; i++) {
			cur = views[i];
			var target = cur.root_view.getChildView(this, 'main');
			if (target == cur){
				return cur;
			}
		}
		for (var jj = 0; jj < views.length; jj++) {
			cur = views[jj];
			var ancestor;
			if (mplev_view){
				ancestor = cur.getAncestorByRooViCon('details');
			} else {
				ancestor = cur.getAncestorByRooViCon('main');
			}
			if (ancestor){
				if (get_ancestor){
					return ancestor;
				} else {
					return cur;
				}
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
	getView: function(complex_id){
		this.removeDeadViews(true);
		complex_id = complex_id || 'main';
		return this.views_index[complex_id] && this.views_index[complex_id][0];
	},
	addView: function(v, complex_id) {
		this.removeDeadViews(true);
		this.views.push( v );
		complex_id = complex_id || 'main';
		(this.views_index[complex_id] = this.views_index[complex_id] || []).push(v);
		return this;
	},
	sendCollectionChange: function(collection_name, array) {
		this.removeDeadViews();
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].collectionChange(collection_name, array);
		}
	},
	hasComplexStateFn: function(state_name) {
		if (this.complex_states && this.complex_states[name]){
			return true;
		}
		if (this['compx-' + state_name]){
			return true;
		}
	},
	sendStatesToView: function(view, states_list) {
		view.recieveStatesChanges(states_list);
	},
	sendStatesToViews: function(states_list) {
		for (var i = 0; i < this.views.length; i++) {
			this.sendStatesToView(this.views[i], states_list);
			
		}
	},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var i in obj) {
			changes_list.push({
				name: i,
				value: obj[i]
			});
			
		}
		this._updateProxy(changes_list);
	},
	updateState: function(name, value){
		if (name.indexOf('-') != -1){
			console.warn('fix prop name: ' + name);
		}
		if (this.hasComplexStateFn(name)){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy([{
			name: name,
			value: value
		}]);
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


var Template = function() {};
var angbo = window.angbo;

Class.extendTo(Template, {
	init: function(opts) {
		this.root_node = opts.node;
		this.ancs = {};
		this.children_templates = {};
		this.directives_names_list = [];
		this.states_watchers = [];
		this.stwat_index = {};
		
		for (var directive_name in this.directives){
			this.directives_names_list.push(directive_name);
		}
		this.getPvAnchors(this.root_node);
		if (!window.angbo || !window.angbo.interpolateExpressions){
			console.log('cant pasre statements');
		}
	},
	bindStandartChange: function(node, attr_obj, getValue, setValue, simplifyValue) {
		var text_statement = attr_obj.value;
		if (text_statement){
			var calculator = angbo.interpolateExpressions(text_statement);
			if (calculator){
				var original_value = getValue.call(this, node, attr_obj);
				if (simplifyValue){
					original_value = simplifyValue.call(this, original_value);
				}

				var all_values = $filter(calculator.parts,'propsToWatch');
				var all_vs = [];
				all_vs = all_vs.concat.apply(all_vs, all_values);

				console.log('all propsToWatch');
				console.log(all_vs);
				var sfy_values = [];
				for (var i = 0; i < all_vs.length; i++) {
					var parts = all_vs[i].split('.');
					var main_part = parts[0];
					sfy_values.push(main_part);
				}
				var _this = this;

				this.states_watchers.push({
					values: all_vs,
					sfy_values: sfy_values,
					checkFunc: function(states) {
						var new_value = calculator(states);
						if (simplifyValue){
							new_value = simplifyValue.call(_this, new_value);
						}
						if (original_value != new_value){
							setValue.call(_this, node, attr_obj, new_value, original_value);
							original_value = new_value;
						}
					}
				});
			}
		}
	},
	dom_helpres: {
		getTextValue: function(node) {
			return $(node).text();
		},
		setTextValue: function(node, attr_obj, new_value, old_value) {
			$(node).text(new_value);
		},
		getClass: function(node, attr_obj) {
			return attr_obj.value;
		},
		setClass: function(node, attr_obj, new_value, old_value) {
			attr_obj.value = new_value;
		}
	},
	directives: {
		'pv-text': function(node, attr_obj){
			this.bindStandartChange(node, attr_obj, this.dom_helpres.getTextValue, this.dom_helpres.setTextValue);

		},
		'px-class': function(node, attr_obj) {
			this.bindStandartChange(node, attr_obj, this.dom_helpres.getClass, this.dom_helpres.setClass, function(value) {
				if (!value){
					return value;
				}
				return value.replace(/\s+/gi,' ').replace(/^\s|\s$/gi,'');
			});
		},
		'pv-anchor': function(node, attr_obj) {
			var anchor_name = attr_obj.value;
			//if (typeof anchor_name)

			if (this.ancs[anchor_name]){
				throw new Error('anchors exists');
			} else {
				this.ancs[anchor_name] = $(node);
			}

			/*
			.getAttribute('pv-anchor');

			if (typeof anchor_name == 'string'){
				
			}
			*/

		}
	},
	setStates: function(states) {
		for (var i = 0; i < this.states_watchers.length; i++) {
			this.states_watchers[i].checkFunc(states);
		}
	},
	/*
	checkValues: function(array, all_states) {
		var checked = [];

		for (var i = 0; i < array.length; i++) {
			array[i]
		}
	},*/
	handleDirective: function(directive_name, node, attr_obj, result_cache) {
		this.directives[directive_name].call(this, node, attr_obj, result_cache);
	},
	getPvViews: function(array) {
		var result = this.children_templates;
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var name_parts = cur.view_name.split(' ');
			var real_name;
			var space = 'main';
			if (name_parts[1]){
				throw new Error('uncomplete code; fixme');
			} else {
				real_name = name_parts[0];
			}
			
			if (!result[real_name]){
				result[real_name] = {};
			}
			if (!result[real_name][space]){
				result[real_name][space] = [];
			}

			result[real_name][space] = cur;
			cur.views = [];
		}
		return result;
	},
	getPvAnchors: function(vroot_node) {
		var match_stack =[];
		var pv_views = [];
		//var anchors = [];

		vroot_node = vroot_node && vroot_node[0] || vroot_node;
		match_stack.push(vroot_node);

		while (match_stack.length){
			var cur_node = match_stack.shift();
			if (cur_node.nodeType != 1){
				continue;
			}
			var view_name = vroot_node !== cur_node && cur_node.getAttribute('pv-view');
			if (typeof view_name == 'string'){
				pv_views.push({
					node: cur_node,
					view_name: view_name
				});
			} else {
				var i, attributes = cur_node.attributes;
				for (i = 0; i < attributes.length; i++) {
					var attr_name = attributes[i].name;
					if (this.directives_names_list.indexOf(attr_name) != -1){
						this.handleDirective(attr_name, cur_node, attributes[i]);
					}
				}
				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node.childNodes[i]);
				}

			}

		}
		this.getPvViews(pv_views);
		this.stwat_index = makeIndexByField(this.states_watchers, 'sfy_values');
	}
});

var views_counter = 0;
var way_points_counter = 0;
provoda.StatesEmitter.extendTo(provoda.View, {
	init: function(view_otps, opts){
		this.view_id = views_counter++;
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
		this.way_points = [];

		cloneObj(this.undetailed_states, this.md.states);
		cloneObj(this.undetailed_children_models, this.md.children_models);
		return this;
	},
	children_views: {},
	canUseWaypoints: function() {
		return true;
	},
	canUseDeepWaypoints: function() {
		return true;
	},
	getWaypoints: function() {
		return this.canUseWaypoints() ? this.way_points : [];
	},
	getAllWaypoints: function(exept) {
		var  all = [];
		all = all.concat(this.getWaypoints());
		all = all.concat(this.getDeepWaypoints());
		return all;
	},
	getDeepWaypoints: function(exept) {
		var all = [];
		if (this.canUseWaypoints() && this.canUseDeepWaypoints()){
			//var views = this.getDeepChildren(exept);
			
			for (var i = 0; i < this.children.length; i++) {
				var cur = this.children[i];
				all = all.concat(cur.getAllWaypoints());
			}
		}
		
		return all;
	},
	addWayPoint: function(point, opts) {
		var obj = {
			node: point,
			canUse: opts && opts.canUse,
			simple_check: opts && opts.simple_check,
			view: this,
			wpid: ++way_points_counter
		};
		if (!opts || (!opts.simple_check && !opts.canUse)){
			//throw new Error('give me check tool!');
		}
		this.way_points.push(obj);
	},
	getTemplate: function(node) {
		node = node[0] || node;
		var template = new Template();
		template.init({node: node});
		return template;
	},
	createTemplate: function() {
		if (!this.c){
			throw new Error('cant create template');
		}
		this.tpl = this.getTemplate(this.c);
	},
	connectChildrenModels: function() {
		var udchm = this.undetailed_children_models;
		delete this.undetailed_children_models;
		this.setMdChildren(udchm);
		 
	},
	connectStates: function() {
		var states = this.undetailed_states;
		delete this.undetailed_states;
		this._setStates(states);
		
	},
	createDetailes: function() {
		if (this.opts && this.opts.pv_view){
			if (this.useBase){
				this.useBase(this.opts.pv_view);
			}
		} else if (this.createBase){
			this.createBase();
		}

		
		
	},
	requestDetailes: function(){
		
		this.createDetailes();
		
		
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
	getAncestorByRooViCon: function(view_space) {
		//by root view connection
		var target_ancestor;
		var cur_ancestor = this;
		while (!target_ancestor && cur_ancestor){
			if (cur_ancestor == this.root_view){
				break;
			} else {
				if (cur_ancestor.parent_view == this.root_view){
					if (cur_ancestor == this.root_view.getChildView(cur_ancestor.md, view_space)){
						target_ancestor = cur_ancestor;
						break;
					}
				}
			}

			cur_ancestor = cur_ancestor.parent_view;
		}
		return target_ancestor;
	},
	getChildView: function(md, view_space) {
		var complex_id = this.view_id  + '_' + view_space;
		return md.getView(complex_id, true);
	},
	getFreeChildView: function(child_name, md, view_space, opts) {
		view_space = view_space || 'main';
		var complex_id = this.view_id  + '_' + view_space;
		var view = md.getView(complex_id, true);
		if (view){
			return false;
		} else {
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
			md.addView(view, complex_id);
			this.addChildView(view, child_name);
			return view;
		}
	},
	addChildView: function(view, child_name) {
		this.children.push.call(this.children, view);
	},
	addChild: function(view, child_name) {
		if (this.children.indexOf(view) == -1){
			this.children.push.call(this.children, view);
		}
	},
	removeChildViewsByMd: function(md) {
		var views_to_remove = [];
		var views = md.getViews();
		for (var i = 0; i < this.children.length; i++) {
			var cur = this.children[i];
			if (views.indexOf(cur) != -1){
				views_to_remove.push(cur);
			}
			
		}
		for (var i = 0; i < views_to_remove.length; i++) {
			views_to_remove[i].die();
		}
		

	},
	getDeepChildren: function(exept) {
		var all = [];
		var big_tree = [];
		exept = toRealArray(exept);

		big_tree.push(this);
		//var cursor = this;
		while (big_tree.length){
			var cursor = big_tree.shift();

			for (var i = 0; i < cursor.children.length; i++) {
				var cur = cursor.children[i];
				if (all.indexOf(cur) == -1 && exept.indexOf(cur) == -1){
					big_tree.push(cur);
					all.push(cur);
				}
				
			}

		}
		return all;
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
			states_list.push({
				name: name,
				value: states[name]
			});
		}

		this._updateProxy(states_list);
		this._states_set_processing = false;

		
		return this;
	},
	
	requireAllParts: function() {
		for (var a in this.parts_builder){
			this.requirePart(a);
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
	recieveStatesChanges: function(changes_list) {
		this._updateProxy(changes_list);
	},
	overrideStateSilently: function(name, value) {
		this._updateProxy([{
			name: name,
			value: value
		}], {skip_handler: true});
	},
	promiseStateUpdate: function(name, value) {
		this._updateProxy([{
			name: name,
			value: value
		}]);
	},
	setVisState: function(name, value) {
		this._updateProxy([{
			name: 'vis-' + name,
			value: value
		}]);
	},
	setMdChildren: function(collections) {
		this._collections_set_processing = true;
		for (var i in collections) {
			this.collectionChange(i, collections[i]);
		}
		this._collections_set_processing = false;
	},
	getMdChild: function(name, one_thing) {
		return this.children_models[name];
	},
	getPrevView: function(array, start_index, view_space) {
		view_space = view_space || 'main';
		var complex_id = this.view_id  + '_' + view_space;

		var i = start_index - 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i >= 0; i--) {
			var view = array[i].getView(complex_id);
			var dom_hook = view && view.getT();
			if (dom_hook){
				return dom_hook;
			}
			
		}
	},
	getNextView: function(array, start_index, view_space) {
		view_space = view_space || 'main';
		var complex_id = this.view_id  + '_' + view_space;
		
		var i = start_index + 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i < array.length; i++) {
			var view = array[i].getView(complex_id);
			var dom_hook = view && view.getT();
			if (dom_hook){
				return dom_hook;
			}
			
		}
	},
	checkCollchItemAgainstPvView: function(name, real_array, space_name, pv_view) {
		if (real_array.length > 1){
			throw new Error('uncomplete code; cant do this');
		}

		for (var mmm = 0; mmm < real_array.length; mmm++) {
			var cur_md = real_array[mmm];
			if (pv_view.done){
				throw new Error('uncomplete');
			}
			pv_view.done = true;
			if (mmm !== 0){
				//document.createComment
			}
			var view = this.getFreeChildView(name, cur_md, space_name, {
				pv_view: $(pv_view.node)
			});
			if (view){
				pv_view.views.push(view.view_id);
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

		var real_array;

		var pv_views = getTargetField(this, 'tpl.children_templates.' + name);
		if (pv_views){
			for (var space_name in pv_views){
				this.checkCollchItemAgainstPvView(name, toRealArray(array), space_name, pv_views[space_name]);
			}
			this.requestAll();
		}


		var collch = this['collch-' + name];//collectionChanger
		if (collch){
			if (typeof collch == 'function'){
				collch.call(this, name, array, old_value);
			} else {
				var not_request, collchs;
				var collchs_limit;
				if (typeof collch == 'object'){
					not_request = collch.not_request;
					collchs = collch.spaces;
					collchs_limit = collch.limit;
				}

				collchs = collchs || toRealArray(collch);

				var declarations = [];
				for (var i = 0; i < collchs.length; i++) {
					declarations.push(this.parseCollectionChangeDeclaration(collchs[i]));
				}
				real_array = toRealArray(array);
				var array_limit;
				if (collchs_limit){
					array_limit = Math.min(collchs_limit, real_array.length);
				} else {
					array_limit = real_array.length;
				}

				for (var bb = 0; bb < array_limit; bb++) {
					var cur = real_array[bb];
					for (var jj = 0; jj < declarations.length; jj++) {
						var declr = declarations[jj];
						var opts = declr.opts;
						this.appendFVAncorByVN({
							md: cur,
							name: (declr.by_model_name ? cur.model_name : name),
							opts: (typeof opts == 'function' ? opts.call(this, cur) : opts),
							place: declr.place,
							space: declr.space,
							strict: declr.strict
						});
					}
				}

				if (!not_request){
					this.requestAll();
				}
			}
		}
		return this;
	},
	parseCollectionChangeDeclaration: function(collch) {
		if (typeof collch == 'string'){
			collch = {
				place: collch
			};
		}
		var place;
		/*
		{
			place: 'c',
			by_model_name: true,
			space: 'nav'
		}*/
		if (typeof collch.place == 'string'){
			place = getTargetField(this, collch.place);
			if (!place){
				throw new Error('wrong place declaration: "' + collch.place + '"');
			}
		} else if (typeof collch.place == 'function') {
			place = collch.place;
		}


		return {
			place: place,
			by_model_name: collch.by_model_name,
			space: collch.space,
			strict: collch.strict,
			opts: collch.opts
		};
	},
	appendFVAncorByVN: function(opts) {
		var view = this.getFreeChildView(opts.name, opts.md, opts.space, opts.opts);
		var place = opts.place;
		if ((opts.strict || view) && place){
			var complex_place;
			if (typeof opts.place == 'function'){
				place = opts.place.call(this, opts.md, view);
				if (!place && typeof place != 'boolean'){
					throw new Error('give me place');
				} else {
					place.append(view.getA());
				}
			} else {
				place.append(view.getA());
			}
			
		}
	},
	parts_builder: {
		
	}
});
})();
