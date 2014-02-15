define('provoda', ['spv', 'angbo', 'jquery', 'js/libs/PvTemplate'], function(spv, angbo, $, PvTemplate){
"use strict";
var push = Array.prototype.push;
var DOT = '.';
var provoda;
var big_index = {};
var sync_sender = {
	root_model: null,
	sockets: {},
	streams_list: [],
	sockets_m_index: {},
	setRootModel: function(md) {
		this.root_model = md;
	},
	removeSyncStream: function(stream) {
		if (!this.sockets[stream.id]) {
			return;
		}
		this.sockets_m_index[stream.id] = null;
		this.sockets[stream.id] = null;
		this.streams_list = spv.arrayExclude(this.streams_list, stream);
	},
	addSyncStream: function(start_md, stream) {
		this.sockets_m_index[stream.id] = {};
		this.sockets[stream.id] = stream;
		this.streams_list.push(stream);

		var struc = start_md.toSimpleStructure(this.sockets_m_index[stream.id]);
		stream.buildTree(struc);

	},
	pushNesting: function(md, nesname, value, oldv, remove){
		//var struc;
		var parsed_value;
		for (var i = 0; i < this.streams_list.length; i++) {
			var cur = this.streams_list[i];
			var index = this.sockets_m_index[cur.id];
			if (index[md._provoda_id]){


				if (value && typeof parsed_value == 'undefined') {
					//parsed_value

					if (value._provoda_id){
						parsed_value = value._provoda_id;
					} else if (Array.isArray(value)){

						parsed_value = new Array(value.length);
						for (var jj = 0; jj < value.length; jj++) {
							parsed_value[jj] = value[jj]._provoda_id;
						}
					} else {
						console.warn('unparsed', value);
					}
					if (parsed_value == 'undefined') {
						parsed_value = null;
					}
				}

				var struc = md.toSimpleStructure(index);



				cur.changeCollection(md._provoda_id, struc, nesname, parsed_value);
			}
		}
	},
	pushStates: function(md, states) {
	//	var struc;
		var needs_changes, parsing_done, fixed_values;

		for (var i = 0; i < this.streams_list.length; i++) {
			var cur = this.streams_list[i];
			if (this.sockets_m_index[cur.id][md._provoda_id]) {
				if (!parsing_done) {
					for ( var jj = 1; jj < states.length; jj += 2 ) {
						var cur_value = states[jj];
						if (cur_value && typeof cur_value == 'object' && cur_value._provoda_id) {
							needs_changes = true;

							if (!fixed_values) {
								fixed_values = states.slice();
							}

							fixed_values[jj] = {
								_provoda_id: states[jj]._provoda_id
							};
							//fixme, отправляя _provoda_id мы не отправляем модели
							//которые могли попасть в состояния после отправки ПОДДЕЛКИ текущей модели

						}
						//needs_changes
					}


				}
				
				cur.updateStates(md._provoda_id, needs_changes ? fixed_values : states);
			}
		}
	}
};



var MDProxy = function(_provoda_id, states, children_models, md) {
	this._provoda_id = _provoda_id;
	this.views = [];
	this.views_index = {};
	this.states = states;
	this.vstates = {};
	this.children_models = children_models;
	this.md = md;
	this.nestings = spv.cloneObj({}, children_models);
};

MDProxy.prototype = {
	RPCLegacy: function() {
		this.md.RPCLegacy.apply(this.md, arguments);
		
	},
	setStates: function() {},
	updateStates: function() {},
	updateNesting: function() {},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var name in obj) {
			this.vstates[name] = obj[name];
			changes_list.push(name, obj[name]);
		}
		this.sendStatesToViews(changes_list);
		return this;
	},
	updateState: function(name, value){
		//fixme если вьюха ещё не создана у неё не будет этого состояния
		//эклюзивные состояния для вьюх не хранятся и не передаются при создании
		if (name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop name: ' + name);
		}
		this.vstates[name] = value;
		this.sendStatesToViews([name, value]);
		return this;
	},
	state: function(state_name) {
		return this.vstates[state_name];
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
	sendCollectionChange: function(collection_name, array) {
		var old_value = this.nestings[collection_name];
		this.nestings[collection_name] = array;
		var removed;
		if (Array.isArray(array)){
			removed = spv.arrayExclude(array, old_value);
		} else if (old_value && array != old_value) {
			removed = [old_value];
		}
		
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].collectionChange(collection_name, array, old_value, removed);
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
	removeDeadViews: function(hard_deads_check, complex_id){
		var i = 0;
		if (hard_deads_check){
			var checklist = complex_id ? (this.views_index && this.views_index[complex_id]) : this.views;
			if (checklist){
				for (i = 0; i < checklist.length; i++) {
					if (checklist[i].isAlive){
						checklist[i].isAlive();
					}
				}
			}
			
		}
		var dead = [], alive = [];
		for (i = 0; i < this.views.length; i++) {
			if (this.views[i].dead){
				dead.push(this.views[i]);
			} else {
				alive.push(this.views[i]);
			}
		}

		if (alive.length != this.views.length){
			this.views = alive;
		}
		if (dead.length){
			for (var a in this.views_index){
				this.views_index[a] = spv.arrayExclude(this.views_index[a], dead);
			}
		}

		return this;
	},
	die: function() {
		this.killViews();
	},
	killViews: function() {
		//this.views[i] can be changed in proccess, so cache it!
		var views = this.views;
		for (var i = 0; i < views.length; i++) {
			views[i].die({skip_md_call: true});
		}
		this.removeDeadViews();
		return this;
	},
	collectViewsGarbadge: function() {
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].checkDeadChildren();
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
		this.removeDeadViews(true, complex_id);
		complex_id = complex_id || 'main';
		return this.views_index[complex_id] && this.views_index[complex_id][0];
	},
	addView: function(v, complex_id) {
		this.removeDeadViews(true, complex_id);
		this.views.push( v );
		complex_id = complex_id || 'main';
		(this.views_index[complex_id] = this.views_index[complex_id] || []).push(v);
		return this;
	},
	getRooConPresentation: function(mplev_view, get_ancestor, only_by_ancestor) {
		var views = this.getViews();
		var cur;
		if (!only_by_ancestor){
			for (var i = 0; i < views.length; i++) {
				cur = views[i];
				var target = cur.root_view.getChildView(this, 'main');
				if (target == cur){
					return cur;
				}
			}
		}
		for (var jj = 0; jj < views.length; jj++) {
			cur = views[jj];
			var ancestor = false;
			if (mplev_view){
				ancestor = cur.getAncestorByRooViCon('all-sufficient-details', only_by_ancestor);
			} else {
				ancestor = cur.getAncestorByRooViCon('main', only_by_ancestor);
			}
			if (ancestor){
				if (get_ancestor){
					return ancestor;
				} else {
					return cur;
				}
			}
		}
	}
};



var views_proxies = {
	spaces: {},
	spaces_list: [],
	//инициализация простанства
	//поддержка простанства в актуальном состоянии
	//очистка простанства

	addRootView: function(view, root_md) {
		return this.addSpaceById(view.view_id, root_md);
	},
	removeRootView: function(view) {
		return this.removeSpaceById(view.view_id);
	},
	getMPX: function(space_id, md) {
		if (typeof space_id == 'object') {
			space_id = space_id.view_id;
		}
		var mpx = this.spaces[space_id].mpxes_index[md._provoda_id];

		return mpx;
	},
	addSpaceById: function(id, root_md) {
		if (!this.spaces[id]) {
			this.spaces[id] = {
				mpxes_index: {},
				ids_index: {}
			};
			this.spaces_list.push(this.spaces[id]);

			var array = root_md.getLinedStructure(this.spaces[id].ids_index);
			this.createMPXes(array, this.spaces[id].mpxes_index);
		} else {
			throw new Error();
		}
	},
	removeSpaceById: function(id) {
		var space = this.spaces[id];
		if (!space) {
			throw new Error();
		}
		this.spaces[id] = null;
		this.spaces_list = spv.arrayExclude(this.spaces_list, space);
	},
	createMPXesByRawData: function(raw_array, ids_index, mpxes_index) {
		if (!raw_array.length) {
			return;
		}
		var i, clean_array = [], local_index = {};
		for (i = 0; i < raw_array.length; i++) {
			var cur_id = raw_array[i]._provoda_id;
			if (!ids_index[cur_id] && !local_index[cur_id]) {
				local_index[cur_id] = true;
				clean_array.push(raw_array[i]);
			}
			
		}
		if (clean_array.length) {
			var full_array = [];
			for (i = 0; i < clean_array.length; i++) {
				push.apply(full_array, clean_array[i].getLinedStructure(ids_index));
			
			}
			this.createMPXes(full_array, mpxes_index);
		}
		
	},
	createMPXes: function(array, store) {
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			store[cur._provoda_id] = new MDProxy(cur._provoda_id, cur.states, cur.children_models, cur);
		}
	},
	pushNesting: function(md, nesname, value, oldv, removed) {
		var collected;
		var raw_array = [];
		for (var i = 0; i < this.spaces_list.length; i++) {
			var cur = this.spaces_list[i];
			if (cur.ids_index[md._provoda_id]) {
				if (!collected) {
					collected = true;
					if (value) {
						if (value._provoda_id) {
							raw_array = [value];
						} else if (Array.isArray(value)){
							raw_array = value;
						} else {

							var pos_array = spv.getTargetField(value, 'residents_struc.items');
							if (pos_array) {
								raw_array = pos_array;
							} else {
								throw new Error('you must provide parsable array in "residents_struc.items" prop')
							}

						}
					}
				}
				this.createMPXesByRawData(raw_array, cur.ids_index, cur.mpxes_index);
				cur.mpxes_index[md._provoda_id].sendCollectionChange(nesname, value, oldv, removed);
			}
		}
		


	},
	pushStates: function(md, states_list) {
		for (var i = 0; i < this.spaces_list.length; i++) {
			var cur = this.spaces_list[i];
			if (cur.ids_index[md._provoda_id]) {
				cur.mpxes_index[md._provoda_id].sendStatesToViews(states_list);

			}
		}
	},
	killMD: function(md) {
		for (var i = 0; i < this.spaces_list.length; i++) {
			var cur = this.spaces_list[i];
			if (cur.ids_index[md._provoda_id]) {
				cur.mpxes_index[md._provoda_id].die();

			}
		}
	}
};



var idToModel = function(index, ids) {
	if (typeof ids == 'number'){
		return index[ids];
	} else if (Array.isArray(ids)) {
		var result = new Array(ids.length);
		for (var i = 0; i < ids.length; i++) {
			result[i] = index[ids[i]];
			
		}
		return result;
	} else {
		if (ids){
			debugger;
		}
		
		return ids;
	}
};

var FakeModel = function(model_skeleton, stream) {
	this.stream = stream;
	this._provoda_id = model_skeleton._provoda_id;

	this.children_models = model_skeleton.children_models;
	this.map_level_num = model_skeleton.map_level_num;
	this.map_parent = model_skeleton.map_parent;
	this.model_name = model_skeleton.model_name;
	this.mpx = model_skeleton.mpx;
	this.states = model_skeleton.states;

};

var slice = Array.prototype.slice;
FakeModel.prototype = {
	getParentMapModel: function() {
		return this.map_parent;
	},
	RealRemoteCall: function(arguments_obj) {
		this.stream.RPCLegacy(this._provoda_id, slice.call(arguments_obj));
	},
	RPCLegacy: function() {
		this.RealRemoteCall(arguments);
	}
};

var SyncReciever = function(stream){
	this.stream = stream;
	this.md_proxs_index = {};
	this.models_index = {};

};

SyncReciever.prototype = {
	
	buildTree: function(array) {
		var i, cur, cur_pvid;

		for (i = 0; i < array.length; i++) {
			cur = array[i];
			cur_pvid = cur._provoda_id;
			if (!this.models_index[cur_pvid]){
				this.models_index[cur_pvid] = new FakeModel(cur, this.stream);
			}
			//резервируем объекты для моделей
			//big_index[cur_pvid] = true;
		}

		for (i = 0; i < array.length; i++) {
			//восстанавливаем связи моделей
			cur_pvid = array[i]._provoda_id;
			cur = this.models_index[cur_pvid];
			cur.map_parent = idToModel(this.models_index, cur.map_parent);
			for (var nesting_name in cur.children_models) {
				cur.children_models[nesting_name] = idToModel(this.models_index, cur.children_models[nesting_name]);
		
			}

		}


		for (i = 0; i < array.length; i++) {
			//создаём передатчики обновлений во вьюхи
			cur = array[i];
			cur_pvid = cur._provoda_id;
			if (!this.md_proxs_index[cur_pvid]){
				this.md_proxs_index[cur_pvid] = new provoda.MDProxy(cur._provoda_id, cur.states, cur.children_models, this.models_index[cur_pvid]);
				this.models_index[cur_pvid].mpx = this.md_proxs_index[cur_pvid];
			}
		}
		return array.length && this.models_index[array[0]._provoda_id];
	},
	actions: {
		buildtree: function(message) {
			return this.buildTree(message.value);
		},
		update_states: function(message) {
			var target_model = this.models_index[message._provoda_id];
			var target_md_proxy = this.md_proxs_index[message._provoda_id];

			for (var i = 0; i < message.value.length; i+=2) {
				var state_name = message.value[ i ];
				var state_value = message.value[ i +1 ];
				target_model.states[state_name] = target_md_proxy.states[state_name] = state_value;
			}

			
			this.md_proxs_index[message._provoda_id].sendStatesToViews(message.value);
		},
		update_nesting: function(message) {
			if (message.struc) {
				this.buildTree(message.struc);
			}

			var target_model = this.models_index[message._provoda_id];
			var target_md_proxy = this.md_proxs_index[message._provoda_id];

			var fakes_models = idToModel(this.models_index, message.value);
			

			target_model.children_models[message.name] = target_md_proxy.children_models[message.name] = fakes_models;
			target_md_proxy.sendCollectionChange(message.name, fakes_models);
		}
	}
};


provoda = {
	getModelById: function(id) {
		return big_index[id];
	},
	prototypes: {},
	setTplFilterGetFn: function(fn) {
		angbo.getFilterFn = fn;
	},
	MDProxy: MDProxy,
	sync_s: sync_sender,
	SyncR: SyncReciever,
	Eventor: function(){},
	StatesEmitter: function(){},
	Model: function(){},
	HModel: function() {},
	View: function(){},
	views_proxies: views_proxies,
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
	},
	getOCF: function(propcheck, callback) {
		//init once
		return function(){
			if (this[propcheck]){
				return this;
			} else {
				this[propcheck] = true;
				callback.apply(this, arguments);
				return this;
			}
		};
	}
};
provoda.Controller = provoda.View;

var DeathMarker = function() {
	//helper to find memory leaks; if there is memory leaking DeathMarker will be available in memory heap snapshot;
};

var setEvLiItems = function(items_list, current_motivator) {
	var old_value = this.current_motivator;
	this.current_motivator = this.current_motivator;

	items_list = items_list && spv.toRealArray(items_list);
	this.unsubcribeOld();
	this.items_list = items_list;
	this.controls_list.length = 0;
	this.controls_list.length = items_list.length;
	for (var i = 0; i < items_list.length; i++) {
		var cur = items_list[i];
		var oldv = cur.current_motivator;
		cur.current_motivator = this.current_motivator;
		this.controls_list[i] = cur.on(this.event_name, this.eventCallback, {
			easy_bind_control: true,
			context: this.event_context,
			skip_reg: this.skip_reg
		});
		cur.current_motivator = oldv;
	}
	this.current_motivator = old_value;
};
var ItemsEvents = function(event_name, eventCallback) {
	this.items_list = null;
	this.controls_list = [];
	this.event_name = event_name;
	this.eventCallback = eventCallback;
	this.skip_reg = null;
	this.event_context = this;
	this.current_motivator = null;
};
ItemsEvents.prototype = {
	unsubcribeOld: function() {
		if (this.controls_list.length){
			for (var i = 0; i < this.controls_list.length; i++) {
				this.controls_list[i].unsubcribe();
			}
		}
	},
	setItems: setEvLiItems
};

var hasargfn = function(cur) {return cur;};
var StatesArchiver = function(state_name, opts) {
	this.items_list = null;
	this.controls_list = [];
	this.current_motivator = null;

	var _this = this;
	this.checkFunc = function(e) {
		_this.getItemsValues(e && e.target);
	};
	this.state_name = state_name;
	this.event_name = 'state_change-' + this.state_name;
	this.eventCallback = this.checkFunc;
	this.skip_reg = true;

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


};
StatesArchiver.prototype = {
	every: function(values_array) {
		return !!values_array.every(hasargfn);
	},
	some: function(values_array) {
		return !!values_array.some(hasargfn);
	},
	getItemsValues: function(item) {
		var current_motivator = (item && item.current_motivator) || this.current_motivator;
		var values_list = new Array(this.items_list.length);
		for (var i = 0; i < this.items_list.length; i++) {
			values_list[i] = this.items_list[i].state(this.state_name);
		}
		var old_value = this.current_motivator;
		this.current_motivator = current_motivator;
		this.returnResult.call(this, this.calculateResult.call(this, values_list));
		this.current_motivator = old_value;
		return values_list;
	},
	unsubcribeOld: function() {
		if (this.controls_list.length){
			for (var i = 0; i < this.controls_list.length; i++) {
				this.controls_list[i].unsubcribe();
			}
		}
	},
	setItemsReal: setEvLiItems,
	setItems: function(items_list) {
		items_list = items_list && spv.toRealArray(items_list);
		this.setItemsReal(items_list);
		this.checkFunc();
	}
};

var BindControl = function(evcompanion, opts) {
	this.evcompanion = evcompanion;
	this.opts = opts;

};
BindControl.prototype = {
	subscribe: function() {
		this.unsubcribe();
		this.evcompanion._pushCallbackToStack(this.opts);
	},
	unsubcribe: function() {
		this.evcompanion.off(this.opts.namespace, this.opts.cb, this.opts);
	}
};


var ev_na_cache = {};



var FlowStep = function(num, fn, context, args, arg, cb_wrapper, real_context, parent_motivator) {
	this.num = num;
	this.fn = fn;
	this.context = context;
	this.args = args;
	this.arg = arg || null;
	this.cb_wrapper = cb_wrapper || null;
	this.real_context = real_context;
	this.complex_order = ( parent_motivator && parent_motivator.complex_order.slice() ) || [];
	this.complex_order.push(this.num);
};
FlowStep.prototype.call = function() {
	if (this.cb_wrapper){
		this.cb_wrapper.call(this.real_context, this, this.fn, this.context, this.args, this.arg);
	} else {
		if (this.args){
			this.fn.apply(this.context, this.args);
		} else {
			this.fn.call(this.context, this.arg);
		}
	}
	
};

var sortFlows = function(item_one, item_two) {
	var max_length = Math.max(item_one.complex_order.length, item_two.complex_order.length);
	//
	for (var i = 0; i < max_length; i++) {
		var item_one_step = item_one.complex_order[i];
		var item_two_step = item_two.complex_order[i];
		if (typeof item_one_step == 'undefined' && typeof item_two_step == 'undefined'){
			return;
		}
		if (typeof item_one_step == 'undefined'){
			return -1;
		}
		if (typeof item_two_step == 'undefined'){
			return 1;
		}
		if (item_one_step > item_two_step){
			return 1;
		}
		if (item_one_step < item_two_step){
			return -1;
		}
	}
};


var getBoxedSetImmFunc = function(win) {
	return win.setImmediate || (function() {
		//http://learn.javascript.ru/setimmediate

		var head = {
			func: null,
			next: null
		}, tail = head; // очередь вызовов, 1-связный список

		var ID = Math.random(); // уникальный идентификатор

		var onmessage = function(e) {
			if ( e.data != ID ) {
				return;
			} // не наше сообщение
			head = head.next;
			var func = head.func;
			head.func = null;
			func();
		};

		if ( win.addEventListener ) { // IE9+, другие браузеры
			win.addEventListener('message', onmessage, false);
		} else { // IE8
			win.attachEvent( 'onmessage', onmessage );
		}

		return win.postMessage ? function(func) {
			if (!win || win.closed) {
				return;
			}
			tail = tail.next = { func: func, next: null };
			win.postMessage(ID, "*");
		} :
		function(func) { // IE<8
			setTimeout(func, 0);
		};
	}());
};

var getBoxedRAFFunc = function(win) {
	return false;
	var raf;

	if ( win.requestAnimationFrame ){
		raf = win.requestAnimationFrame;
	} else {
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !raf; ++x) {
			raf = win[vendors[x]+'RequestAnimationFrame'];
		}
	}
	return function(fn) {
		return raf.call(win, fn);
	};
};


	
var CallbacksFlow = function(win, rendering_flow) {
	this.flow = [];
	this.busy = null;
	this.iteration_delayed = null;
	this.flow_steps_counter = 1;
	this.flow_steps_sorted = false;
	var _this = this;
	this.hndIterateCallbacksFlow = function() {
		_this.iterateCallbacksFlow();
	};
	var raf = rendering_flow && getBoxedRAFFunc(win);
	if ( raf ) {
		this.pushIteration = function(fn) {
			return raf(fn);
		};
	} else {
		var setImmediate = getBoxedSetImmFunc(win);
		this.pushIteration = function(fn) {
			return setImmediate(fn);
		};
	}
	
};

CallbacksFlow.prototype = {

	iterateCallbacksFlow: function() {
		var start = Date.now() + 100;
		this.iteration_delayed = false;
		this.callbacks_busy = true;
		while (this.flow.length){
			if (Date.now() > start){
				this.pushIteration(this.hndIterateCallbacksFlow);
				break;
			}
			if (!this.flow_steps_sorted){
				this.flow_steps_sorted = true;
				this.flow.sort(sortFlows);
			}
			var cur = this.flow.shift();
			cur.call();
			
			
		}
		if (!this.flow.length){
			this.callbacks_busy = false;
		}
	},
	checkCallbacksFlow: function() {
		if (!this.iteration_delayed && !this.callbacks_busy){
			this.pushIteration(this.hndIterateCallbacksFlow);
			
			this.iteration_delayed = true;
		}
	},
	pushToFlow: function(fn, context, args, cbf_arg, cb_wrapper, real_context, motivator) {
		this.flow.push(new FlowStep(++this.flow_steps_counter, fn, context, args, cbf_arg, cb_wrapper, real_context, motivator));
		if (motivator){
			this.flow_steps_sorted = false;
		}
		this.checkCallbacksFlow();
	}
};
provoda.CallbacksFlow = CallbacksFlow;

var main_calls_flow = new CallbacksFlow(window);





var cached_parsed_namespace = {};
var parseNamespace = function(namespace) {
	if (!cached_parsed_namespace[namespace]){
		cached_parsed_namespace[namespace] = namespace.split(DOT);
	}
	return cached_parsed_namespace[namespace];
};
var EventSubscribingOpts = function(short_name, namespace, cb, once, context, immediately, wrapper) {
	this.short_name = short_name;
	this.namespace = namespace;
	this.cb = cb;
	this.once = once;
	this.context = context;
	this.immediately = immediately;
	this.wrapper = wrapper || null;
};

var FastEventor = function(context) {
	this.sputnik = context;
	this.subscribes = {};
	this.subscribes_cache = {};
	this.reg_fires = null;
	if (context.reg_fires){
		this.reg_fires = context.reg_fires;
	}
	this.requests = {};
	this.drequests = {};
};
FastEventor.prototype = {
	_pushCallbackToStack: function(opts) {
		if (!this.subscribes[opts.short_name]){
			this.subscribes[opts.short_name] = [];
		}
		this.subscribes[opts.short_name].push(opts);
		this.resetSubscribesCache(opts.short_name);
	},
	getPossibleRegfires: function(namespace) {
		if (!this.reg_fires){
			return;
		}
		if (this.reg_fires.cache && this.reg_fires.cache[namespace]){
			return this.reg_fires.cache[namespace];
		}

		var parts = parseNamespace(namespace);
		var funcs = [];
		var i = 0;
		if (this.reg_fires.by_namespace){
			for (i = parts.length - 1; i > -1; i--) {
				var posb_namespace = parts.slice(0, i + 1).join(DOT);
				if (this.reg_fires.by_namespace[posb_namespace]){
					funcs.push(this.reg_fires.by_namespace[posb_namespace]);
				}
			}
		}
		if (this.reg_fires.by_test){
			for (i = 0; i < this.reg_fires.by_test.length; i++) {
				if (this.reg_fires.by_test[i].test.call(this.sputnik, namespace)){
					funcs.push(this.reg_fires.by_test[i]);
				}
			}
		}
		
		if (!this.reg_fires.cache){
			this.reg_fires.cache = {};
		}
		this.reg_fires.cache[namespace] = funcs;
		return funcs;
	},

	hndUsualEvCallbacksWrapper: function(motivator, fn, context, args, arg) {
		if (args){
			fn.apply(context, args);
		} else {
			fn.call(context, arg);
		}
	},
	_addEventHandler: function(namespace, cb, context, immediately, exlusive, skip_reg, soft_reg, once, easy_bind_control){
		//common opts allowed
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(name);
		}

		var
			fired = false,
			_this = this,
			name_parts = parseNamespace(namespace),
			short_name = name_parts[0];

		if (exlusive){
			this.off(namespace);
		}

		var reg_args = null;

		var callbacks_wrapper = this.hndUsualEvCallbacksWrapper;

		var reg_fires = this.getPossibleRegfires(namespace);
		if (reg_fires && reg_fires.length){
			reg_fires[0].fn.call(this.sputnik, function() {
				reg_args = arguments;
				fired = true;
			}, namespace, {opts: false}, name_parts);
		}
		if (fired){
			if (reg_fires[0].getWrapper){
				callbacks_wrapper = reg_fires[0].getWrapper.call(this);
			}
			if (!skip_reg){
				var mo_context = context || _this.sputnik;
				if (typeof soft_reg != 'undefined' && !soft_reg){
					cb.apply(mo_context, reg_args);
				} else {
					this.sputnik._getCallsFlow().pushToFlow(cb, mo_context, reg_args, false, callbacks_wrapper, this.sputnik, this.current_motivator);
				}
			}
		}


		var subscr_opts = new EventSubscribingOpts(short_name, namespace, cb, once, context, immediately, callbacks_wrapper);

		if (!(once && fired)){
			this._pushCallbackToStack(subscr_opts);
		}
		if (easy_bind_control){
			var bind_control = new BindControl(this, subscr_opts);
			return bind_control;
		} else {
			return this.sputnik;
		}
	},
	once: function(namespace, cb, opts){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			true,
			opts && opts.easy_bind_control);
	},
	on: function(namespace, cb, opts){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			false,
			opts && opts.easy_bind_control);
	},
	off: function(namespace, cb, obj, context){
		if (this.convertEventName){
			namespace = this.convertEventName(name);
		}
		var
			clean = [],
			short_name = parseNamespace(namespace)[0],
			queried = this.getMatchedCallbacks(namespace);

		if (this.subscribes[short_name]){
			if (cb || obj){
				for (var i = 0; i < queried.matched.length; i++) {
					var cur = queried.matched[i];
					if (obj && obj == cur){
						continue;
					}
					if (cb){
						if (cur.cb == cb){
							if (!context || cur.context == context){
								continue;
							}
							
						}
					}
					clean.push(queried.matched[i]);
				}
			}
			clean.push.apply(clean, queried.not_matched);
			if (clean.length != this.subscribes[short_name].length){
				this.subscribes[short_name] = clean;
				this.resetSubscribesCache(short_name);
			}
		}

		return this.sputnik;
	},
	resetSubscribesCache: function(short_name) {

		//fixme - bug for "state_change-window_width.song_file_progress" ( "state_change-window_width" stays valid, but must be invalid)
		for (var cur_namespace in this.subscribes_cache){
			if (!this.subscribes_cache[cur_namespace]){
				continue;
			}
			var last_char = cur_namespace.charAt(short_name.length);
			if ((!last_char || last_char == DOT) && cur_namespace.indexOf(short_name) == 0){
				this.subscribes_cache[cur_namespace] = null;
			}
		}
	},
	_empty_callbacks_package: {
		matched: [],
		not_matched: []
	},
	getMatchedCallbacks: function(namespace){
		if (this.convertEventName){
			namespace = this.convertEventName(namespace);
		}
		var
			r, short_name = parseNamespace(namespace)[0];

		var cb_cs = this.subscribes[short_name];
		if (cb_cs){
			var cached_r = this.subscribes_cache[namespace];
			if (cached_r){
				return cached_r;
			} else {
				var matched = [], not_matched = [];
				var cac_space = ev_na_cache[namespace] = (ev_na_cache[namespace] || {});
				for (var i = 0; i < cb_cs.length; i++) {
					var curn = cb_cs[i].namespace;
					var canbe_matched = cac_space[curn];
					if (typeof canbe_matched =='undefined') {
						var last_char = curn.charAt(namespace.length);
						canbe_matched = (!last_char || last_char == DOT) && curn.indexOf(namespace) == 0;
						cac_space[curn] = canbe_matched;
					}
					if (canbe_matched){
						matched.push(cb_cs[i]);
					} else {
						not_matched.push(cb_cs[i]);
					}
				}
				this.subscribes_cache[namespace] = r = {matched: matched, not_matched: not_matched};
			}

		} else {
			return this._empty_callbacks_package;
		}

		return r;
	},
	callEventCallback: function(cur, args, opts, arg) {
	//	var _this = this;
		if (cur.immediately && (!opts || !opts.force_async)){
			if (args){
				cur.cb.apply(cur.context || this.sputnik, args);
			} else {
				cur.cb.call(cur.context || this.sputnik, arg);
			}
			
		} else {
			var callback_context = cur.context || this.sputnik;
			var wrapper_context = this.sputnik;
			this.sputnik._getCallsFlow().pushToFlow(cur.cb, callback_context, args, arg, cur.wrapper, wrapper_context, this.sputnik.current_motivator);
			/*
			setTimeout(function() {
				cur.cb.apply(_this, args);
			},1);*/
		}
	},
	triggerCallbacks: function(cb_cs, args, opts, name, arg){
		for (var i = 0; i < cb_cs.length; i++) {
			var cur = cb_cs[i];
			this.callEventCallback(cur, args, opts, arg);
			if (cur.once){
				this.off(name, false, cur);
			}
		}
	},
	trigger: function(name){
		var cb_cs = this.getMatchedCallbacks(name).matched;
		if (cb_cs){
			var i = 0;
			var args = new Array(arguments.length - 1);
			for (i = 1; i < arguments.length; i++) {
				args[ i - 1 ]= arguments[i];
			}

			for (i = 0; i < cb_cs.length; i++) {
				var cur = cb_cs[i];
				this.callEventCallback(cur, args, (args && args[ args.length -1 ]));
				if (cur.once){
					this.off(name, false, cur);
				}
			}
		}
		return this;
	},
	default_requests_space: 'nav',
	getRequests: function(space) {
		space = space || this.default_requests_space;
		return this.requests[space] || [];
	},
	getQueued: function(space) {
		//must return new array;
		var requests = this.getRequests(space);
		return spv.filter(requests, 'queued');
	},
	addRequest: function(rq, opts){
		this.addRequests([rq], opts);
		return this.sputnik;
	},
	addRequests: function(array, opts) {
		opts = opts || {};
		//space, depend
		var space = opts.space || this.default_requests_space;
		var i = 0, req = null;

		if (opts.order){
			for (i = 0; i < array.length; i++) {
				req = array[i];
				spv.setTargetField(req, this.sputnik.getReqsOrderField(), opts.order);
				req.order = opts.order;
			}
		}

		if (!this.requests[space]){
			this.requests[space] = [];
		}

		var target_arr = this.requests[space];
		var _this = this;

		
		var bindRemove = function(req) {
			req.always(function() {
				if (_this.requests && _this.requests[space]){
					_this.requests[space] = spv.arrayExclude(_this.requests[space], req);
				}
				
			});
		};
		var added = new Array(array.length);
		for (i = 0; i < array.length; i++) {
			req = array[i];
			/*if (req.queued){
				spv.setTargetField(req.queued, 'mdata.' + this._provoda_id, this);
			}*/
			if (target_arr.indexOf(req) != -1){
				continue;
			}
			if (opts.depend){
				if (req){
					req.addDepend(this);
				}
			}
			target_arr.push(req);
			bindRemove(req);
			added[i] = req;
		}
		if (added.length){
			if (!opts.skip_sort){
				this.sortRequests(space);
			}

			this.trigger('requests', added, space);
		}


	},

	sortRequests: function(space) {
		var requests = this.requests[space || this.default_requests_space];

		var field_name = this.sputnik.getReqsOrderField();

		return requests.sort(function(a,b){
			return spv.sortByRules(a, b, [
				function(el){
					if (typeof spv.getTargetField(el, field_name) == 'number'){
						return false;
					} else {
						return true;
					}
				},
				field_name
			]);
		});
	},
	getAllRequests: function() {
		var all_requests = [];
		for (var space in this.requests){
			if (this.requests[space].length){
				all_requests.push.apply(all_requests, this.requests[space]);
			}
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
		wipeObj(this.requests);
		return this;
	},
	getModelImmediateRequests: function(space) {
		var queued = this.getQueued(space);
		if (queued){
			queued.reverse();
		}
		
		return queued;
	},
	setPrio: function(space) {
		var groups = [];
		var immediate = this.getModelImmediateRequests(space);
		if (immediate){
			groups.push(immediate);
		}
		var relative = this.sputnik.getRelativeRequestsGroups(space);
		if (relative && relative.length){
			groups.push.apply(groups, relative);
		}
		var setPrio = function(el) {
			el.setPrio();
		};
		groups.reverse();
		for (var i = 0; i < groups.length; i++) {
			groups[i].forEach(setPrio);
		}
		return this.sputnik;
	},
	loaDDD: function(name) {
		//завершено?
		//есть ошибки?
		//в процессе?

		var _this = this;
		var rqd = this.sputnik.requests_desc[name];
		if (!this.drequests[name]){
			this.drequests[name] = {
				done: false,
				error: false,
				process: false
			};
		}
		var store = this.drequests[name];
		if (!store.process && (!store.done || store.error)){
			store.process = true;
			if (rqd.before){
				rqd.before.call(this.sputnik);
			}
			var request = rqd.send.call(this.sputnik, {has_error: store.error});
			request
				.always(function() {
					store.process = false;
					if (rqd.after){
						rqd.after.call(_this.sputnik);
					}
				})
				.done(function(r) {
					var has_error;
					for (var i = 0; i < rqd.errors.length; i++) {
						var cur = rqd.errors[i];
						has_error = spv.getTargetField(r, cur);
						if (has_error){
							break;
						}
					}
					if (has_error){
						store.error = true;
					} else {
						store.error = null;
						store.done = true;
					}

				});
			this.addRequest(request, rqd.rq_opts);
			return request;
		}
	}

};
var hndMotivationWrappper = function(motivator, fn, context, args, arg) {
	if (this.isAliveFast && !this.isAliveFast() && fn !== this.remove) {
		return;
	}

	var old_value = this.current_motivator;
	this.current_motivator = motivator;
	if (args){
		fn.apply(context, args);
	} else {
		fn.call(context, arg);
	}
	if (this.current_motivator != motivator){
		throw new Error('wrong motivator'); //fixme
	}
	this.current_motivator = old_value;
};
spv.Class.extendTo(provoda.Eventor, {
	init: function(){
		this.evcompanion = new FastEventor(this);
		return this;
	},
	_getCallsFlow: function() {
		return main_calls_flow;
	},
	useMotivator: function(item, fn, motivator) {
		var old_value = item.current_motivator;
		motivator = motivator || this.current_motivator;
		item.current_motivator = motivator;
		fn.call(this, item);
		item.current_motivator = old_value;
	},
	hndMotivationWrappper: hndMotivationWrappper,
	nextTick: function(fn, args, use_current_motivator) {
		this._getCallsFlow().pushToFlow(fn, this, args, false, this.hndMotivationWrappper, this, use_current_motivator && this.current_motivator);
	},
	once: function(namespace, cb, opts) {
		return this.evcompanion.once(namespace, cb, opts);
	},
	on: function(namespace, cb, opts) {
		return this.evcompanion.on(namespace, cb, opts);
	},
	off: function(namespace, cb, obj, context) {
		return this.evcompanion.off(namespace, cb, obj, context);
	},
	trigger: function() {
		this.evcompanion.trigger.apply(this.evcompanion, arguments);
	},
	
	addRequest: function() {
		return this.evcompanion.addRequest.apply(this.evcompanion, arguments);
	},
	addRequests: function() {
		return this.evcompanion.addRequests.apply(this.evcompanion, arguments);
	},
	stopRequests: function() {
		return this.evcompanion.stopRequests.apply(this.evcompanion, arguments);
	},
	getRelativeRequestsGroups: function() {

	},
	getModelImmediateRequests: function() {
		return this.evcompanion.getModelImmediateRequests.apply(this.evcompanion, arguments);
	},
	setPrio: function() {
		return this.evcompanion.setPrio.apply(this.evcompanion, arguments);
	},
	loaDDD: function() {
		return this.evcompanion.loaDDD.apply(this.evcompanion, arguments);
	}
});

var compx_names_cache = {};
var wipeObj = function (obj){
	for (var p in obj){
		if (obj.hasOwnProperty(p)){
			delete obj[p];
		}
	}
};
var iterateChList = function(changes_list, context, cb) {
	for (var i = 0; i < changes_list.length; i+=2) {
		cb.call(context, i, changes_list[i], changes_list[i+1]);
	}
};
var reversedIterateChList = function(changes_list, context, cb) {
	for (var i = changes_list.length - 1; i >= 0; i-=2) {
		cb.call(context, i, changes_list[i-1], changes_list[i]);
	}
};



var std_event_opt = {force_async: true};

var connects_store = {};
var getConnector = function(state_name) {
	if (!connects_store[state_name]){
		connects_store[state_name] = function(e) {
			this.updateState(state_name, e.value);
		};
	}
	return connects_store[state_name];
};
var PVStateChangeEvent = function(type, value, old_value, target) {
	this.type = type;
	this.value = value;
	this.old_value = old_value;
	this.target = target;
};

provoda.Eventor.extendTo(provoda.StatesEmitter, {
	init: function(){
		this._super();
		this.conx_optsi = null;
		this.conx_opts = null;
		this.collecting_states_changing = null;
		this.zdsv = null;
		this.current_motivator = this.current_motivator || null;


		this.states = {};
		this.states_changing_stack = [];

		//this.collectCompxs();

		return this;
	},
	'regfr-vipstev': {
		test: function(namespace) {
			return namespace.indexOf('vip_state_change-') === 0;
		},
		fn: function(cb, namespace) {
			var state_name = namespace.replace('vip_state_change-', '');
			cb({
				value: this.state(state_name),
				target: this
			});
		},
		getWrapper: function() {
			return this.hndMotivationWrappper;
		}
	},
	'regfr-stev': {
		test: function(namespace) {
			return namespace.indexOf('state_change-') === 0;
		},
		fn: function(cb, namespace) {
			var state_name = namespace.replace('state_change-', '');
			cb({
				value: this.state(state_name),
				target: this
			});
		},
		getWrapper: function() {
			return this.hndMotivationWrappper;
		}
	},

	getContextOptsI: function() {
		if (!this.conx_optsi){
			this.conx_optsi = {context: this, immediately: true};
		}
		return this.conx_optsi;
	},
	getContextOpts: function() {
		if (!this.conx_opts){
			this.conx_opts = {context: this};
		}
		return this.conx_opts;
	},
	wch: function(donor, donor_state, acceptor_state, immediately) {
	
		var cb;
		var event_name = (immediately ? 'vip_state_change-' : 'state_change-') + donor_state;
		if (typeof acceptor_state == 'function'){
			cb = acceptor_state;
		} else {
			acceptor_state = acceptor_state || donor_state;
			cb = getConnector(acceptor_state);
			
		}
		donor.evcompanion._addEventHandler(event_name, cb, this, immediately);

		if (this != donor && this instanceof provoda.View){
			this.onDie(function() {
				donor.off(event_name, cb, false, this);
			});
		}

		return this;

	},
	onExtend: function(props) {
		if (this.collectStateChangeHandlers){
			this.collectStateChangeHandlers(props);
		}
		var collches_modified;
		if (this.collectCollectionChangeDeclarations){
			collches_modified = this.collectCollectionChangeDeclarations(props);
		}
		this.collectCompxs(props);
		this.collectRegFires(props);

		var base_tree_mofified;
		if (props.hasOwnProperty('base_tree')) {
			base_tree_mofified = true;
			this.base_tree_list = getBaseTreeCheckList(props.base_tree);
		}
		if (collches_modified || base_tree_mofified) {
			this.collectBaseExtendStates();
		}
	},
	hndExpandViewTree: function(e) {
		if (!e.value) {
			return;
		}
		this.checkExpandableTree(e.type);

	},
	checkExpandableTree: function(state_name) {
		var i, cur, cur_config, has_changes = true, append_list = [];
		while (this.base_skeleton && has_changes) {
			has_changes = false;
			for (i = 0; i < this.base_skeleton.length; i++) {
				cur = this.base_skeleton[i];
				cur_config = this.base_tree_list[ cur.chunk_num ];
				if (cur.handled) {
					continue;
				}
				if (!cur.parent || cur.parent.handled) {
					if (!cur_config.needs_expand_state || cur_config.needs_expand_state == state_name){
						cur.handled = true;
						if (cur_config.sample_name) {
							cur.node = this.root_view.getSample( cur_config.sample_name );
						} else if (cur_config.part_name) {
							cur.node = this.requirePart( cur_config.part_name );
						} else {
							throw new Error('how to get node for this?!');
						}
						has_changes = true;
						append_list.push(cur);

						//sample_name
						//part_name
					}
				}
				
				//chunk_num
			}
			while (append_list.length) {
				cur = append_list.pop();
				if (cur.parent && cur.parent.node) {
					cur_config = this.base_tree_list[ cur.chunk_num ];
					if (cur_config.selector) {
						$(cur.parent.node).find(cur_config.selector).append(cur.node);
					} else {
						$(cur.parent.node).append(cur.node);
					}
					if (cur_config.parse_as_tplpart) {
						this.parseAppendedTPLPart(cur.node);
					}
				} else if (cur.parent){
					console.log('cant append');
				} else {
					this.c = cur.node;
				}
			}

		}
		if (!this.c && this.base_skeleton[0].node) {
			this.c = this.base_skeleton[0].node;
		}

		if (state_name && this.dclrs_expandable) {
			if (this.dclrs_expandable[state_name] && !this.handled_expandable_dclrs[state_name]) {
				this.handled_expandable_dclrs[state_name] = true;
				for (i = 0; i < this.dclrs_expandable[state_name].length; i++) {
					this.checkCollectionChange(this.dclrs_expandable[state_name][i]);
				}

				this.checkChildrenModelsRendering();
				this.requestAll();
			}
		}
		

		//если есть прикреплённый родитель и пришло время прикреплять (если оно должно было прийти)
		//

		/*
		прикрепление родителя
		парсинг детей
		прикрепление детей

		прикрепление детей привязаных к якорю



		*/

	},
	collectBaseExtendStates: function() {
		var states_list = [], i, states_index = {};
		var dclrs_expandable = {};

		for ( var nesting_name in this.dclrs_fpckgs ) {
			if ( nesting_name.indexOf('$ondemand-') === 0 ) {
				var cur = this.dclrs_fpckgs[ nesting_name ];
				var added = false;
				for ( i = 0; i < cur.declarations.length; i++ ) {
					if (cur.declarations[i].needs_expand_state) {
						var state_name = cur.declarations[i].needs_expand_state;
						if (!states_index[state_name]) {
							states_index[state_name] = true;
							states_list.push( state_name );
						}

						if (!added) {
							if ( !dclrs_expandable[state_name] ) {
								dclrs_expandable[state_name] = [];
							}
							dclrs_expandable[state_name].push(nesting_name.replace('$ondemand-', ''));
						}
						 
					}
				}
			}
		}

		if (states_list.length) {
			this.base_tree_expand_states = states_list;
			this.dclrs_expandable = dclrs_expandable;
		}


		//debugger;
	},
	prsStCon: {
		cache: {},
		parent_count_regexp: /^\^+/gi,
		parent: function(string) {
			if (this.cache[string]){
				return this.cache[string];
			}
			var state_name = string.replace(this.parent_count_regexp, '');
			var count = string.length - state_name.length;
			this.cache[string] = {
				full_name: string,
				ancestors: count,
				state_name: state_name
			};
			return this.cache[string];
		},
		nesting: function(string) {
			if (this.cache[string]){
				return this.cache[string];
			}
			var nesting_and_state_name = string.replace('@', '');
			var parts = nesting_and_state_name.split(':');

			this.cache[string] = {
				full_name: string,
				nesting_name: parts[0],
				state_name: parts[1]
			};

			return this.cache[string];
		},
		root: function(string) {
			if (this.cache[string]){
				return this.cache[string];
			}

			this.cache[string] = {
				full_name: string,
				state_name: string.replace('#', '')
			};

			return this.cache[string];
		},
		toList: function(obj) {
			var result = [];
			for (var p in obj){
				if (obj.hasOwnProperty(p)){
					result.push(obj[p]);
				}
			}
			return result;
		},
		connect: {
			parent: function(md) {
				var list = md.conndst_parent;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var count = cur.ancestors;
					var target = md;
					while (count){
						count--;
						target = target.getStrucParent();
					}
					if (!target){
						throw new Error();
					}
					md.wch(target, cur.state_name, cur.full_name);
				}

			},
			nesting: function(md) {

			},
			root: function(md) {
				var list = md.conndst_root;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var target = md.getStrucRoot();
					if (!target){
						throw new Error();
					}
					md.wch(target, cur.state_name, cur.full_name);
				}
				
			}
		}
	},
	collectStatesConnectionsProps: function() {
		/*
		'compx-some_state': [['^visible', '@list:complete', '#vk_id'], function(visible, complete){
	
		}]
		*/
		var states_of_parent = {};
		var states_of_nesting = {};
		var states_of_root = {};


		for (var i = 0; i < this.full_comlxs_list.length; i++) {
			var cur = this.full_comlxs_list[i];

			for (var jj = 0; jj < cur.depends_on.length; jj++) {
				var state_name = cur.depends_on[jj];
				if (state_name.indexOf('^') === 0 && !states_of_parent[state_name]){
					states_of_parent[state_name] = this.prsStCon.parent(state_name);
				} else if (state_name.indexOf('@') === 0 && !states_of_nesting[state_name]) {
					states_of_nesting[state_name] = this.prsStCon.nesting(state_name);
				} else if (state_name.indexOf('#') === 0 && !states_of_root[state_name]) {
					states_of_root[state_name] = this.prsStCon.root(state_name);
				}
			}
		}


		this.conndst_parent = this.prsStCon.toList(states_of_parent);
		this.conndst_nesting = this.prsStCon.toList(states_of_nesting);
		this.conndst_root = this.prsStCon.toList(states_of_root);

	},
	getCompxName: function(original_name) {
		if (compx_names_cache.hasOwnProperty(original_name)){
			return compx_names_cache[original_name];
		}
		var name = original_name.replace(this.compx_name_test, '');
		if (original_name != name){
			compx_names_cache[original_name] = name;
			return name;
		} else {
			compx_names_cache[original_name] = null;
		}
	},
	compx_name_test: /^compx\-/,
	collectCompxs1part: function(compx_check) {
		for (var comlx_name in this){
			var name = this.getCompxName(comlx_name);
			if (name){
				compx_check[name] = true;
				var cur = this[comlx_name];
				if (cur instanceof Array){
					cur = {
						depends_on: cur[0],
						fn: cur[1],
						name: name
					};
				} else {
					this[comlx_name].name = name;
				}
				
				this.full_comlxs_list.push(cur);
			}
		}
	},
	collectCompxs2part: function(compx_check) {
		for (var comlx_name in this.complex_states){
			if (!compx_check[comlx_name]){
				compx_check[comlx_name] = true;
				var cur = this.complex_states[comlx_name];

				if (cur instanceof Array){
					cur = {
						depends_on: cur[0],
						fn: cur[1],
						name: comlx_name
					};
				} else {
					this.complex_states[comlx_name].name = comlx_name;
				}
				
				this.full_comlxs_list.push(cur);
			}
		}
	},
	full_comlxs_list: [],
	compx_check: {},
	full_comlxs_index: {},
	collectCompxs:function(props) {
		var need_recalc = false;
		if (this.hasOwnProperty('complex_states')){
			need_recalc = true;
		} else {
			for (var prop in props){
				if (props.hasOwnProperty(prop) && prop.indexOf('compx-') === 0){
					need_recalc = true;
					break;
				}
			}
		}
		if (!need_recalc){
			return;
		}



		var compx_check = {};
		this.full_comlxs_list = [];
		this.full_comlxs_index = {};
	//	var comlx_name;
		this.collectCompxs1part(compx_check);
		this.collectCompxs2part(compx_check);
		this.compx_check = compx_check;
		var i, jj, cur, state_name;
		for (i = 0; i < this.full_comlxs_list.length; i++) {
			cur = this.full_comlxs_list[i];
			for (jj = 0; jj < cur.depends_on.length; jj++) {
				state_name = cur.depends_on[jj];
				if (!this.full_comlxs_index[state_name]) {
					this.full_comlxs_index[state_name] = [];
				}
				this.full_comlxs_index[state_name].push(cur);
			}
		}
		this.collectStatesConnectionsProps();
	},
	collectRegFires: function(props) {
		var need_recalc = false, prop;
	
		for (prop in props){
			if (props.hasOwnProperty(prop) && prop.indexOf('regfr-') === 0){
				need_recalc = true;
				break;
			}
		}
		
		if (!need_recalc){
			return;
		}

		this.reg_fires = {
			by_namespace: null,
			by_test: null,
			cache: null
		};
		for (prop in this){
			if (prop.indexOf('regfr-') === 0){
				var cur = this[prop];
				if (cur.event_name){
					if (!this.reg_fires.by_namespace){
						this.reg_fires.by_namespace = {};
					}
					this.reg_fires.by_namespace[cur.event_name] = cur;
				} else if (cur.test){
					if (!this.reg_fires.by_test){
						this.reg_fires.by_test = [];
					}
					this.reg_fires.by_test.push(cur);
				}
			}
		}
	},
	state: function(name){
		return this.states[name];
	},
	compressStatesChanges: function(changes_list) {
		var result_changes = {};
		var counter = 0;

		//reversedIterateChList()

		/*iterateChList(changes_list, result_changes, function(i, name, value) {
			delete this[name]; //reorder fields! hack!?
			this[name] = value;
		});*/
		reversedIterateChList(changes_list, result_changes, function(i, name, value) {
			if (!this.hasOwnProperty(name)){
				

				var num = (changes_list.length - 1) - counter * 2;
				changes_list[ num - 1 ] = name;
				changes_list[ num ] = value;

				counter++;
				this[name] = true;
			}
			//delete this[name]; //reorder fields! hack!?
			//this[name] = value;
		});
		//changes_list.length = 0;
		counter = counter * 2;
		while (changes_list.length != counter){
			changes_list.shift();
		}

		/*for ( var name in result_changes ){
			changes_list.push( name, result_changes[name] );
		}*/

		return changes_list;
	},
	state_ch_h_prefix: 'stch-',
	_replaceState: function(name, value, skip_handler, stack) {
		if (name){
			var obj_to_change	= this.states,
				old_value		= obj_to_change[name],
				method;
			if (old_value != value){

				var stateChanger = !skip_handler && (this[ this.state_ch_h_prefix + name] || (this.state_change && this.state_change[name]));
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
				//value = value || false;
				//less calculations? (since false and "" and null and undefined now os equeal and do not triggering changes)
				//

				

				obj_to_change[name] = value;

				if (method){
					this.nextTick(method, [value, old_value], true);
					//method.call(this, value, old_value);
				}
				stack.push(name, value);
				//return [old_value];
			}
		}
	},
	st_event_name_default: 'state_change-',
	st_event_name_vip: 'vip_state_change-',
	_triggerStChanges: function(i, name, value) {

		var vip_name = this.st_event_name_vip + name;
		var default_name = this.st_event_name_default + name;

		var vip_cb_cs = this.evcompanion.getMatchedCallbacks(vip_name).matched;
		var default_cb_cs = this.evcompanion.getMatchedCallbacks(default_name).matched;



		if (vip_cb_cs.length || default_cb_cs.length){
			var event_arg = new PVStateChangeEvent(name, value, this.zdsv.original_states[name], this);

			if (vip_cb_cs.length){
				//вызов внутреннего для самого объекта события
				this.evcompanion.triggerCallbacks(vip_cb_cs, false, false, vip_name, event_arg);
			}
			if (default_cb_cs.length){
				//вызов стандартного события
				this.evcompanion.triggerCallbacks(default_cb_cs, false, std_event_opt, default_name, event_arg);
			}
		}

	},
	_setUndetailedState: function(i, name, value) {
		this.undetailed_states[name] = value;
	},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var name in obj) {
			if (obj.hasOwnProperty(name)){
				changes_list.push(name, obj[name]);
			}
		}
		this._updateProxy(changes_list);
	},
	updateState: function(name, value){
		if (name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop name: ' + name);
		}
		if (this.hasComplexStateFn(name)){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy([name, value]);
	},
	hasComplexStateFn: function(state_name) {
		return this.compx_check[state_name];
	},

	_updateProxy: function(changes_list, opts) {
		if (this.undetailed_states){
			iterateChList(changes_list, this, this._setUndetailedState);
			return this;
		}
		this.states_changing_stack.push(changes_list, opts);

		if (this.collecting_states_changing){
			return this;
		}
		this.collecting_states_changing = true;

		//порождать события изменившихся состояний (в передлах одного стэка/вызова)
		//для пользователя пока пользователь не перестанет изменять новые состояния
		if (!this.zdsv){
			this.zdsv = {
				original_states: {},
				all_i_cg: [],
				all_ch_compxs: [],
				changed_states: [],
				total_ch: []
			};
		}
		var total_ch = this.zdsv.total_ch;
		var original_states = this.zdsv.original_states;
		var all_i_cg = this.zdsv.all_i_cg;
		var all_ch_compxs = this.zdsv.all_ch_compxs;
		var changed_states = this.zdsv.changed_states;
		
		while (this.states_changing_stack.length){

			wipeObj(original_states);
			all_i_cg.length = all_ch_compxs.length = changed_states.length = 0;
			//объекты используются повторно, ради выиграша в производительности
			//которые заключается в исчезновении пауз на сборку мусора 

			spv.cloneObj(original_states, this.states);

			var cur_changes_list = this.states_changing_stack.shift();
			var cur_changes_opts = this.states_changing_stack.shift();

			//получить изменения для состояний, которые изменил пользователь через публичный метод
			this.getChanges(cur_changes_list, cur_changes_opts, changed_states);
			//var changed_states = ... ↑

			cur_changes_list = cur_changes_opts = null;

			//проверить комплексные состояния
			var first_compxs_chs = this.getComplexChanges(changed_states);
			if (first_compxs_chs.length){
				push.apply(all_ch_compxs, first_compxs_chs);
			}

			var current_compx_chs = first_compxs_chs;
			//довести изменения комплексных состояний до самого конца
			while (current_compx_chs.length){
				var cascade_part = this.getComplexChanges(current_compx_chs);
				current_compx_chs = cascade_part;
				if (cascade_part.length){
					push.apply(all_ch_compxs, cascade_part);
				}

			}
			current_compx_chs = null;

			//собираем все группы изменений
			if (changed_states.length){
				push.apply(all_i_cg, changed_states);
			}
			if (all_ch_compxs.length){
				push.apply(all_i_cg, all_ch_compxs);
			}
			//устраняем измененное дважды и более
			this.compressStatesChanges(all_i_cg);


			iterateChList(all_i_cg, this, this._triggerStChanges);

			if (all_i_cg.length){
				push.apply(total_ch, all_i_cg);
			}
		}

		//устраняем измененное дважды и более
		this.compressStatesChanges(total_ch);


		wipeObj(original_states);
		all_i_cg.length = all_ch_compxs.length = changed_states.length = 0;

		if (this.sendStatesToViews && total_ch.length){
			this.nextTick(this.sendChangesAfterDelay);
		} else {
			total_ch.length = 0;
		}


		this.collecting_states_changing = false;
		return this;
	},
	sendChangesAfterDelay: function() {
		if (this.zdsv.total_ch.length){
			this.sendStatesToViews(this.zdsv.total_ch);
			this.zdsv.total_ch.length = 0;
		}
	},
	getComplexChanges: function(changes_list) {
		return this.getChanges(this.checkComplexStates(changes_list));
	},
	getChanges: function(changes_list, opts, result_arr) {
		var changed_states = result_arr || [];
		for (var i = 0; i < changes_list.length; i+=2) {
			this._replaceState(changes_list[i], changes_list[i+1], opts && opts.skip_handler, changed_states);
		}
		if (this.updateTemplatesStates){
			this.updateTemplatesStates(changes_list);
		}
		return changed_states;
	},
	checkComplexStates: function(changes_list) {

		return this.getTargetComplexStates(changes_list);
	},
	getTargetComplexStates: function(changes_list) {
		var matched_compxs = [];
		var result_array = [];

		var i, cur;

		for ( i = 0; i < changes_list.length; i+=2) {
			cur = this.full_comlxs_index[changes_list[i]];
			if (!cur){
				continue;
			}
			for (var jj = 0; jj < cur.length; jj++) {
				if (matched_compxs.indexOf(cur[jj]) == -1){
					matched_compxs.push(cur[jj]);
				}
			}
		}

		for ( i = 0; i < matched_compxs.length; i++) {
			cur = matched_compxs[i];
			result_array.push(cur.name, this.compoundComplexState(cur));
		}

		return result_array;
	},
	compoundComplexState: function(temp_comx) {
		var values = new Array(temp_comx.depends_on.length);
		for (var i = 0; i < temp_comx.depends_on.length; i++) {
			values[i] = this.state(temp_comx.depends_on[i]);
		}
		return temp_comx.fn.apply(this, values);
	}
});

var getMDOfReplace = function(){
	return this.md;
};

var models_counters = 1;
provoda.StatesEmitter.extendTo(provoda.Model, {
	'regfr-childchev': {
		test: function(namespace) {
			return namespace.indexOf('child_change-') === 0;
		},
		fn: function(cb, namespace) {
			var nesting_name = namespace.replace('child_change-', '');
			var child = this.getNesting(nesting_name);
			if (child){
				cb({
					value: child,
					target: this
				});
			}
		},
		getWrapper: function() {
			return this.hndMotivationWrappper;
		}
	},
	getStrucRoot: function() {
		return this.app;
	},
	getStrucParent: function() {
		return this.map_parent;
	},

	init: function(opts){
		if (opts && opts.app){
			this.app = opts.app;
		}
		if (opts && opts.map_parent){
			this.map_parent = opts.map_parent;
		}

		this._super();

		this.req_order_field = null;

		this._provoda_id = models_counters++;
		big_index[this._provoda_id] = this;

		this.states = {};
		
		this.children_models = {};


		this.md_replacer = null;
		

		//this.mpx = new MDProxy(this._provoda_id, this.states, this.children_models, this);

		this.prsStCon.connect.parent(this);
		this.prsStCon.connect.root(this);

		return this;
	},

	getReqsOrderField: function() {
		if (this.req_order_field){
			return this.req_order_field;
		} else {
			return (this.req_order_field = ['mdata', 'm', this._provoda_id, 'order']);
		}
	},
	getMDReplacer: function() {
		if (!this.md_replacer) {
			var MDReplace = function(){};
			MDReplace.prototype.md = this;
			MDReplace.prototype.getMD = getMDOfReplace;

			this.md_replacer = new MDReplace();
			this.md_replacer._provoda_id = this._provoda_id;
		}
		return this.md_replacer;
	},
	RPCLegacy: function() {
		var args = Array.prototype.slice.call(arguments);
		var method_name = args.shift();
		if (this.rpc_legacy && this.rpc_legacy[method_name]){
			this.rpc_legacy[method_name].apply(this, args);
		} else {
			this[method_name].apply(this, args);

		}
	},
	die: function(){
		this.stopRequests();
		//this.mpx.die();
		views_proxies.killMD(this);
		this.trigger('die');
		big_index[this._provoda_id] = null;
		return this;
	},
	watchChildrenStates: function(collection_name, state_name, callback) {
		//
		var _this = this;
		var items_events = new ItemsEvents('state_change-' + state_name, function(e) {
			var old_value = _this.current_motivator;
			_this.current_motivator = e.target.current_motivator;
			callback.call(_this, {
				item: e.target,
				value: arguments && arguments[0] && arguments[0].value,
				args: arguments,
				items: this.items_list
			});
			_this.current_motivator = old_value;
		});
		this.on('child_change-' + collection_name, function(e) {
			items_events.setItems(e.value, this.current_motivator);
		});
	},
	archivateChildrenStates: function(collection_name, collection_state, statesCalcFunc, result_state_name) {
		var _this = this;
		var archiver = new StatesArchiver(collection_state, {
			returnResult: function(value) {
				var old_value = _this.current_motivator;
				_this.current_motivator = this.current_motivator;
				_this.updateState(result_state_name || collection_state, value);
				_this.current_motivator = old_value;
			},
			calculateResult: statesCalcFunc
		});
		this.on('child_change-' + collection_name, function(e) {
			archiver.setItems(e.value, this.current_motivator);
		});
	},
	getRelativeRequestsGroups: function(space, only_models) {
		var all_models = [];
		var groups = [];

		var i = 0, cur = null;
		for (var collection_name in this.children_models){
			cur = this.children_models[collection_name];
			if (!cur) {
				continue;
			}
			if (Array.isArray(cur)){
				all_models.push.apply(all_models, cur);
				//all_models = all_models.concat(cur);
			} else {
				all_models.push(cur);
			}
		}
		var clean_models = spv.getArrayNoDubs(all_models);

		if (only_models){
			return clean_models;
		} else {
			for (i = 0; i < clean_models.length; i++) {
				var reqs = clean_models[i].getModelImmediateRequests(space);
				if (reqs && reqs.length){
					groups.push(reqs);
				}
			}
			return groups;
		}
	},
	getNesting: function(collection_name) {
		return this.children_models[collection_name];
	},
	updateNesting: function(collection_name, array, opts, spec_data) {
		if (collection_name.indexOf(DOT) != -1){
			throw new Error('remove "." (dot) from name');
		}
		if (Array.isArray(array)){
			array = array.slice(0);
		}
		var old_value = this.children_models[collection_name];
		this.children_models[collection_name] = array;
		// !?
		var removed;
		if (Array.isArray(old_value)){
			if (!array){
				removed = old_value.slice(0);
			} else {
				removed = [];
				for (var i = 0; i < old_value.length; i++) {
					var cur = old_value[i];
					if (array.indexOf(cur) == -1){
						removed.push(cur);
					}
				}
			}
			//console.log(removed);
		}

		var event_obj = {
			value: null,
			old_value: null,
			target: null,
			nesting_name: collection_name
		};
		if (typeof opts == 'object'){
			spv.cloneObj(event_obj, opts);
		}
		//opts = opts || {};
		event_obj.value = array;
		event_obj.old_value = old_value;
		event_obj.target = this;
		this.trigger('child_change-' + collection_name, event_obj);

		if (!opts || !opts.skip_report){
			this.sendCollectionChange(collection_name, array, old_value, removed);
		}

		return this;
	},
	sendCollectionChange: function(collection_name, array, old_value, removed) {
		//this.removeDeadViews();
		sync_sender.pushNesting(this, collection_name, array, old_value, removed);
		views_proxies.pushNesting(this, collection_name, array, old_value, removed);
		//this.mpx.sendCollectionChange(collection_name, array, old_value, removed);
	},
	complex_st_prefix: 'compx-',

	sendStatesToViews: function(states_list) {
		//this.removeDeadViews();
		sync_sender.pushStates(this, states_list);
		views_proxies.pushStates(this, states_list);

		//this.mpx.sendStatesToViews(states_list);
	},
	getLinedStructure: function(models_index, local_index) {
		//используется для получения массива всех РЕАЛЬНЫХ моделей, связанных с текущей
		local_index = local_index || {};
		models_index = models_index || {};
		var big_result_array = [];
		var all_for_parse = [this];


		var checkModel = function(md) {
			if (!md) {
				return;
			}
			var cur_id = md._provoda_id;
			if (typeof cur_id == 'undefined') {
				return;
			}
			if (!models_index[cur_id] && !local_index[cur_id]){
				local_index[cur_id] = true;
				all_for_parse.push(md);
			}
			return cur_id;
		};


		while (all_for_parse.length) {
			var cur_md = all_for_parse.shift();
			var can_push = !models_index[cur_md._provoda_id];
			if (can_push) {
				models_index[cur_md._provoda_id] = true;
			}
			checkModel(cur_md.map_parent);


			for (var state_name in cur_md.states){
				checkModel(cur_md.states[state_name]);
				
			}

			for (var nesting_name in cur_md.children_models){
				var cur = cur_md.children_models[nesting_name];
				if (cur){
					if (cur._provoda_id){
						checkModel(cur);
					} else {
						for (var i = 0; i < cur.length; i++) {
							checkModel(cur[i]);
						}
					}
				}
			}


			if (can_push) {
				big_result_array.push(cur_md);
			}
		}

		return big_result_array;

	},
	toSimpleStructure: function(models_index, big_result) {
		//используется для получения массива всех ПОДДЕЛЬНЫХ, пригоднях для отправки через postMessage моделей, связанных с текущей
		models_index = models_index || {};
		var local_index = {};
		var all_for_parse = [this];
		big_result = big_result || [];

		var checkModel = function(md) {
			var cur_id = md._provoda_id;
			if (!models_index[cur_id] && !local_index[cur_id]){
				local_index[cur_id] = true;
				all_for_parse.push(md);
			}
			return cur_id;
		};

		while (all_for_parse.length) {
			var cur_md = all_for_parse.shift();
			var can_push = !models_index[cur_md._provoda_id];
			if (can_push) {
				models_index[cur_md._provoda_id] = true;
			}
			
			var result = {
				_provoda_id: cur_md._provoda_id,
				model_name: cur_md.model_name,
				states: spv.cloneObj({}, cur_md.states),
				map_parent: cur_md.map_parent && checkModel(cur_md.map_parent),
				children_models: {},
				map_level_num: cur_md.map_level_num,
				mpx: null
			};
			for (var state_name in result.states){
				var state = result.states[state_name];
				if (state && state._provoda_id){
					result.states[state_name] = {
						_provoda_id: checkModel(state)
					};
				}
			}

			for (var nesting_name in cur_md.children_models){
				var cur = cur_md.children_models[nesting_name];
				if (cur){
					if (cur._provoda_id){
						result.children_models[nesting_name] = checkModel(cur);
					} else {
						
						var array = new Array(cur.length);
						for (var i = 0; i < cur.length; i++) {
							array[i] = checkModel(cur[i]);
						}
						result.children_models[nesting_name] = array;
					}
				}
			}
			if (can_push) {
				big_result.push(result);
			}
			
		}


		return big_result;
	}
});
provoda.Model.extendTo(provoda.HModel, {
	init: function(opts) {
		
		//opts = opts || {};
		if (!this.app){
			this.app = null;
		}
		

		this.sub_pages = null;
		this.init_states = null;
		if (!this.map_parent){
			this.map_parent = null;
		}
		
		//this.init_opts = null;
		this.pmd_switch = null;
		

		if (!this.skip_map_init){
			if (this.sub_pa || this.subPager){
				this.sub_pages = {};
			}

			if (!this.init_states){
				this.init_states = {};
			}
			if (!opts || !opts.map_parent) {
				if (!this.zero_map_level){
					throw new Error('who is your map parent model?');
				}
			}
		}
		this._super(opts);
	},
	mapStates: function(states_map, donor, acceptor) {
		if (acceptor && typeof acceptor == 'boolean'){
			acceptor = this.init_states;
		}
		return spv.mapProps(states_map, donor, acceptor);
	},
	initOnce: function() {
		if (this.init_opts){
			this.init.apply(this, this.init_opts);
			this.init_opts = null;
		}
		return this;
	},
	initStates: function(more_states) {
		if (more_states) {
			spv.cloneObj(this.init_states, more_states);
		}
		this.updateManyStates(this.init_states);
		this.init_states = null;
	},
	_hndOnPMDSwitch: function(e) {
		this.checkPMDSwiched(e.value);
	},
	setPmdSwitcher: function(pmd) {
		this.pmd_switch = pmd;
		pmd.on('state_change-vswitched', this._hndOnPMDSwitch, this.getContextOptsI());
	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd_vswitched');
		}
		if (new_state){
			if (!this.state('pmd_vswitched')){
				this.pmd_switch.updateState('vswitched', this._provoda_id);
			}
		} else {
			if (this.state('pmd_vswitched')){
				this.pmd_switch.updateState('vswitched', false);
			}
		}
	},
	checkPMDSwiched: function(value) {
		this.updateState('pmd_vswitched', value == this._provoda_id);
	}
});



var appendSpace = function(target) {
	//fixme
	//$(target).append(document.createTextNode(' '));
};


var getBaseTreeCheckList = function(start) {
	var i, result = [];
	var chunks_counter = 0;
	var all_items = [null, start];

	while (all_items.length) {
		

		var cur_parent = all_items.shift();
		var cur = all_items.shift();

		cur.parent = cur_parent;
		cur.chunk_num = chunks_counter;

		if (cur.children_by_selector) {
			for (i = 0; i < cur.children_by_selector.length; i++) {
				all_items.push( cur, cur.children_by_selector[i] );
			}
		}
		
		if (cur.children_by_anchor) {
			for (i = 0; i < cur.children_by_anchor.length; i++) {
				all_items.push( cur, cur.children_by_anchor[i] );
			}
		}

		result.push( cur );
		chunks_counter++;


	}
	return result;

};


var getBaseTreeSkeleton = function(array) {
	var result = new Array(array.length);
	for (var i = 0; i < array.length; i++) {
		result[i] = {
			handled: false,
			node: null,
			parent: array[i].parent && result[ array[i].parent.chunk_num ] || null,
			chunk_num: array[i].chunk_num
		};
	}
	return result;
};


var views_counter = 1;
var way_points_counter = 0;
provoda.StatesEmitter.extendTo(provoda.View, {
	init: function(view_otps, opts){
		this.demensions_key_start = null;
		this.req_order_field = null;
		this.tpl = null;
		this.c = null;
		this.has_details = null;
		this._detailed = null;
		this.dead = null;
		this.pv_view_node = null;
		this._anchor = null;
		this.marked_as_dead = null;
		this.dettree_incomplete = null;
		this.detltree_depth = null;
		this._states_set_processing = null;
		this._collections_set_processing = null;
		this.dclrs_fpckgs = this.dclrs_fpckgs;
		this.dclrs_fpckgs_is_clonned = false;
		this.detached = null;
		this.base_skeleton = null;

		this.innesting_pos_current = null;
		this.innest_prev_view = null;
		this.innest_next_view = null;
		//this.innesting_pos_old = null;

		if (this.base_tree_list) {
			this.base_skeleton = getBaseTreeSkeleton(this.base_tree_list);
		}

		this.handled_expandable_dclrs = this.dclrs_expandable ? {} : null;

		this.view_id = views_counter++;
		this.parent_view = null;
		if (view_otps.parent_view){
			this.parent_view = view_otps.parent_view;
		}
		this.root_view = null;
		if (view_otps.root_view){
			this.root_view = view_otps.root_view;
		}
		this.opts = null;
		if (opts){
			this.opts = opts;
		}

		this._super();
		this.children = [];
		this.children_models = {};
		this.view_parts = null;

		if (this.parent_view && !view_otps.location_name){
			throw new Error('give me location name!');
			//используется для идентификации использования одной и тойже view внутри разнородных родительских view или разных пространств внутри одного view
		}
		this.location_name = view_otps.location_name;
		if (!view_otps.mpx){
			throw new Error('give me model!');
		}
		
		this.mpx = view_otps.mpx;
		this.proxies_space = view_otps.proxies_space || null;
		this.undetailed_states = {};
		this.undetailed_children_models = {};
		this.way_points = [];
		this.dom_related_props = null;
		if (this.dom_rp){
			this.dom_related_props = [];
		}

		spv.cloneObj(this.undetailed_states, this.mpx.states);
		spv.cloneObj(this.undetailed_states, this.mpx.vstates);
		spv.cloneObj(this.undetailed_children_models, this.mpx.children_models);


		if (this.base_tree_expand_states) {
			for (var i = 0; i < this.base_tree_expand_states.length; i++) {
				this.on('state_change-' + this.base_tree_expand_states[i], this.hndExpandViewTree);
			}
		}


		var _this = this;
		this.triggerTPLevents = function(e) {
			if (!e.pv_repeat_context){
				if (!e.callback_data[0] && e.callback_data[1]){
					e.callback_data.shift();
					_this.RPCLegacy.apply(_this, e.callback_data);
				} else {
					_this.tpl_events[e.callback_name].call(_this, e.event, e.node, e.callback_data);
				}
			} else {
				_this.tpl_r_events[e.pv_repeat_context][e.callback_name].call(_this, e.event, e.node, e.scope);
			}
		};
		this.prsStCon.connect.parent(this);
		this.prsStCon.connect.root(this);
		return this;


	},
	_getCallsFlow: function() {
		return this.root_view && (this.root_view._getCallsFlow != this._getCallsFlow) && this.root_view._getCallsFlow() || main_calls_flow;
	},
	getStrucRoot: function() {
		return this.root_view;
	},
	getStrucParent: function() {
		return this.parent_view;
	},
	getNesting: function(collection_name) {
		return this.children_models[collection_name];
	},
	getWindow: function() {
		return spv.getDefaultView(this.d || this.getC()[0].ownerDocument);
	},
	demensions_cache: {},
	checkDemensionsKeyStart: function() {
		if (!this.demensions_key_start){
			this.demensions_key_start = this.location_name + '-' + (this.parent_view && this.parent_view.location_name + '-');
		}
	},
	getBoxDemensionKey: function() {
		var args = new Array(arguments.length); //optimization
		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
			
		}
		this.checkDemensionsKeyStart();
		return this.demensions_key_start.concat(args.join('-'));

	},
	getBoxDemensionByKey: function(cb, key) {
		if (typeof this.demensions_cache[key] == 'undefined'){
			this.demensions_cache[key] = cb.call(this);
		}
		return this.demensions_cache[key];
	},
	getBoxDemension: function(cb) {
		var args = new Array(arguments.length - 1);
		for (var i = 1; i < arguments.length; i++) {
			args[i-1] = arguments[i];
		}


		var key = this.getBoxDemensionKey.apply(this, args);
		return this.getBoxDemensionByKey(cb, key);
	},
	getReqsOrderField: function() {
		if (this.req_order_field){
			return this.req_order_field;
		} else {
			return (this.req_order_field = ['mdata', 'v', this.view_id, 'order']);
		}
	},
	getStoredMpx: function(md) {
		//return md.mpx;
		return views_proxies.getMPX(this.root_view.proxies_space, md);
	},
	RPCLegacy: function() {
		this.mpx.RPCLegacy.apply(this.mpx, arguments);
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
		var all = [];
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
		return obj;
	},
	hasWaypoint: function(point) {
		var arr = spv.filter(this.way_points, 'node');
		return arr.indexOf(point) != -1;
	},
	removeWaypoint: function(point) {
		var stay = [];
		for (var i = 0; i < this.way_points.length; i++) {
			var cur = this.way_points[i];
			if (cur.node != point){
				stay.push(cur);
			} else {
				cur.removed = true;
			}
		}
		this.way_points = stay;
	},
	PvTemplate: PvTemplate,
	getTemplate: function(node, callCallbacks, pvTypesChange) {
		node = node[0] || node;
		return new PvTemplate({node: node, callCallbacks: callCallbacks, pvTypesChange: pvTypesChange});
	},
	parseAppendedTPLPart: function(node) {
		this.tpl.parseAppended(node);
		this.tpl.setStates(this.states);
	},
	createTemplate: function(con) {
		con = con || this.c;
		if (!con){
			throw new Error('cant create template');
		}
		var _this = this;
		this.tpl = this.getTemplate(con, this.triggerTPLevents, function(arr_arr) {
			//pvTypesChange
			//this == template
			//this != provoda.View
			var old_waypoints = this.waypoints;
			var total = [];
			var i = 0;
			for (i = 0; i < arr_arr.length; i++) {
				if (!arr_arr[i]) {
					continue;
				}
				total.push.apply(total, arr_arr[i]);
				//total = total.concat(arr_arr[i]);
			}
			var matched = [];
			for (i = 0; i < total.length; i++) {
				var cur = total[i];
				if (!cur.marks){
					continue;
				}
				if (cur.marks['hard-way-point'] || cur.marks['way-point']){
					matched.push(cur);
				}
			}
			var to_remove = old_waypoints && spv.arrayExclude(old_waypoints, matched);
			this.waypoints = matched;
			_this.updateTemplatedWaypoints(matched, to_remove);
		});
	},
	addTemplatedWaypoint: function(wp_wrap) {
		if (!this.hasWaypoint(wp_wrap.node)){
			//может быть баг! fixme!?
			//не учитывается возможность при которой wp изменил свой mark
			//он должен быть удалён и добавлен заново с новыми параметрами
			var type;
			if (wp_wrap.marks['hard-way-point']){
				type = 'hard-way-point';
			} else if (wp_wrap.marks['way-point']){
				type = 'way-point';
			}
			this.addWayPoint(wp_wrap.node, {
				canUse: function() {
					return !!(wp_wrap.marks && wp_wrap.marks[type]);
				},
				simple_check: type == 'hard-way-point'
			});
		}
	},
	updateTemplatedWaypoints: function(add, remove) {
		var i = 0;
		if (remove){
			var nodes_to_remove = spv.filter(remove, 'node');
			for (i = 0; i < nodes_to_remove.length; i++) {
				this.removeWaypoint(nodes_to_remove[i]);
			}
		}
		for (i = 0; i < add.length; i++) {
			this.addTemplatedWaypoint(add[i]);
		}
		if (add.length){
			//console.log(add);
		}
	},
	connectChildrenModels: function() {
		var udchm = this.undetailed_children_models;
		this.undetailed_children_models = null;
		this.setMdChildren(udchm);

	},
	connectStates: function() {
		var states = this.undetailed_states;
		this.undetailed_states = null;
		this._setStates(states);

	},
	useBase: function(node) {
		this.c = node;
		this.createTemplate();
		if (this.bindBase){
			this.bindBase();
		}
	},
	createDetails: function() {
		if (this.pv_view_node){
			this.useBase(this.pv_view_node);
		} else {
			if (this.base_skeleton) {
				this.checkExpandableTree();
				if (this.c) {
					this.useBase(this.c);
				}
				if (this.expandBase) {
					this.expandBase();
				}
			} else if (this.createBase){
				this.createBase();
			}
		}
	},
	requestDetailesCreating: function() {
		if (!this.has_details){
			this.has_details = true;
			this.createDetails();
		}
	},
	requestDetailes: function(){
		this.requestDetailesCreating();
		this._detailed = true;
		if (!this.manual_states_connect){
			this.connectChildrenModels();
			this.connectStates();
		}
		this.appendCon();
	},
	appendCon: function(){
		if (this.skip_anchor_appending){
			return;
		}
		var con = this.getC();
		var anchor = this._anchor;
		if (con && anchor && anchor.parentNode){
			$(anchor).after(con);
			//anchor.parentNode.insertBefore(con[0], anchor.nextSibling);
			this._anchor = null;
			$(anchor).detach();
			this.setVisState('con_appended', true);
		} else if (con && con.parent()[0]){
			this.setVisState('con_appended', true);

		}
	},

	getFreeCV: function(child_name, view_space, opts) {
		var md = this.getMdChild(child_name);
		if (md){
			var view = this.getFreeChildView({name: child_name, space: view_space}, md, opts);
			return view;
		} else {
			throw new Error('there is no ' + child_name + ' child model');
		}
	},
	getAFreeCV: function(child_name, view_space, opts) {
		var view = this.getFreeCV(child_name, view_space, opts);
		if (view){
			var anchor = view.getA();
			if (anchor){
				return anchor;
			} else {
				throw new Error('there is no anchor for view of ' + child_name + ' child model');
			}
		}
		
	},
	getAncestorByRooViCon: function(view_space, strict) {
		//by root view connection
		var target_ancestor;
		var cur_ancestor = this;
		if (strict){
			cur_ancestor = cur_ancestor.parent_view;
		}
		while (!target_ancestor && cur_ancestor){
			if (cur_ancestor == this.root_view){
				break;
			} else {
				if (cur_ancestor.parent_view == this.root_view){
					if (cur_ancestor == this.root_view.getChildView(cur_ancestor.mpx, view_space)){
						target_ancestor = cur_ancestor;
						break;
					}
				}
			}

			cur_ancestor = cur_ancestor.parent_view;
		}
		return target_ancestor;
	},
	getChildView: function(mpx, view_space) {
		var complex_id = this.view_id + '_' + view_space;
		return mpx.getView(complex_id, true);
	},
	getFreeChildView: function(address_opts, md, opts) {
		var mpx = this.getStoredMpx(md);
		var
			child_name = address_opts.name,
			view_space = address_opts.space || 'main',
			complex_id = this.view_id + '_' + view_space,
			view = mpx.getView(complex_id, true);

		if (view){
			return false;
		} else {
			var ConstrObj = this.children_views[child_name];
			
			var Constr;
			if (typeof ConstrObj == 'function' && view_space == 'main'){
				Constr = ConstrObj;
			} else if (ConstrObj) {
				Constr = ConstrObj[view_space];
			}
			if (!Constr && address_opts.sampleController){
				Constr = address_opts.sampleController;
			}
			if (!Constr) {
				throw new Error('there is no View for ' + child_name);
			}

			view = new Constr();
			view.init({
				mpx: mpx,
				parent_view: this,
				root_view: this.root_view,
				location_name: child_name + '-' + view_space
			}, opts);
			mpx.addView(view, complex_id);
			this.addChildView(view, child_name);
			return view;
		}
	},
	getRelativeRequestsGroups: function(space) {
		var all_views = [];
		var all_requests = [];
		var iterating = [this];
		var i = 0, cur = null;
		while (iterating.length){
			cur = iterating.shift();
			for (i = 0; i < cur.children.length; i++) {
				iterating.push(cur.children[i]);
				all_views.push(cur.children[i]);
			}
		}

		for (i = 0; i < all_views.length; i++) {
			var reqs = all_views[i].getModelImmediateRequests(space);
			if (reqs && reqs.length){
				all_requests.push(reqs);
			}
		}
		return all_requests;
	},
	addChildView: function(view, child_name) {
		this.children.push.call(this.children, view);
		//fixme - possible memory leak when child is dead (this.children) 
	},
	addChild: function(view, child_name) {
		if (this.children.indexOf(view) == -1){
			this.children.push.call(this.children, view);
		}
	},
	getChildViewsByMpx: function(mpx) {
		var result = [];
		var views = mpx.getViews();
		var i = 0;
		for (i = 0; i < this.children.length; i++) {
			var cur = this.children[i];
			if (views.indexOf(cur) != -1){
				result.push(cur);
			}

		}
		return result;
	},
	removeChildViewsByMd: function(mpx) {
		var views_to_remove = this.getChildViewsByMpx(mpx);
		var i = 0;
		for (i = 0; i < views_to_remove.length; i++) {
			views_to_remove[i].die();
		}
		this.children = spv.arrayExclude(this.children, views_to_remove);

	},
	getDeepChildren: function(exept) {
		var all = [];
		var big_tree = [];
		exept = spv.toRealArray(exept);

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

	checkDeadChildren: function() {
		var i = 0, alive = [];
		for (i = 0; i < this.children.length; i++) {
			if (this.children[i].dead){
				//dead.push(this.children[i]);
			} else {
				alive.push(this.children[i]);
			}
		}
		if (alive.length != this.children.length){
			this.children = alive;
		}

	},
	onDie: function(cb) {
		this.on('die', cb);
	},
	markAsDead: function(skip_md_call) {
		this.nextTick(this.remove, [this.getC(), this._anchor]);
		this.dead = true; //new DeathMarker();
		this.stopRequests();

		this.trigger('die');
		if (!skip_md_call){
			this.mpx.removeDeadViews();
		}

		this.c = null;
		this._anchor = null;
		this.tpl = null;
		if (this.tpls){
			this.tpls = null;
		}
		this.way_points = null;

		if (this.wp_box){
			this.wp_box = null;
		}
		if (this.pv_view_node){
			this.pv_view_node = null;
		}
		

		var i = 0;
		if (this.dom_related_props){
			for (i = 0; i < this.dom_related_props.length; i++) {
				this[this.dom_related_props[i]] = null;
			}
		}
		var children = this.children;
		this.children = [];
		for (i = 0; i < children.length; i++) {
			children[i].markAsDead();
		}
		//debugger?
		this.view_parts = null;

		

	},
	remove: function(con, anchor) {
		if (!con){
			con = this.getC();
		}
		if (con){
			con.remove();
		}
		if (!anchor){
			anchor = this._anchor;
		}
		if (anchor){
			$(anchor).remove();
		}

	},
	die: function(opts){
		if (!this.marked_as_dead){
			this.markAsDead(opts && opts.skip_md_call);
			this.marked_as_dead = true;
		}
		return this;
	},
	getT: function(){
		return this.c || this.pv_view_node || $(this.getA());
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
	__tickDetRequest: function() {
		if (!this.isAlive()){
			return;
		}
		this.dettree_incomplete = this.requestDetalizationLevel(this.detltree_depth);
		this.detltree_depth++;
		if (this.dettree_incomplete){
			this.nextTick(this.__tickDetRequest);
		}
	},
	requestDeepDetLevels: function(){
		if (this._states_set_processing || this._collections_set_processing){
			return this;
		}
		//iterate TREE
		this.detltree_depth = 1;
		this.dettree_incomplete = true;

		
		/*
		while (this.dettree_incomplete) {
			this.dettree_incomplete = this.requestDetalizationLevel(this.detltree_depth);
			this.detltree_depth++;
		}*/

		this.nextTick(this.__tickDetRequest);
		
		return this;
	},
	softRequestChildrenDetLev: function(rel_depth) {
		if (this._states_set_processing || this._collections_set_processing){
			return this;
		}
		this.requestChildrenDetLev(rel_depth);
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
	requestDetalizationLevel: function(rel_depth){
		if (!this._detailed){
			this.requestDetailes();
		}
		return this.requestChildrenDetLev(rel_depth - 1);
	},
	getCNode: function(c) {
		return (c = this.getC()) && (typeof c.length != 'undefined' ? c[0] : c);
	},
	isAliveFast: function() {
		return !this.dead;
	},
	isAlive: function(dead_doc) {
		if (this.dead){
			return false;
		} else {
			if (this.getC()){
				var c = this.getCNode();
				if (!c || (dead_doc && dead_doc === c.ownerDocument) || !spv.getDefaultView(c.ownerDocument)){
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
	_setStates: function(states){
		this._states_set_processing = true;
		//disallow chilren request untill all states will be setted

		this.states = {};
		//var _this = this;


		//var complex_states = [];


		var states_list = [];

		for (var name in states){
			states_list.push(name, states[name]);
		}

		this._updateProxy(states_list);
		this._states_set_processing = null;
		return this;
	},
	updateTemplatesStates: function(total_ch) {
		var i = 0;
		//var states = this.states;

		if (this.tpl){
			this.tpl.checkChanges(total_ch, this.states);
		}
		if (this.tpls){
			for (i = 0; i < this.tpls.length; i++) {
				this.tpls[i].checkChanges(total_ch, this.states);
			}
		}
	},
	requireAllParts: function() {
		for (var a in this.parts_builder){
			this.requirePart(a);
		}
		return this;
	},
	getPart: function(name) {
		return this.view_parts && this.view_parts[name];
	},
	collectStateChangeHandlers: function(props) {
		var need_recalc = false;
		if (this.hasOwnProperty('state_change')){
			need_recalc = true;
		} else {
			for (var prop in props){
				if (props.hasOwnProperty(prop) && prop.indexOf('stch-') === 0){
					need_recalc = true;
					break;
				}
			}
		}
		if (!need_recalc){
			return;
		}

		var has_stchh = {};
		var result = [];
		var name;

		for (name in this) {
			if (name.indexOf('stch-') === 0){
				var real_name = name.replace('stch-','');
				has_stchh[real_name] = true;
				result.push({
					name: real_name,
					item: this[name]
				});
			}
		}

		if (this.state_change){
			for (name in this.state_change) {
				if (!has_stchh[name]){
					has_stchh[name] = true;
					result.push({
						name: name,
						item: this.state_change[name]
					});
				}

			}
		}

		this.stch_hs = result;
	},
	requirePart: function(name) {
		if (!this.isAlive()){
			return $();
		}
		if (this.view_parts && this.view_parts[name]){
			return this.view_parts[name];
		} else {
			if (!this.view_parts){
				this.view_parts = {};
			}
			this.view_parts[name] = this.parts_builder[name].call(this);
			if (!this.view_parts[name]){
				throw new Error('"return" me some build result please');
			}

			for (var i = 0; i < this.stch_hs.length; i++) {
				var cur = this.stch_hs[i];
				if (this.states.hasOwnProperty(cur.name) && typeof cur.item != 'function'){
					if (this.checkDepVP(cur.item, name)){
						cur.item.fn.call(this, this.states[cur.name]);
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
			if (!this.view_parts || !this.view_parts[cur]){
				has_all_dependings = false;
				break;
			} else {
				has_all_dependings = true;
			}
		}
		return has_all_dependings;
	},
	recieveStatesChanges: function(changes_list) {
		if (!this.isAlive()){
			return;
		}
		this._updateProxy(changes_list);
	},
	overrideStateSilently: function(name, value) {
		this._updateProxy([name, value], {skip_handler: true});
	},
	promiseStateUpdate: function(name, value) {
		this._updateProxy([name, value]);
	},
	setVisState: function(name, value) {
		this._updateProxy(['vis_' + name, value]);
	},
	checkChildrenModelsRendering: function() {
		var obj = spv.cloneObj(false, this.children_models);
		this.setMdChildren(obj);
	},
	setMdChildren: function(collections) {
		this._collections_set_processing = true;
		//вью только что создана, присоединяем подчинённые views без деталей (детали создаются позже)
		for (var i in collections) {
			this.collectionChange(i, collections[i]);
		}
		this._collections_set_processing = null;
	},
	getMdChild: function(name) {
		return this.children_models[name];
	},
	pvserv: {
		simple: {
			getView: function(cur_md, space, preffered) {
				if (this.pv_view.node){
					if (!preffered || preffered.indexOf(cur_md) != -1){
						return this.getFreeView(cur_md, this.pv_view.node);
					}
				}
			},
			getFreeView: function(cur_md, node_to_use) {
				var pv_view = this.pv_view;
				var view = this.view.getFreeChildView({
					name: this.name,
					space: this.space_name,
					sampleController: provoda.Controller
				}, cur_md);

				if (view){
					if (!node_to_use){
						//node_to_use = pv_view.original_node.cloneNode(true);
						node_to_use = pv_view.sampler.getClone();
					}
					view.pv_view_node = $(node_to_use);
					//var model_name = mmm.model_name;

					pv_view.node = null;
					pv_view.views.push(view.view_id);

					pv_view.last_node = node_to_use;
					return view;
				}
			},
			appendDirectly: function(fragt) {
				$(this.pv_view.comment_anchor).after(fragt);
			}
		},
		bymodel: {
			getFreeView: function(cur_md, node_to_use) {
				var pv_view = this.pv_v_data.index[cur_md.model_name];
				if (!pv_view){
					return;
				}

				var view = this.view.getFreeChildView({
					name: cur_md.model_name,
					space: this.space_name,
					sampleController: provoda.Controller
				}, cur_md);

				if (view){
					if (!node_to_use){
						node_to_use = pv_view.sampler.getClone();
						//node_to_use = pv_view.original_node.cloneNode(true);
					}
					view.pv_view_node = $(node_to_use);
					//var model_name = mmm.model_name;

					pv_view.node = null;
					pv_view.views.push(view.view_id);

					pv_view.last_node = node_to_use;
					return view;
				}
			},
			appendDirectly: function(fragt) {
				$(this.pv_v_data.comment_anchor).after(fragt);
			}
		}
	},
	checkCollchItemAgainstPvViewByModelName: function(nesname, real_array, space_name, pv_v_data) {
		var filtered = [];

		for (var i = 0; i < real_array.length; i++) {
			var cur = real_array[i];
			if (cur.model_name && pv_v_data.index[cur.model_name]){
				filtered.push(cur);
			}
		}

		//var filtered = pv_view.filterFn ? pv_view.filterFn(real_array) : real_array;

		this.appendCollection(space_name, {

			view: this,
			pv_v_data: pv_v_data,
			space_name: space_name,
			getFreeView: this.pvserv.bymodel.getFreeView,
			appendDirectly: this.pvserv.bymodel.appendDirectly
		}, false, nesname, filtered);
	},

	checkCollchItemAgainstPvView: function(nesname, real_array, space_name, pv_view) {
	//	if (!pv_view.original_node){
	//		pv_view.original_node = pv_view.node.cloneNode(true);
			
	//	}
		if (!pv_view.comment_anchor){
			pv_view.comment_anchor = document.createComment('collch anchor for: ' + nesname + ", " + space_name);
			$(pv_view.node).before(pv_view.comment_anchor);
		}

		if (pv_view.node){
			$(pv_view.node).detach();
			pv_view.node = null;
		}
		
		var filtered = pv_view.filterFn ? pv_view.filterFn(real_array) : real_array;

		this.appendCollection(space_name, {
			view: this,
			pv_view: pv_view,
			name: nesname,
			space_name: space_name,
			getView: pv_view.node && this.pvserv.simple.getView,
			appendDirectly: this.pvserv.simple.appendDirectly,
			getFreeView: this.pvserv.simple.getFreeView
		}, false, nesname, filtered);

	},
	checkCollectionChange: function(nesname) {
		if (!this.dclrs_fpckgs){
			throw new Error('there is no declarations');
		}
		if (!this.dclrs_fpckgs[ '$ondemand-' + nesname ]){
			throw new Error('there is no "$ondemand-" declaration for: ' + nesname);
		}
		if (this.dclrs_fpckgs.hasOwnProperty(nesname)){
			throw new Error('constant declaration exist for nesting named "' + nesname + '"');
		}

		if (!this.dclrs_fpckgs_is_clonned){
			this.dclrs_fpckgs_is_clonned = true;
			var new_cache = {};
			spv.cloneObj(new_cache, this.dclrs_fpckgs);
			this.dclrs_fpckgs = new_cache;
		}
		

		this.dclrs_fpckgs[nesname] = this.dclrs_fpckgs[ '$ondemand-' + nesname ];
		if (this.children_models[nesname]){

			this.collectionChange(nesname, this.children_models[nesname]);
		}
	},
	tpl_children_prefix: 'tpl.children_templates.',
	collch_h_prefix: 'collch-',
	collectionChange: function(nesname, array, rold_value, removed) {
		if (!this.isAlive()){
			return;
		}
		if (this.undetailed_children_models){
			this.undetailed_children_models[nesname] = array;
			return this;
		}

		var old_value = this.children_models[nesname];
		this.children_models[nesname] = array;

		var pv_views_complex_index = spv.getTargetField(this, this.tpl_children_prefix + nesname);
		if (pv_views_complex_index){
			var space_name;
			array = spv.toRealArray(array);
			for (space_name in pv_views_complex_index.usual){
				this.removeViewsByMds(removed, space_name);
			}
			for (space_name in pv_views_complex_index.by_model_name){
				this.removeViewsByMds(removed, space_name);
			}

			for (space_name in pv_views_complex_index.usual){
				this.checkCollchItemAgainstPvView(nesname, array, space_name, pv_views_complex_index.usual[space_name]);
			}
			for (space_name in pv_views_complex_index.by_model_name){
				this.checkCollchItemAgainstPvViewByModelName(nesname, array, space_name, pv_views_complex_index.by_model_name[space_name]);
			}
			/*
			for (var 
				i = 0; i < space.length; i++) {
				space[i]
			};*/


			this.requestAll();
		}


		var collch = this.dclrs_fpckgs && this.dclrs_fpckgs.hasOwnProperty(nesname) && this.dclrs_fpckgs[nesname];//collectionChanger
		if (collch){
			this.callCollectionChangeDeclaration(collch, nesname, array, old_value, removed);
		}
		if (this['after-collch-' + nesname]){
			this['after-collch-' + nesname].call(this, array);
		}
		this.checkDeadChildren();
		return this;
	},
	removeViewsByMds: function(array, space) {
		if (!array){
			return;
		}
		for (var i = 0; i < array.length; i++) {
			var view = this.getChildView(this.getStoredMpx(array[i]), space || 'main');
			if (view){
				view.die();
			} else {
				//throw 'wrong';
			}
		}
	},
	collectCollectionChangeDeclarations: function(props) {
		var need_recalc = false, prop;
	
		for (prop in props){
			if (props.hasOwnProperty(prop) && prop.indexOf(this.collch_h_prefix) === 0){
				need_recalc = true;
				break;
			}
		}
		
		if (!need_recalc){
			return;
		}

		this.dclrs_fpckgs = {};

		for (prop in this){
			if (prop.indexOf(this.collch_h_prefix) === 0){
				var collch = this[ prop ];
				var nesting_name = prop.replace(this.collch_h_prefix, '');
				if (typeof collch == 'function'){
					this.dclrs_fpckgs[ nesting_name ] = collch;
				} else {
					var not_request = false, collchs = false;
					var collchs_limit = false;
					if (typeof collch == 'object'){
						not_request = collch.not_request;
						collchs = collch.spaces;
						collchs_limit = collch.limit;
					}

					collchs = collchs || spv.toRealArray(collch);
					var declarations = new Array(collchs.length);
					for (var i = 0; i < collchs.length; i++) {
						declarations[i] = this.parseCollectionChangeDeclaration(collchs[i]);
					}

					this.dclrs_fpckgs[ nesting_name ] = {
						declarations: declarations,
						not_request: not_request,
						limit: collchs_limit

					};
				}

			}
		}
		return true;
	},
	callCollectionChangeDeclaration: function(dclr_fpckg, nesname, array, old_value, removed) {
		if (typeof dclr_fpckg == 'function'){
			dclr_fpckg.call(this, nesname, array, old_value, removed);
		} else {
			
			var real_array = spv.toRealArray(array);
			var array_limit;
			if (dclr_fpckg.limit){
				array_limit = Math.min(dclr_fpckg.limit, real_array.length);
			} else {
				array_limit = real_array.length;
			}
			var min_array = real_array.slice(0, array_limit);
			for (var jj = 0; jj < dclr_fpckg.declarations.length; jj++) {
				var declr = dclr_fpckg.declarations[jj];
				if (typeof declr.place == 'string'){
					var place = spv.getTargetField(this, declr.place);
					if (!place){
						throw new Error('wrong place declaration: "' + declr.place + '"');
					}
				}
				var opts = declr.opts;
				this.removeViewsByMds(removed, declr.space);
				if (typeof declr.place == 'function' || !declr.place){
					this.simpleAppendNestingViews(declr, opts, nesname, min_array);
					if (!dclr_fpckg.not_request){
						this.requestAll();
					}
				} else {
					this.appendNestingViews(declr, opts, nesname, min_array, dclr_fpckg.not_request);
				}
			}
		}
	},
	parseCollectionChangeDeclaration: function(collch) {
		if (typeof collch == 'string'){
			collch = {
				place: collch
			};
		}
		var expand_state = collch.needs_expand_state;
		if (expand_state && typeof expand_state != 'string') {
			expand_state = 'can_expand';
		}

		return {
			place: collch.place,
			by_model_name: collch.by_model_name,
			space: collch.space || 'main',
			strict: collch.strict,
			opts: collch.opts,
			needs_expand_state: expand_state || null
		};
	},
	simpleAppendNestingViews: function(declr, opts, nesname, array) {
		for (var bb = 0; bb < array.length; bb++) {
			var cur = array[bb];
			this.appendFVAncorByVN({
				md: cur,
				name: (declr.by_model_name ? cur.model_name : nesname),
				opts: (typeof opts == 'function' ? opts.call(this, cur) : opts),
				place: declr.place,
				space: declr.space,
				strict: declr.strict
			});
		}

	},
	getPrevView: function(array, start_index, view_space, view_itself) {
		view_space = view_space || 'main';
		var complex_id = this.view_id + '_' + view_space;

		var i = start_index - 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i >= 0; i--) {
			var view = this.getStoredMpx(array[i]).getView(complex_id);
			var dom_hook = view && !view.detached && view.getT();
			if (dom_hook){
				if (view_itself){
					return view;
				} else {
					return dom_hook;
				}
			}

		}
	},
	getNextView: function(array, start_index, view_space, view_itself) {
		view_space = view_space || 'main';
		var complex_id = this.view_id + '_' + view_space;

		var i = start_index + 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i < array.length; i++) {
			var view = this.getStoredMpx(array[i]).getView(complex_id);
			var dom_hook = view && !view.detached && view.getT();
			if (dom_hook){
				if (view_itself){
					return view;
				} else {
					return dom_hook;
				}
			}
		}
	},
	appen_ne_vws: {
		appendDirectly: function(fragt) {
			this.place.append(fragt);
		},
		getFreeView: function(cur) {
			return this.view.getFreeChildView({
				name: (this.by_model_name ? cur.model_name : this.nesname),
				space: this.space
			}, cur, (typeof this.view_opts == 'function' ? this.view_opts.call(this.view, cur) : this.view_opts));
		}
	},
	appendNestingViews: function(declr, view_opts, nesname, array, not_request){
		var place;
		if (typeof declr.place == 'string'){
			place = spv.getTargetField(this, declr.place);
		} else if (typeof declr.place == 'function'){
			//place = spv.getTargetField(this, declr.place);
		}
		this.appendCollection(declr.space, {
			view: this,
			place: place,
			nesname: nesname,
			space: declr.space,
			by_model_name: declr.by_model_name,
			view_opts: view_opts,
			appendDirectly: this.appen_ne_vws.appendDirectly,
			getFreeView: this.appen_ne_vws.getFreeView
		}, view_opts, nesname, array, not_request);

	},
	coll_r_prio_prefix: 'coll-prio-',
	getRendOrderedNesting: function(nesname, array) {
		var getCollPriority = this[this.coll_r_prio_prefix + nesname];
		return getCollPriority && getCollPriority.call(this, array);
	},
	appendCollection: function(space, funcs, view_opts, nesname, array, not_request) {
		//исправляем порядковый номер вьюхи в нэстинге
		for (var i = 0; i < array.length; i++) {
			var view = this.getChildView(this.getStoredMpx(array[i]), space);
			if (view) {
				//view.innesting_pos_old = view.innesting_pos_current;
				view.innesting_pos_current = i;
			}
		}

		var ordered_rend_list = this.getRendOrderedNesting(nesname, array);
		if (ordered_rend_list){
			this.appendOrderedCollection(space, funcs, view_opts, array, not_request, ordered_rend_list);
		} else {
			this.appendOrderedCollection(space, funcs, view_opts, array, not_request);
		}
	},
	createDOMComplect: function(complects, ordered_complects, view, type) {
		var comt_id = view.view_id + '_' + type;
		if (!complects[comt_id]){
			var complect = {
				fragt: document.createDocumentFragment(),
				view: view,
				type: type
			};
			complects[comt_id] = complect;
			ordered_complects.push(comt_id);
		}
		return complects[comt_id];
	},
	appendOrderedCollection: function(space, funcs, view_opts, array, not_request, ordered_rend_list) {
		if (!this.isAlive()){
			return;
		}
		var cur = null, view = null, i = 0, prev_view = null, next_view = null;
		var detached = [];
		var ordered_part;

		while (!ordered_part && ordered_rend_list && ordered_rend_list.length){
			ordered_part = ordered_rend_list && ordered_rend_list.shift();
			if (ordered_part && ordered_part.length == array && array.length){
				ordered_part = null;
			}
			if (ordered_part) {
				//если у всех приоритезированных моделей уже есть вьюхи, то не не используем преоритезацию
				var has_any_nonviewed = false;
				for (i = 0; i < ordered_part.length; i++) {
					if (!this.getChildView(this.getStoredMpx(ordered_part[i]), space)){
						has_any_nonviewed = true;
					}
				}
				if (!has_any_nonviewed){
					ordered_part = null;
				}
			}
		}

		//если сосед имевший меньший номер теперь имеет номер больше значит нас сместили в начало
		//если сосед имел больший, а теперь меньше, нас сместили в конец


		for (i = 0; i < array.length; i++) {
			cur = array[i];
			view = this.getChildView(this.getStoredMpx(cur), space);
			if (view){
				prev_view = this.getPrevView(array, i, space, true);
				if (prev_view){
					var current_node = view.getT();
					var prev_node = prev_view.getT();
					if (!current_node.prev().is(prev_node)){
						var parent_node = current_node[0] && current_node[0].parentNode;
						if (parent_node){
							parent_node.removeChild(current_node[0]);
						}
						view.setVisState('con_appended', false);

						view.detached = true;
						detached.push(view);
					}
				}
			}
		}
		var append_list = [];
		var ordered_complects = [];
		var complects = {};
		//view_id + 'after'

		//создать контроллеры, которые уже имеют DOM в документе, но ещё не соединены с ним
		//следующий итератор получит эти views через getChildView
		if (funcs.getView){
			for (i = 0; i < array.length; i++) {
				funcs.getView( array[i], space, ordered_part);
			}
		}


		for (i = 0; i < array.length; i++) {
			cur = array[i];
			view = this.getChildView(this.getStoredMpx(cur), space);
			if (view && !view.detached){
				continue;
			}
			if (!view && ordered_part && ordered_part.indexOf(cur) == -1){
				continue;
			}
			prev_view = this.getPrevView(array, i, space, true);

			if (prev_view && prev_view.state('vis_con_appended')) {
				append_list.push(cur, this.createDOMComplect(complects, ordered_complects, prev_view, 'after'));
			} else {
				next_view = this.getNextView(array, i, space, true);
				if (next_view && next_view.state('vis_con_appended')){
					append_list.push(cur, this.createDOMComplect(complects, ordered_complects, next_view, 'before'));
				} else {
					append_list.push(cur, this.createDOMComplect(complects, ordered_complects, false, 'direct'));
				}
			}
			//cur.append_list = append_list;
		}
		var apd_views = new Array(append_list.length/2);
		for (i = 0; i < append_list.length; i+=2) {
			cur = append_list[ i ];
			var complect = append_list[ i + 1 ];

			view = this.getChildView(this.getStoredMpx(cur), space);
			if (!view){
				view = funcs.getFreeView(cur);
			}
			apd_views[i/2] = view;
			//append_data.view = view;
			view.skip_anchor_appending = true;
			var fragt = $(complect.fragt);
			fragt.append(view.getT());
			appendSpace(fragt);
			//append_data.complect.fragt.appendChild(view.getT()[0]);
			//$(.fragt).append();
		}
		if (!this._collections_set_processing){
			for (i = array.length - 1; i >= 0; i--) {
				view = this.getChildView(this.getStoredMpx(array[i]), space);
				if (view){
					view.requestDetailesCreating();
				}
			}
			if (!not_request){
				//this._collections_set_processing
				this.requestAll();
			}
		}

		for (i = 0; i < ordered_complects.length; i++) {
			var complect = complects[ordered_complects[i]];
			if (complect.type == 'after'){
				complect.view.getT().after(complect.fragt);
			} else if (complect.type == 'before'){
				complect.view.getT().before(complect.fragt);
			} else if (complect.type =='direct'){
				funcs.appendDirectly(complect.fragt);
			}
		}
		for (i = 0; i < detached.length; i++) {
			detached[i].detached = null;
		}
		if (ordered_part && ordered_part.length){
			this.nextTick(this.appendOrderedCollection, [space, funcs, view_opts, array, not_request, ordered_rend_list]);
			//fixme can be bug (если nesting изменён, то измнения могут конфликтовать)
		}


		for (i = 0; i < array.length; i++) {
			view = this.getChildView(this.getStoredMpx(array[i]), space);
			if (view){
				view.innest_prev_view = this.getPrevView(array, i, space, true);
				view.innest_next_view = this.getNextView(array, i, space, true);
				
			}
			
		}

		for (i = 0; i < apd_views.length; i++) {
			cur = apd_views[i];
			cur.skip_anchor_appending = null;
			cur.appendCon();
		}
		return complects;
		//1 открепить неправильно прикреплённых
		//1 выявить соседей
		//отсортировать существующее
		//сгруппировать новое
		//присоединить новое
		//view: this.getChildView(opts.md.mpx, opts.space)
	},
	appendFVAncorByVN: function(opts) {
		var view = this.getFreeChildView({name: opts.name, space: opts.space}, opts.md, opts.opts);
		var place = opts.place;
		if (place && typeof opts.place == 'function'){
			if ((opts.strict || view) && place){
				place = opts.place.call(this, opts.md, view);
				if (!place && typeof place != 'boolean'){
					throw new Error('give me place');
				} else {
					place.append(view.getA());
					appendSpace(place);
				}
			}

		}
	},
	parts_builder: {}
});


if ( typeof window === "object" && typeof window.document === "object" ) {
	window.provoda = provoda;
}
return provoda;
});