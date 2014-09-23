define('pv', ['spv', 'angbo', 'jquery', 'js/libs/PvTemplate', 'js/libs/morph_helpers', 'hex_md5', 'js/libs/provoda.initDeclaredNestings'],
function(spv, angbo, $, PvTemplate, morph_helpers, hex_md5, initDeclaredNestings){
"use strict";
var push = Array.prototype.push;
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
	this.views = null;
	this.views_index = null;
	this.states = states;
	this.vstates = null;
	//this.children_models = children_models;
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
		if (!this.vstates) {
			this.vstates = {};
		}
		var changes_list = [];
		for (var name in obj) {
			this.vstates[name] = obj[name];
			changes_list.push(name, obj[name]);
		}
		this.sendStatesToViews(changes_list);
		return this;
	},
	updateState: function(name, value, opts){
		//fixme если вьюха ещё не создана у неё не будет этого состояния
		//эклюзивные состояния для вьюх не хранятся и не передаются при создании

		/*if (name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop name: ' + name);
		}*/
		if (!this.vstates) {
			this.vstates = {};
		}
		this.vstates[name] = value;
		this.sendStatesToViews([name, value], opts);
		return this;
	},
	state: function(state_name) {
		return this.vstates && this.vstates[state_name];
	},
	removeView: function(view){
		if (!this.views) {
			return;
		}
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

		if (!this.views) {
			return;
		}
		var removed = provoda.getRemovedNestingItems(array, old_value);
		
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].stackCollectionChange(collection_name, array, old_value, removed);
		}
	},

	stackReceivedStates: function(states_list) {
		if (!this.views) {
			return;
		}
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].stackReceivedChanges(states_list);
		}
	},
	sendStatesToViews: function(states_list, opts) {
		if (!this.views) {
			return;
		}
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].receiveStatesChanges(states_list, opts);
		}
	},
	removeDeadViews: function(hard_deads_check, complex_id){
		var i = 0;
		if (hard_deads_check){
			var target_view = complex_id && this.views_index && this.views_index[complex_id];
			var checklist = complex_id ? (target_view && [target_view]) : this.views;
			if (checklist){
				for (i = 0; i < checklist.length; i++) {
					if (checklist[i].isAlive){
						checklist[i].isAlive();
					}
				}
			}
			
		}
		if (this.views) {
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
					var cur = this.views_index[a];
					if (dead.indexOf(cur) != -1) {
						this.views_index[a] = null;
					}
					// = spv.arrayExclude(this.views_index[a], dead);
				}
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
		if (!views) {
			return;
		}
		for (var i = 0; i < views.length; i++) {
			views[i].die({skip_md_call: true});
		}
		this.removeDeadViews();
		return this;
	},
	collectViewsGarbadge: function() {
		if (!this.views){
			return;
		}
		for (var i = 0; i < this.views.length; i++) {
			this.views[i].checkDeadChildren();
		}
	},
	getViews: function(complex_id, hard_deads_check) {
		this.removeDeadViews(hard_deads_check);
		if (complex_id){
			return [this.views_index && this.views_index[complex_id]];
		} else {
			return this.views || [];
		}
	},
	getView: function(complex_id){
		this.removeDeadViews(true, complex_id);
		if (!complex_id) {
			throw new Error('complex_id');
		}
		//complex_id = complex_id || 'main';
		return this.views_index && this.views_index[complex_id];// && this.views_index[complex_id][0];
	},
	addView: function(v, complex_id) {
		this.removeDeadViews(true, complex_id);
		if (!this.views) {
			this.views = [];
		}
		this.views.push( v );
		if (!this.views_index) {
			this.views_index = {};
		}
		this.views_index[complex_id] = v;
		//(= this.views_index[complex_id] || []).push(v);
		return this;
	},
	getRooConPresentation: function(root_view, mplev_view, get_ancestor, only_by_ancestor) {
		var views = this.getViews();
		var cur;
		if (!only_by_ancestor){
			for (var i = 0; i < views.length; i++) {
				cur = views[i];
				if ( root_view.matchCildrenView( cur, false, 'map_slice' ) ) {
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
	//очистка пространства

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
				cur.mpxes_index[md._provoda_id].stackReceivedStates(states_list);

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
		/*if (ids){
			debugger;
		}*/
		
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

var SyncReceiver = function(stream){
	this.stream = stream;
	this.md_proxs_index = {};
	this.models_index = {};

};

SyncReceiver.prototype = {
	
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

			
			this.md_proxs_index[message._provoda_id].stackReceivedStates(message.value);
		},
		update_nesting: function(message) {
			if (message.struc) {
				this.buildTree(message.struc);
			}

			var target_model = this.models_index[message._provoda_id];
			var target_md_proxy = this.md_proxs_index[message._provoda_id];

			var fakes_models = idToModel(this.models_index, message.value);
			

			target_model.children_models[message.name]= fakes_models;
			//target_md_proxy.children_models[message.name] = fakes_models;
			target_md_proxy.sendCollectionChange(message.name, fakes_models);
		}
	}
};


provoda = {
	initWebApp: function(root_md, RootViewConstr) {

		var proxies_space = Date.now();
		var views_proxies = provoda.views_proxies;
		views_proxies.addSpaceById(proxies_space, root_md);
		var mpx = views_proxies.getMPX(proxies_space, root_md);

		(function() {
			var view = new RootViewConstr();
			mpx.addView(view, 'root');
			view.init({
				mpx: mpx,
				proxies_space: proxies_space
			}, {d: window.document});
			view.requestAll();
			view = null;
		})();
	},
	getModelById: function(id) {
		return big_index[id];
	},
	prototypes: {},
	setTplFilterGetFn: function(fn) {
		angbo.getFilterFn = fn;
	},
	MDProxy: MDProxy,
	sync_s: sync_sender,
	SyncR: SyncReceiver,
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
	},
	getRemovedNestingItems: function(array, old_value) {
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
		} else if (old_value && array != old_value) {
			removed = [old_value];
		}
		return removed;
	}
};
provoda.Controller = provoda.View;

var DeathMarker = function() {
	//helper to find memory leaks; if there is memory leaking DeathMarker will be available in memory heap snapshot;
};

var setEvLiItems = function(items_list) {
	var old_value = this.current_motivator;
	this.current_motivator = this.current_motivator;

	items_list = spv.toRealArray(items_list);
	this.unsubcribeOld();
	this.items_list = items_list;
	this.controls_list.length = 0;
	this.controls_list.length = items_list.length;
	for (var i = 0; i < items_list.length; i++) {
		var cur = items_list[i];
		var oldv = cur.current_motivator;
		cur.current_motivator = this.current_motivator;

		this.controls_list[i] = cur.evcompanion._addEventHandler(this.event_name, this.event_callback, this, false, false, true, false, false, true);
		//_addEventHandler: function(namespace, cb, context, immediately, exlusive, skip_reg, soft_reg, once, easy_bind_control){

		/*this.controls_list[i] = cur.on(this.event_name, this.event_callback, {
			easy_bind_control: true,
			context: this,
			skip_reg: this.skip_reg
		});*/
	
		cur.current_motivator = oldv;
	}
	this.current_motivator = old_value;
};



var ItemsEvents = function(event_name, md, callback) {
	this.items_list = null;
	this.md = md;
	this.controls_list = [];
	this.event_name = event_name;
	this.callback = callback;
	//this.skip_reg = true;
	this.current_motivator = null;
};
ItemsEvents.prototype = {
	event_callback: function(e) {
		var old_value = this.md.current_motivator;
		this.md.current_motivator = this.current_motivator;
		this.callback.call(this.md, {
			target: this.md,
			item: e && e.target,
			value: e && e.value,
			items: this.items_list
		});
		this.md.current_motivator = old_value;
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
		this.setItemsReal( items_list && spv.toRealArray( items_list ) );
		this.event_callback();
	}
};


var hasargfn = function(cur) {return cur;};
var StatesArchiver = function(state_name, result_state_name, md, calculateResult) {
	this.items_list = null;
	this.controls_list = [];
	this.current_motivator = null;
	this.md = md;
	this.result_state_name = result_state_name;

	this.state_name = state_name;
	this.event_name = 'lgh_sch-' + this.state_name;
	//this.skip_reg = true;

	var calcR = calculateResult;
	if (calcR){
		if (typeof calcR == 'function'){
			this.calculate_result = calcR;
		} else {
			if (calcR == 'some'){
				this.calculate_result = this.some;
			} else if (calcR == 'every'){
				this.calculate_result = this.every;
			}
		}

	} else {
		this.calculate_result = this.some;
	}


};
StatesArchiver.prototype = {
	event_callback: function() {
		this.getItemsValues();
	},
	every: function(values_array) {
		return !!values_array.every(hasargfn);
	},
	some: function(values_array) {
		return !!values_array.some(hasargfn);
	},
	setResult: function(value) {
		var old_value = this.md.current_motivator;
		this.md.current_motivator = this.current_motivator;
		this.md.updateState(this.result_state_name, value);
		this.md.current_motivator = old_value;
	},
	getItemsValues: function() {
		var values_list = new Array(this.items_list.length);
		for (var i = 0; i < this.items_list.length; i++) {
			values_list[i] = this.items_list[i].state(this.state_name);
		}
		this.setResult(this.calculate_result.call(this, values_list));
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
		this.setItemsReal( items_list && spv.toRealArray( items_list ) );
		this.event_callback();
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
	this.aborted = false;
	this.p_space = '';
	this.p_index_key = '';
	this.num = num;
	this.fn = fn;
	this.context = context;
	this.args = args;
	this.arg = arg || null;
	this.cb_wrapper = cb_wrapper || null;
	this.real_context = real_context;
	this.complex_order = ( parent_motivator && parent_motivator.complex_order.slice() ) || [];
	this.complex_order.push(this.num);
	//this.custom_order = null;
};
FlowStep.prototype.abort = function() {
	this.aborted = true;
	this.num = null;
	this.fn = null;
	this.context = null;
	this.args = null;
	this.arg = null;
	this.cb_wrapper = null;
	this.real_context = null;
	//this.complex_order = null;
};
FlowStep.prototype.call = function() {
	if (this.cb_wrapper){
		/*
		вместо того, что бы просто выполнить отложенную функцию мы можем вызвать специальный обработчик, который сможет сделать некие действиями, имея в распоряжении
		в первую очередь мотиватор, далее контекст для самого себя, контекст колбэка, сам колбэк и аргументы для колбэка

		*/
		this.cb_wrapper.call(this.real_context, this, this.fn, this.context, this.args, this.arg);
	} else {
		if (this.args){
			if (this.args.length > 1) {
				this.fn.apply(this.context, this.args);
			} else {
				this.fn.call(this.context, this.args[0]);
			}
			
		} else {
			this.fn.call(this.context, this.arg);
		}
	}
	
};

var sortFlows = function(item_one, item_two) {
	if (item_one.aborted && item_two.aborted) {
		return;
	} else if (item_one.aborted) {
		return -1;
	} else if (item_two.aborted) {
		return 1;
	}


	var max_length;

	/*if (item_one.custom_order && item_two.custom_order) {

	} else if (item_one.custom_order) {

	} else if (item_two.custom_order) {

	}*/


	max_length = Math.max(item_one.complex_order.length, item_two.complex_order.length);

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
	var raf;

	if ( win.requestAnimationFrame ){
		raf = win.requestAnimationFrame;
	} else {
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !raf; ++x) {
			raf = win[vendors[x]+'RequestAnimationFrame'];
		}
	}
	return raf && function(fn) {
		return raf.call(win, fn);
	};
};


var insertItem = function(array, item, index) {
	var array_length = array.length;
	var next_value = item;
	var value_to_recover;

	for (var jj = index; jj < array_length + 1; jj++) {
		value_to_recover = array[jj];
		array[jj] = next_value;
		next_value = value_to_recover;
	}
	return array;
};

	
var CallbacksFlow = function(win, rendering_flow, iteration_time) {
	this.flow = [];
	this.busy = null;
	this.iteration_time = iteration_time || 250;
	this.iteration_delayed = null;
	this.flow_steps_counter = 1;
	this.flow_steps_collating_invalidated = null;
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
		var start = Date.now() + this.iteration_time;
		this.iteration_delayed = false;
		this.callbacks_busy = true;
		while (this.flow.length){
			if (Date.now() > start){
				this.pushIteration(this.hndIterateCallbacksFlow);
				break;
			}
			var cur;
			if (typeof this.flow_steps_collating_invalidated == 'number'){
				cur = this.flow[0];
				if (this.flow_steps_collating_invalidated <= cur.complex_order[0]) {
					this.flow_steps_collating_invalidated = null;
					this.flow.sort(sortFlows);
					
				}
			}
			cur = this.flow.shift();
			if (!cur.aborted) {
				cur.call();
			}
			
			
			
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
		var flow_step = new FlowStep(++this.flow_steps_counter, fn, context, args, cbf_arg, cb_wrapper, real_context, motivator);
		if (motivator){
			var last_item = this.flow[ this.flow.length - 1 ];
			var result = last_item && sortFlows(last_item, flow_step);
			if (result === 1) {
				//очевидно, что новый элемент должен в результате занять другую позицию

				var last_matched = -1;
				for (var i = 0; i < this.flow.length; i++) {
					var cur = this.flow[i];

					var match_result = sortFlows(cur, flow_step);
					if (match_result == -1) {
						last_matched = i;
					} else {
						break;
					}
				}
				//this.flow.splice( last_matched + 1, 0, flow_step );

				insertItem(this.flow, flow_step, last_matched + 1);
				
				//this.flow_steps_collating_invalidated = Math.min( flow_step.complex_order[0], this.flow_steps_collating_invalidated || Infinity );
			} else {
				this.flow.push(flow_step);
			}
		} else {
			this.flow.push(flow_step);
		}
		
		
		this.checkCallbacksFlow();
		return flow_step;

	}
};
provoda.CallbacksFlow = CallbacksFlow;

var main_calls_flow = new CallbacksFlow(window);



var stackEmergency = function(fn, eventor, args) {
	return main_calls_flow.pushToFlow(fn, eventor, args);
};

var requests_by_declarations = {};


var getNetApiByDeclr = function(send_declr, sputnik, app) {
	var network_api;
	var api_name = send_declr[0];
	if (typeof api_name == 'string') {
		network_api = spv.getTargetField(app || sputnik.app, api_name);
	} else if (typeof api_name == 'function') {
		network_api = api_name.call(sputnik);
	}
	return network_api;
};

var getRequestByDeclr = function(send_declr, sputnik, opts, network_api_opts) {

	var api_name = send_declr[0], api_method = send_declr[1], api_args = send_declr[2].call(sputnik, opts),
		non_standart_api_opts = send_declr[3];

	var network_api = getNetApiByDeclr(send_declr, sputnik);
	

	if (!network_api.source_name) {
		throw new Error('network_api must have source_name!');
	}

	if (!network_api.errors_fields && !network_api.checkResponse) {
		throw new Error('provide a way to detect errors!');
	}


	if (typeof api_name != 'string') {
		api_name = network_api.api_name;
	}

	if (typeof api_name != 'string') {
		throw new Error('network_api must have api_name!');
	}

	var manual_nocache = api_args[2] && api_args[2].nocache;

	if (!non_standart_api_opts) {
		if (!api_args[2]) {
			api_args[2] = network_api_opts;
		} else {
		}
	}
	
	var cache_key;
	if (!non_standart_api_opts && !manual_nocache) {
		var big_string = JSON.stringify([api_name, api_method, api_args]);
		cache_key = hex_md5(big_string);
		if (requests_by_declarations[cache_key]) {
			return requests_by_declarations[cache_key];
		}

	}
	


	var request = network_api[ api_method ].apply(network_api, api_args);
	request.network_api = network_api;
	if (cache_key) {
		requests_by_declarations[cache_key] = request;
		request.always(function() {
			delete requests_by_declarations[cache_key];
		});
	}

	return request;
};



var clean_obj = {};

var cached_parsed_namespace = {};
var parseNamespace = function(namespace) {
	if (!cached_parsed_namespace[namespace]){
		cached_parsed_namespace[namespace] = namespace.split('.');
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

var findErrorByList = function(data, errors_selectors) {
	var i, cur, has_error;
	for (i = 0; i < errors_selectors.length; i++) {
		cur = errors_selectors[i];
		has_error = spv.getTargetField(data, cur);
		if (has_error){
			break;
		}
	}
	return has_error;
};

var getReqMapsForState= function(req_map, state_name) {
	if (!req_map) {
		return;
	}
	var maps_for_state= [];
	for (var i = 0; i < req_map.length; i++) {
		var states_list = req_map[i][0];
		if (states_list.indexOf(state_name) != -1) {
			maps_for_state.push(i, req_map[i]);
		}
	}
	return maps_for_state;
};

var FastEventor = function(context) {
	this.sputnik = context;
	this.subscribes = null;
	this.subscribes_cache = null;
	this.reg_fires = null;
	if (context.reg_fires){
		this.reg_fires = context.reg_fires;
	}
	this.requests = null;
	this.mapped_reqs = null;//this.sputnik.req_map ? {} : null;
	this.nesting_requests = null;//this.sputnik.has_reqnest_decls ? {} : null;
};
FastEventor.prototype = {
	_pushCallbackToStack: function(opts) {
		if (!this.subscribes) {
			this.subscribes = {};
		}

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
				var posb_namespace = parts.slice(0, i + 1).join('.');
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
		if (motivator.p_space) {
			this.zdsv.removeFlowStep(motivator.p_space, motivator.p_index_key, motivator);
		}
		if (args){
			fn.apply(context, args);
		} else {
			fn.call(context, arg);
		}
	},
	_addEventHandler: function(namespace, cb, context, immediately, exlusive, skip_reg, soft_reg, once, easy_bind_control){
		//common opts allowed
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(namespace);
		}

		var
			fired = false,
			_this = this,
			name_parts = parseNamespace(namespace),
			short_name = name_parts[0];

		if (exlusive){
			this.off(namespace);
		}

		var reg_args = null, one_reg_arg = null;

		var callbacks_wrapper = this.hndUsualEvCallbacksWrapper;

		var reg_fires = this.getPossibleRegfires(namespace);
		if (reg_fires && reg_fires.length){
			reg_args = reg_fires[0].fn.call(this.sputnik, namespace, name_parts);
			if (reg_args) {
				fired = true;
				if (!Array.isArray(reg_args)) {
					one_reg_arg = reg_args;
					reg_args = null;
				}
			}
			
		}
		if (fired){
			if (reg_fires[0].getWrapper){
				callbacks_wrapper = reg_fires[0].getWrapper.call(this.sputnik);
			}
			if (!skip_reg){
				var mo_context = context || _this.sputnik;
				if (soft_reg === false){
					if (one_reg_arg) {
						cb.call(mo_context, one_reg_arg);
					} else {
						cb.apply(mo_context, reg_args);
					}
					
				} else {
					var flow_step = this.sputnik._getCallsFlow().pushToFlow(cb, mo_context, reg_args, one_reg_arg, callbacks_wrapper, this.sputnik, this.sputnik.current_motivator);
					if (reg_fires[0].handleFlowStep) {

						reg_fires[0].handleFlowStep.call(this.sputnik, flow_step, reg_fires[0].getFSNamespace(namespace));
					}
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
	once: function(namespace, cb, opts, context){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context || context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			true,
			opts && opts.easy_bind_control);
	},
	on: function(namespace, cb, opts, context){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context || context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			false,
			opts && opts.easy_bind_control);
	},
	off: function(namespace, cb, obj, context){
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(namespace);
		}
		var
			short_name = parseNamespace(namespace)[0],
			queried = this.getMatchedCallbacks(namespace);

		if (this.subscribes && this.subscribes[short_name]){
			var clean = [];
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
		if (!this.subscribes_cache) {
			return;
		}

		//fixme - bug for "state_change-workarea_width.song_file_progress" ( "state_change-workarea_width" stays valid, but must be invalid)
		for (var cur_namespace in this.subscribes_cache){
			if (!this.subscribes_cache[cur_namespace]){
				continue;
			}
			var last_char = cur_namespace.charAt(short_name.length);
			if ((!last_char || last_char == '.') && cur_namespace.indexOf(short_name) == 0){
				this.subscribes_cache[cur_namespace] = null;
			}
		}
	},
	_empty_callbacks_package: {
		matched: [],
		not_matched: []
	},
	getMatchedCallbacks: function(namespace){
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(namespace);
		}
		var
			r, short_name = parseNamespace(namespace)[0];

		var cb_cs = this.subscribes && this.subscribes[short_name];
		if (cb_cs){
			var cached_r = this.subscribes_cache && this.subscribes_cache[namespace];
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
						canbe_matched = (!last_char || last_char == '.') && curn.indexOf(namespace) == 0;
						cac_space[curn] = canbe_matched;
					}
					if (canbe_matched){
						matched.push(cb_cs[i]);
					} else {
						not_matched.push(cb_cs[i]);
					}
				}
				if (!this.subscribes_cache) {
					this.subscribes_cache = {};
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

			var calls_flow = (opts && opts.emergency) ? main_calls_flow : this.sputnik._getCallsFlow();
			return calls_flow.pushToFlow(cur.cb, callback_context, args, arg, cur.wrapper, wrapper_context, this.sputnik.current_motivator);
			/*
			setTimeout(function() {
				cur.cb.apply(_this, args);
			},1);*/
		}
	},
	triggerCallbacks: function(cb_cs, args, opts, ev_name, arg, flow_steps_array){
		for (var i = 0; i < cb_cs.length; i++) {
			var cur = cb_cs[i];
			var flow_step = this.callEventCallback(cur, args, opts, arg);
			if (flow_step && flow_steps_array) {
				flow_steps_array.push(flow_step);
			}
			if (cur.once){
				this.off(ev_name, false, cur);
			}
		}
	},
	trigger: function(ev_name){
		var cb_cs = this.getMatchedCallbacks(ev_name).matched;
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
					this.off(ev_name, false, cur);
				}
			}
		}
		return this;
	},
	default_requests_space: 'nav',
	getRequests: function(space) {
		space = space || this.default_requests_space;
		return this.requests && this.requests[space];
	},
	getQueued: function(space) {
		//must return new array;
		var requests = this.getRequests(space);
		return requests && spv.filter(requests, 'queued');
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
		if (!this.requests) {
			this.requests = {};
		}

		if (!this.requests[space]){
			this.requests[space] = [];
		}

		var target_arr = this.requests[space];
		
		var bindRemove = function(_this, req) {
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
					req.addDepend(this.sputnik);
				}
			}
			target_arr.push(req);
			bindRemove(this, req);
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
		var requests = this.requests && this.requests[space || this.default_requests_space];
		if (!this.requests || !this.requests.length) {
			return;
		}

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
		var all_requests;
		if (!this.requests) {
			return all_requests;
		}
		for (var space in this.requests){
			if (this.requests[space].length){
				if (!all_requests) {
					all_requests = [];
				}
				all_requests.push.apply(all_requests, this.requests[space]);
			}
		}
		return all_requests;
	},
	stopRequests: function(){

		var all_requests = this.getAllRequests();

		while (all_requests && all_requests.length) {
			var rq = all_requests.pop();
			if (rq) {
				if (rq.softAbort){
					rq.softAbort(this.sputnik);
				} else if (rq.abort){
					rq.abort(this.sputnik);
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
	
	
	requestState: function(state_name) {
		var current_value = this.sputnik.state(state_name);
		if (current_value) {
			return;
		}

		var i, cur, states_list, maps_for_state = getReqMapsForState(this.sputnik.req_map, state_name);

		var cant_request;
		if (this.mapped_reqs) {
			for (i = 0; i < maps_for_state.length; i+=2) {
				cur = this.mapped_reqs[maps_for_state[i]];
				if (cur && (cur.done || cur.process)) {
					cant_request = true;
					break;
				}
			}
		}
		
		if (cant_request) {
			return;
		}

		var selected_map = maps_for_state[1];
		var selected_map_num = maps_for_state[0];
		if (!this.mapped_reqs) {
			this.mapped_reqs = {};
		}


		if ( !this.mapped_reqs[selected_map_num] ) {
			this.mapped_reqs[selected_map_num] = {
				done: false,
				error: false,
				process: false
			};
		}

		var store = this.mapped_reqs[selected_map_num];

		
		states_list = selected_map[0];
		this.sputnik.updateManyStates(this.makeLoadingMarks(states_list, true));
		var parse = selected_map[1], send_declr = selected_map[2];
		

		

		var request = getRequestByDeclr(send_declr, this.sputnik,
			{has_error: store.error},
			{nocache: store.error});
		var network_api = request.network_api;

		store.process = true;
		var _this = this;
		request
				.always(function() {
					store.process = false;
					_this.sputnik.updateManyStates(_this.makeLoadingMarks(states_list, false));
				})
				.fail(function(){
					store.error = true;
				})
				.done(function(r){
					var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);
					var i;
					if (has_error){
						store.error = true;
					} else {
						var result = parse.call(_this.sputnik, r, null, morph_helpers);
						if (result) {
							var result_states;

							if (Array.isArray(result)) {
								if (result.length != states_list.length) {
									throw new Error('values array does not match states array');
								}

								result_states = {};
								for (i = 0; i < states_list.length; i++) {
									result_states[ states_list[i] ] = result[ i ];
								}

							} else if (typeof result == 'object') {
								for (i = 0; i < states_list.length; i++) {
									if (!result.hasOwnProperty(states_list[i])) {
										throw new Error('object must have all props:' + states_list + ', but does not have ' + states_list[i]);
									}
								}
								result_states = result;
							}
							_this.sputnik.updateManyStates( result_states );


							store.error = false;
							store.done = true;
						} else {
							store.error = true;
						}
						
					}
				});
		
		this.addRequest(request);
		return request;

	},
	makeLoadingMarks: function(states_list, value) {
		var loading_marks = {};
		for (var i = 0; i < states_list.length; i++) {

			loading_marks[ states_list[i] + '__loading'] = value;
			
		}
		return loading_marks;
	},
	requestNesting: function(dclt, nesting_name) {
		if (!dclt) {
			return;
		}
		if (!this.nesting_requests) {
			this.nesting_requests = {};
		}

		if (!this.nesting_requests[ nesting_name ]) {
			this.nesting_requests[ nesting_name ] = {
				//has_items: false,
				has_all_items: false,
				last_page: 0,
				error: false,
				process: false
			};
		}

		var store = this.nesting_requests[ nesting_name ];
		if (store.process || store.has_all_items) {
			return;
		}

		var is_main_list = nesting_name == this.sputnik.main_list_name;

		this.sputnik.updateState('loading_nesting_' + nesting_name, true);
		if (is_main_list) {
			this.sputnik.updateState('main_list_loading', true);
		}
		var side_data_parsers = dclt[0][2];
		var parse_items = dclt[0][0], parse_serv = dclt[0][1], send_declr = dclt[1];
		var supports_paging = !!parse_serv;
		var paging_opts = this.sputnik.getPagingInfo(nesting_name);

		var network_api_opts = {
			nocache: store.error
		};

		if (supports_paging) {
			network_api_opts.paging = paging_opts;
		}
		

		

		var request = getRequestByDeclr(send_declr, this.sputnik,
			{has_error: store.error, paging: paging_opts},
			network_api_opts);
		var network_api = request.network_api;
		var source_name = network_api.source_name;

		store.process = true;
		var _this = this;
		request
				.always(function() {
					store.process = false;
					_this.sputnik.updateState('loading_nesting_' + nesting_name, false);
					if (is_main_list) {
						_this.sputnik.updateState('main_list_loading', false);
					}
				})
				.fail(function(){
					store.error = true;
				})
				.done(function(r){
					var sputnik = _this.sputnik;
					var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);

					if (has_error){
						store.error = true;
					} else {
						var items = parse_items.call(sputnik, r, sputnik.head_props || clean_obj, morph_helpers);
						var serv_data = typeof parse_serv == 'function' && parse_serv.call(sputnik, r, paging_opts, morph_helpers);
						
				

						if (!supports_paging) {
							store.has_all_items = true;

							sputnik.updateState("all_data_loaded", true);
						} else {
							var has_more_data;
							if (serv_data === true) {
								has_more_data = true;
							} else if (serv_data && ((serv_data.hasOwnProperty('total_pages_num') && serv_data.hasOwnProperty('page_num')) || serv_data.hasOwnProperty('total'))) {
								if (!isNaN(serv_data.total)) {
									if ( (paging_opts.current_length + items.length) < serv_data.total && serv_data.total > paging_opts.page_limit) {
										has_more_data = true;
									}
								} else {
									if (serv_data.page_num < serv_data.total_pages_num) {
										has_more_data = true;
									}
								}

							} else {
								has_more_data = items.length == sputnik.page_limit;
							}



							if (!has_more_data) {
								store.has_all_items = true;
								sputnik.updateState("all_data_loaded", true);
							}
						}
						items = paging_opts.remainder ? items.slice( paging_opts.remainder ) : items;

						sputnik.nextTick(sputnik.insertDataAsSubitems, [nesting_name, items, serv_data, source_name], true);

						if (!sputnik.loaded_nestings_items) {
							sputnik.loaded_nestings_items = {};
						}

						if (!sputnik.loaded_nestings_items[nesting_name]) {
							sputnik.loaded_nestings_items[nesting_name] = 0;
						}
						var has_data_holes = serv_data === true || (serv_data && serv_data.has_data_holes === true);

						sputnik.loaded_nestings_items[nesting_name] += has_data_holes ? paging_opts.page_limit : items.length;
						//special logic where server send us page without few items. but it can be more pages available
						//so serv_data in this case is answer for question "Is more data available?"

						if (side_data_parsers) {
							for (var i = 0; i < side_data_parsers.length; i++) {
								sputnik.nextTick(
									_this.sputnik.handleNetworkSideData, [
										source_name,
										side_data_parsers[i][0],
										side_data_parsers[i][1].call(sputnik, r, paging_opts, morph_helpers)
									], true);

							}

						}

						


						//сделать выводы о завершенности всех данных
					}
				});

		this.addRequest(request);
		return request;

		/*
		есть ли декларация
		все ли возможные данные получены
		в процессе запроса (пока можно запрашивать в один поток)


		маркировка ошибок с прошлых запросов не участвует в принятиях решений, но используется для отказа от кеша при новых запросах


		*/
	}

};
var hndMotivationWrappper = function(motivator, fn, context, args, arg) {

	if (motivator.p_space) {
		this.zdsv.removeFlowStep(motivator.p_space, motivator.p_index_key, motivator);
	}

	


	if (this.isAliveFast && !this.isAliveFast()) {
		return;
	}

	//устанавливаем мотиватор конечному пользователю события
	var ov_c = context.current_motivator;
	context.current_motivator = motivator;

	

	var ov_t;

	if (this != context) {
		//устанавливаем мотиватор реальному владельцу события, чтобы его могли взять вручную
		//что-то вроде api
		ov_t = this.current_motivator;
		this.current_motivator = motivator;
	}



	if (args){
		fn.apply(context, args);
	} else {
		fn.call(context, arg);
	}


	if (context.current_motivator != motivator){
		throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
	}
	context.current_motivator = ov_c;


	if (this != context) {
		if (this.current_motivator != motivator){
			throw new Error('wrong motivator'); //тот кто поменял current_motivator должен был вернуть его обратно
		}
		this.current_motivator = ov_t;
	}
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
		var result = fn.call(this, item);
		item.current_motivator = old_value;
		return result;
	},
	nextLocalTick: function(fn, args, use_current_motivator) {
		return this._getCallsFlow().pushToFlow(fn, this, args, false, hndMotivationWrappper, this, use_current_motivator && this.current_motivator);
	},
	nextTick: function(fn, args, use_current_motivator) {
		return main_calls_flow.pushToFlow(fn, this, args, false, hndMotivationWrappper, this, use_current_motivator && this.current_motivator);
	},
	once: function(namespace, cb, opts, context) {
		return this.evcompanion.once(namespace, cb, opts, context);
	},
	on: function(namespace, cb, opts, context) {
		return this.evcompanion.on(namespace, cb, opts, context);
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
	requestState: function() {
		return this.evcompanion.requestState.apply(this.evcompanion, arguments);
	},
	requestNesting: function() {
		return this.evcompanion.requestNesting.apply(this.evcompanion, arguments);
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
var iterateChList = function(changes_list, context, cb, zdsv) {
	for (var i = 0; i < changes_list.length; i+=2) {
		cb.call(context, i, changes_list[i], changes_list[i+1], zdsv);
	}
};


var hasPrefixedProps = function(props, prefix) {
	var has_prefixed;
	for (var prop_name in props) {
		if (props.hasOwnProperty(prop_name) && prop_name.indexOf(prefix) === 0){
			has_prefixed = true;
			break;
		}
	}
	return has_prefixed;
};



var connects_store = {};
var getConnector = function(state_name) {
	if (!connects_store[state_name]){
		connects_store[state_name] = function(e) {
			this.updateState(state_name, e.value);
		};
	}
	return connects_store[state_name];
};

var light_con_store = {};
var getLightConnector = function(state_name) {
	if (!light_con_store[state_name]){
		light_con_store[state_name] = function(value) {
			this.updateState(state_name, value);
		};
	}
	return light_con_store[state_name];
};

var PVStateChangeEvent = function(type, value, old_value, target) {
	this.type = type;
	this.value = value;
	this.old_value = old_value;
	this.target = target;
};


var EvConxOpts = function(context, immediately) {
	this.context = context;
	this.immediately = immediately;
};

var StatesLabour = function(has_complex_states, need_stch_storage) {
	this.flow_steps_stev = null;
	this.flow_steps_vip_stdch_ev = null;
	this.flow_steps_collch = null;
	this.flow_steps_stch = null;


	this.collecting_states_changing = false;
	this.original_states = {};
	
	this.states_changing_stack = [];
	this.all_i_cg = [];

	this.changed_states = [];
	this.total_ch = [];

	this.stch_states = need_stch_storage ? {} : null;
	this.all_ch_compxs = has_complex_states ? [] : null;
};
StatesLabour.prototype.abortFlowSteps = function(space, index_key, is_one_item) {
	var full_space = 'flow_steps_' + space;

	if (!this[full_space]){
		return;
	}

	var array = this[full_space][index_key];
	if (!array) {
		return;
	}
	if (!is_one_item) {
		while (array.length) {
			var cur = array.shift();
			cur.abort();
		}
	} else {
		array.abort();
		this[full_space][index_key] = null;
	}
	
	return;
};
StatesLabour.prototype.createFlowStepsArray = function(space, index_key, one_item) {
	var full_space = 'flow_steps_' + space;
	if (!this[full_space]){
		this[full_space] = {};
	}
	if (one_item) {
		this[full_space][index_key] = one_item;
	} else if (!this[full_space][index_key]) {
		this[full_space][index_key] = [];
	}

	return this[full_space][index_key];
};

StatesLabour.prototype.removeFlowStep = function(space, index_key, item) {
	var full_space = 'flow_steps_' + space;
	var target = this[full_space][index_key];
/*	if (!target) {
		debugger;
		return;
	}*/
	if (Array.isArray(target)) {
		var pos = target.indexOf(item);
		//var arr = 
		target.splice(pos, 1);
		/*if (!arr.length) {
			debugger;
		}*/
		
	} else {
		if (target == item) {
			this[full_space][index_key] = null;
		} else {
			console.log('wrong motivator !?')
		}
	}
	

};


var markFlowSteps = function(flow_steps, p_space, p_index_key) {
	for (var i = 0; i < flow_steps.length; i++) {
		flow_steps[i].p_space = p_space;
		flow_steps[i].p_index_key = p_index_key;
	}
};

var stackStateFlowStep = function(flow_step, state_name) {
	if (!this.zdsv) {
		this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		//debugger;
	}
	flow_step.p_space = 'stev';
	flow_step.p_index_key = state_name;
	this.zdsv.createFlowStepsArray('stev', state_name).push(flow_step);
};

var stackNestingFlowStep = function(flow_step, nesting_name) {
	if (!this.zdsv) {
		this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		//debugger;
	}
	flow_step.p_space = 'collch';
	flow_step.p_index_key = nesting_name;
	this.zdsv.createFlowStepsArray('collch', nesting_name).push(flow_step);
};

var encoded_states = {};
var enc_states = {
	parent_count_regexp: /^\^+/gi,
	parent: function(string) {
		//example: '^visible'

		if (!encoded_states[string]){
			var state_name = string.replace(this.parent_count_regexp, '');
			var count = string.length - state_name.length;
			encoded_states[string] = {
				rel_type: 'parent',
				full_name: string,
				ancestors: count,
				state_name: state_name
			};
		}
		
		return encoded_states[string];
	},
	nesting: function(string) {
		//example:  '@some:complete:list'
		if (!encoded_states[string]){
			var nesting_and_state_name = string.replace('@', '');
			var parts = nesting_and_state_name.split(':');

			var nesting_name = parts.pop();
			var state_name = parts.pop();
			var zin_func = parts.pop();
			if (!zin_func) {
				zin_func = function(list) {return list;};
			}

			encoded_states[string] = {
				rel_type: 'nesting',
				full_name: string,
				nesting_name: nesting_name,
				state_name: state_name,
				zin_func: zin_func
			};
		}
		

		return encoded_states[string];
	},
	root: function(string) {
		//example: '#vk_id'
		if (!encoded_states[string]){
			encoded_states[string] = {
				rel_type: 'root',
				full_name: string,
				state_name: string.replace('#', '')
			};
		}

		return encoded_states[string];
	}
};
var getEncodedState = function(state_name) {
	if (!encoded_states.hasOwnProperty(state_name)) {
		if (state_name.indexOf('^') === 0){
			enc_states.parent(state_name);
		} else if (state_name.indexOf('@') === 0 ) {
			enc_states.nesting(state_name);
		} else if (state_name.indexOf('#') === 0 ) {
			enc_states.root(state_name);
		} else {
			encoded_states[state_name] = null;
		}
	}
	return encoded_states[state_name];
};

provoda.Eventor.extendTo(provoda.StatesEmitter, function(add) {
add({
	init: function(){
		this._super();
		this.conx_optsi = null;
		this.conx_opts = null;
		this.zdsv = null;
		this.current_motivator = this.current_motivator || null;


		this.states = {};

		//this.collectCompxs();

		return this;
	},
	'regfr-vipstev': {
		test: function(namespace) {
			return namespace.indexOf('vip_state_change-') === 0;
		},
		fn: function(namespace) {
			var state_name = namespace.replace('vip_state_change-', '');
			return {
				value: this.state(state_name),
				target: this
			};
		},
		getWrapper: function() {
			return hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return namespace.replace('vip_state_change-', '');
		},
		handleFlowStep: stackStateFlowStep
	},
	'regfr-stev': {
		test: function(namespace) {
			return namespace.indexOf('state_change-') === 0;
		},
		fn: function(namespace) {
			var state_name = namespace.replace('state_change-', '');
			return {
				value: this.state(state_name),
				target: this
			};
		},
		getWrapper: function() {
			return hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return namespace.replace('state_change-', '');
		},
		handleFlowStep: stackStateFlowStep
	},
	'regfr-lightstev': {
		test: function(namespace) {
			return namespace.indexOf('lgh_sch-') === 0;
		},
		fn: function(namespace) {
			return this.state(namespace.replace('lgh_sch-', ''));
		},
		getWrapper: function() {
			return hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return namespace.replace('lgh_sch-', '');
		},
		handleFlowStep: stackStateFlowStep
	},
	getContextOptsI: function() {
		if (!this.conx_optsi){
			this.conx_optsi = new EvConxOpts(this, true);
		}
		return this.conx_optsi;
	},
	getContextOpts: function() {
		if (!this.conx_opts){
			this.conx_opts = new EvConxOpts(this);
		}
		return this.conx_opts;
	},
	_bindLight: function(donor, event_name, cb, immediately) {
		donor.evcompanion._addEventHandler(event_name, cb, this, immediately);

		if (this != donor && this instanceof provoda.View){
			this.onDie(function() {
				if (!donor) {
					return;
				}
				donor.off(event_name, cb, false, this);
				donor = null;
				cb = null;
			});
		}
	},
	lwch: function(donor, donor_state, func) {
		this._bindLight(donor, 'lgh_sch-' + donor_state, func);
	},
	wlch: function(donor, donor_state, acceptor_state) {
		var event_name = 'lgh_sch-' + donor_state;
		var acceptor_state_name = acceptor_state || donor_state;
		var cb = getLightConnector(acceptor_state_name);
		this._bindLight(donor, event_name, cb);


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
		this._bindLight(donor, event_name, cb, immediately);
		

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

		if (this.collectNestingsDeclarations) {
			this.collectNestingsDeclarations(props);
		}

		if (this.changeDataMorphDeclarations) {
			this.changeDataMorphDeclarations(props);
		}

		if (this.changeChildrenViewsDeclarations) {
			this.changeChildrenViewsDeclarations(props);
		}

		
		for (var i = 0; i < this.xxxx_morph_props.length; i++) {
			var cur = this.xxxx_morph_props[i];
			var cur_name = Array.isArray(cur) ? cur[0] : cur;
			var subfield = Array.isArray(cur) && cur[1];
			if (props.hasOwnProperty(cur_name)) {
				if (typeof this[cur_name] != 'function' && this[cur_name] !== true) {
					var obj = {
						props_map: this[cur_name]
					};
					if (subfield) {
						obj.source = subfield;
					}
					this[cur_name] = spv.mmap(obj);
				}
				
			}
		}

		
	},
	xxxx_morph_props: [['hp_bound','--data--'], 'data_by_urlname', 'data_by_hp'],
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
					var target_node = cur_config.selector ? $(cur.parent.node).find(cur_config.selector) : $(cur.parent.node);

					if (!cur_config.prepend) {
						target_node.append(cur.node);
					} else {
						target_node.prepend(cur.node);
					}

					if (cur_config.needs_expand_state && cur_config.parse_as_tplpart) {
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
			if (this.dclrs_expandable[state_name]) {
				if (!this._lbr.handled_expandable_dclrs) {
					this._lbr.handled_expandable_dclrs = {};
				}
				if (!this._lbr.handled_expandable_dclrs[state_name]) {
					this._lbr.handled_expandable_dclrs[state_name] = true;
					for (i = 0; i < this.dclrs_expandable[state_name].length; i++) {
						this.checkCollectionChange(this.dclrs_expandable[state_name][i]);
					}

					this.checkChildrenModelsRendering();
					this.requestAll();
				}
				
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
	}
});


var nes_as_state_cache = {};


var watchNestingAsState = function(md, nesting_name, state_name) {
	if (!nes_as_state_cache[state_name]) {
		nes_as_state_cache[state_name] = function(e) {
			this.updateState(state_name, e && e.value);
		};
	}

	md.on('child_change-' + nesting_name, nes_as_state_cache[state_name]);
};




add({
	prsStCon: {
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
					md.wlch(target, cur.state_name, cur.full_name);
				}

			},
			nesting: function(md) {
				var list = md.conndst_nesting;
				if (!list){
					return;
				}
				if (!md.archivateChildrenStates) {
					throw new Error('cant calculate nesting based complex states for view (only for models)');
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					
					if (cur.state_name) {
						md.archivateChildrenStates(cur.nesting_name, cur.state_name, cur.zin_func, cur.full_name);
					} else {
						watchNestingAsState(md, cur.nesting_name, cur.full_name);
					}
					
					
					

				}
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
					md.wlch(target, cur.state_name, cur.full_name);
				}
				
			}
		}
	},
	collectStatesConnectionsProps: function() {
		/*
		'compx-some_state': [['^visible', '@some:complete:list', '#vk_id'], function(visible, complete){
	
		}]
		*/
		var states_of_parent = {};
		var states_of_nesting = {};
		var states_of_root = {};


		for (var i = 0; i < this.full_comlxs_list.length; i++) {
			var cur = this.full_comlxs_list[i];

			for (var jj = 0; jj < cur.depends_on.length; jj++) {
				var state_name = cur.depends_on[jj];
				var parsing_result = getEncodedState(state_name);
				if (parsing_result) {
					if (parsing_result.rel_type == 'root') {
						if (!states_of_root[state_name]) {
							states_of_root[state_name] = parsing_result;
						}
					} else  if (parsing_result.rel_type == 'nesting') {
						if (!states_of_nesting[state_name]) {
							states_of_nesting[state_name] = parsing_result;
						}
					} else if (parsing_result.rel_type == 'parent') {
						if (!states_of_parent[state_name]) {
							states_of_parent[state_name] = parsing_result;
						}
					}
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
				compx_check[name] = cur;
				this.full_comlxs_list.push(cur);
			}
		}
	},
	collectCompxs2part: function(compx_check) {
		for (var comlx_name in this.complex_states){
			if (!compx_check[comlx_name]){
				
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
				compx_check[comlx_name] = cur;
				
				this.full_comlxs_list.push(cur);
			}
		}
	},
//	full_comlxs_list: [],
	compx_check: {},
//	full_comlxs_index: {},
	collectCompxs:function(props) {
		var need_recalc = false;
		if (this.hasOwnProperty('complex_states')){
			need_recalc = true;
		} else {
			need_recalc = hasPrefixedProps(props, 'compx-');
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
		

		need_recalc = hasPrefixedProps(props, 'regfr-');

		
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
	}
});


var compressChangesList = function(changes_list, i, prop_name, value, counter) {
	if (this[prop_name] !== true){
		var num = (changes_list.length - 1) - counter * 2;
		changes_list[ num - 1 ] = prop_name;
		changes_list[ num ] = value;

		this[prop_name] = true;
		return true;
	}

};
var reversedIterateChList = function(changes_list, context, cb) {
	var counter = 0;
	for (var i = changes_list.length - 1; i >= 0; i-=2) {
		if (cb.call(context, changes_list, i, changes_list[i-1], changes_list[i], counter)){
			counter++;
		}
	}
	return counter;
};


var st_event_name_default = 'state_change-';
var st_event_name_vip = 'vip_state_change-';
var st_event_name_light = 'lgh_sch-';

var state_ch_h_prefix = 'stch-';

var st_event_opt = {force_async: true};

add({
	compressStatesChanges: function(changes_list) {
		var result_changes = {};
		var counter = reversedIterateChList(changes_list, result_changes, compressChangesList);
		counter = counter * 2;
		while (changes_list.length != counter){
			changes_list.shift();
		}
		return changes_list;
	},
	proxyStch: function(value, old_value_trans, state_name) {
		var old_value = this.zdsv.stch_states[state_name];
		if (old_value != value) {
			this.zdsv.stch_states[state_name] = value;
			var method = (this[ state_ch_h_prefix + state_name] || (this.state_change && this.state_change[state_name]));
			method.call(this, value, old_value, state_name);
		}
	},
	_handleStch: function(original_states, state_name, value, skip_handler, sync_tpl) {
		var stateChanger = !skip_handler && (this[ state_ch_h_prefix + state_name] || (this.state_change && this.state_change[state_name]));
		if (stateChanger) {
			this.zdsv.abortFlowSteps('stch', state_name, true);
		} else {
			return;
		}
		var old_value = this.zdsv.stch_states[state_name];
		if (old_value != value) {
			var method;
			
			if (stateChanger){
				if (typeof stateChanger == 'function'){
					method = stateChanger;
				} else if (this.checkDepVP){
					if (this.checkDepVP(stateChanger)){
						method = stateChanger.fn;
					}
				}
			}

			if (method){
				if (!sync_tpl) {
					var flow_step = this.nextLocalTick(this.proxyStch, [value, old_value, state_name], true);
					flow_step.p_space = 'stch';
					flow_step.p_index_key = state_name;
					this.zdsv.createFlowStepsArray('stch', state_name, flow_step);
				} else {
					this.proxyStch(value, old_value, state_name);
				}
				
				
				//method.call(this, value, old_value);
			}
		}
	},
	_replaceState: function(original_states, state_name, value, stack) {
		if (state_name){
			var old_value = this.states[state_name];
			if (old_value != value){
				//value = value || false;
				//less calculations? (since false and "" and null and undefined now os equeal and do not triggering changes)

				if (!original_states.hasOwnProperty(state_name)) {
					original_states[state_name] = this.states[state_name];
				}
				this.states[state_name] = value;
				stack.push(state_name, value);
			}
		}
	},
	_triggerVipChanges: function(i, state_name, value, zdsv) {
		var vip_name = st_event_name_vip + state_name;
		zdsv.abortFlowSteps('vip_stdch_ev', state_name);


		var vip_cb_cs = this.evcompanion.getMatchedCallbacks(vip_name).matched;
		if (vip_cb_cs.length) {
			var flow_steps = zdsv.createFlowStepsArray('vip_stdch_ev', state_name);
			var event_arg = new PVStateChangeEvent(state_name, value, zdsv.original_states[state_name], this);
			
			//вызов внутреннего для самого объекта события
			this.evcompanion.triggerCallbacks(vip_cb_cs, false, false, vip_name, event_arg, flow_steps);
			markFlowSteps(flow_steps, 'vip_stdch_ev', state_name);
		}
		
	},
	triggerLegacySChEv: function(state_name, value, zdsv, default_cb_cs, default_name, flow_steps) {
		var event_arg = new PVStateChangeEvent(state_name, value, zdsv.original_states[state_name], this);
				//вызов стандартного события
		this.evcompanion.triggerCallbacks(default_cb_cs, false, st_event_opt, default_name, event_arg, flow_steps);
	},
	_triggerStChanges: function(i, state_name, value, zdsv) {

		zdsv.abortFlowSteps('stev', state_name);

		var default_name = st_event_name_default + state_name;
		var light_name = st_event_name_light + state_name;

		var default_cb_cs = this.evcompanion.getMatchedCallbacks(default_name).matched;
		var light_cb_cs = this.evcompanion.getMatchedCallbacks(light_name).matched;
		
		if (light_cb_cs.length || default_cb_cs.length) {
			var flow_steps = zdsv.createFlowStepsArray('stev', state_name);

			if (light_cb_cs.length) {
				this.evcompanion.triggerCallbacks(light_cb_cs, false, false, light_name, value, flow_steps);
			}

			if (default_cb_cs.length) {
				this.triggerLegacySChEv(state_name, value, zdsv, default_cb_cs, default_name, flow_steps);
			}

			if (flow_steps) {
				markFlowSteps(flow_steps, 'stev', state_name);
			}

		}

	

	},
	_setUndetailedState: function(i, state_name, value) {
		this._lbr.undetailed_states[state_name] = value;
	},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var state_name in obj) {
			if (obj.hasOwnProperty(state_name)){
				changes_list.push(state_name, obj[state_name]);
			}
		}
		this._updateProxy(changes_list);
	},
	utils: {
		isDepend: function(obj) {
			return obj && !!obj.count;
		}
	},
	updateState: function(state_name, value, opts){
		/*if (state_name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop state_name: ' + state_name);
		}*/
		if (this.hasComplexStateFn(state_name)){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy([state_name, value], opts);
	},
	hndRDep: function(state, oldstate, state_name) {
		var target_name = state_name.split(':');
		target_name = target_name[ 1 ];
		if (oldstate) {
			oldstate.setStateDependence(target_name, this, false);
		}
		if (state) {
			state.setStateDependence(target_name, this, true);
		}
	},
	setStateDependence: function(state_name, source_id, value) {
		if (typeof source_id == 'object') {
			source_id = source_id._provoda_id;
		}
		var old_value = this.state(state_name) || {index: {}, count: 0};
		old_value.index[source_id] = value ? true: false;

		var count = 0;

		for (var prop in old_value.index) {
			if (!old_value.index.hasOwnProperty(prop)) {
				continue;
			}
			if (old_value.index[prop]) {
				count++;
			}
		}

		this.updateState(state_name, {
			index: old_value.index,
			count: count
		});


	},
	hasComplexStateFn: function(state_name) {
		return this.compx_check[state_name];
	},

	_updateProxy: function(changes_list, opts) {
		if (this._lbr && this._lbr.undetailed_states){
			iterateChList(changes_list, this, this._setUndetailedState);
			return this;
		}

		//порождать события изменившихся состояний (в передлах одного стэка/вызова)
		//для пользователя пока пользователь не перестанет изменять новые состояния
		if (!this.zdsv){
			this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		}
		var zdsv = this.zdsv;


		zdsv.states_changing_stack.push(changes_list, opts);

		if (zdsv.collecting_states_changing){
			return this;
		}

		

		zdsv.collecting_states_changing = true;
		//this.zdsv is important for this!!!
		//this.zdsv.collecting_states_changing - must be semi public;


		var total_ch = zdsv.total_ch;
		var original_states = zdsv.original_states;
		var all_i_cg = zdsv.all_i_cg;
		var all_ch_compxs = zdsv.all_ch_compxs;
		var changed_states = zdsv.changed_states;
		
		while (zdsv.states_changing_stack.length){

			
			

			//spv.cloneObj(original_states, this.states);

			var cur_changes_list = zdsv.states_changing_stack.shift();
			var cur_changes_opts = zdsv.states_changing_stack.shift();

			//получить изменения для состояний, которые изменил пользователь через публичный метод
			this.getChanges(original_states, cur_changes_list, cur_changes_opts, changed_states);
			//var changed_states = ... ↑

			cur_changes_list = cur_changes_opts = null;

			if (this.full_comlxs_index) {
				//проверить комплексные состояния
				var first_compxs_chs = this.getComplexChanges(original_states, changed_states);
				if (first_compxs_chs.length){
					push.apply(all_ch_compxs, first_compxs_chs);
				}

				var current_compx_chs = first_compxs_chs;
				//довести изменения комплексных состояний до самого конца
				while (current_compx_chs.length){
					var cascade_part = this.getComplexChanges(original_states, current_compx_chs);
					current_compx_chs = cascade_part;
					if (cascade_part.length){
						push.apply(all_ch_compxs, cascade_part);
					}
					cascade_part = null;

				}
				current_compx_chs = null;
			}

			

			//собираем все группы изменений
			if (changed_states.length){
				push.apply(all_i_cg, changed_states);
			}
			if (all_ch_compxs && all_ch_compxs.length){
				push.apply(all_i_cg, all_ch_compxs);
			}
			//устраняем измененное дважды и более
			this.compressStatesChanges(all_i_cg);


			
			iterateChList(all_i_cg, this, this._triggerVipChanges, zdsv);

			

			if (all_i_cg.length){
				push.apply(total_ch, all_i_cg);
			}


			wipeObj(original_states);
			all_i_cg.length = changed_states.length = 0;
			if (all_ch_compxs) {
				all_ch_compxs.length = 0;
			}
			
			//объекты используются повторно, ради выиграша в производительности
			//которые заключается в исчезновении пауз на сборку мусора 
		}

		//устраняем измененное дважды и более
		this.compressStatesChanges(total_ch);
		iterateChList(total_ch, this, this._triggerStChanges, zdsv);


		//wipeObj(original_states);
		//all_i_cg.length = all_ch_compxs.length = changed_states.length = 0;

		if (this.sendStatesToMPX && total_ch.length){
			this.sendStatesToMPX(total_ch);
			total_ch.length = 0;
		} else {
			total_ch.length = 0;
		}


		zdsv.collecting_states_changing = false;
		//this.zdsv = null;
		return this;
	},

	getComplexChanges: function(original_states, changes_list) {
		return this.getChanges(original_states, this.checkComplexStates(changes_list));
	},
	getChanges: function(original_states, changes_list, opts, result_arr) {
		var changed_states = result_arr || [];
		var i;
		for (i = 0; i < changes_list.length; i+=2) {
			this._replaceState(original_states, changes_list[i], changes_list[i+1], changed_states);
		}
		if (this.updateTemplatesStates){
			this.updateTemplatesStates(changes_list, opts && opts.sync_tpl);
		}
		for (i = 0; i < changes_list.length; i+=2) {
			this._handleStch(original_states, changes_list[i], changes_list[i+1], opts && opts.skip_handler, opts && opts.sync_tpl);
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
});

var getMDOfReplace = function(){
	return this.md;
};

var si_opts_cache = {};
var SIOpts = function(md) {
	this.map_parent = md;
	this.app = md.app;
};


var getSiOpts = function(md) {
	var provoda_id = md._provoda_id;
	if (!si_opts_cache[provoda_id]) {
		si_opts_cache[provoda_id] = new SIOpts(md);
	}
	return si_opts_cache[provoda_id];
};

var emergency_opt = {
	emergency: true
};

var triggerDestroy = function(md) {
	var array = md.evcompanion.getMatchedCallbacks('die').matched;
	if (array.length) {
		md.evcompanion.triggerCallbacks(array, false, emergency_opt, 'die');
	}
};


var changeSources = function(store, netapi_declr) {
	if (typeof netapi_declr[0] == 'string') {
		store.api_names.push(netapi_declr[0]);
	} else {
		var network_api = netapi_declr[0].call();
		if (!network_api.source_name) {
			throw new Error('no source_name');
		}
		store.sources_names.push(network_api.source_name);
	}
};

var changeSourcesByApiNames = function(md, store) {
	if (!store.api_names_converted) {
		store.api_names_converted = true;
		for (var i = 0; i < store.api_names.length; i++) {
			var api_name = store.api_names[i];
			var network_api;
			if (typeof api_name == 'string') {
				network_api = spv.getTargetField(md.app, api_name);
			} else if (typeof api_name == 'function') {
				network_api = api_name.call(md);
			}
			if (!network_api.source_name) {
				throw new Error('network_api must have source_name!');
			}

			store.sources_names.push(network_api.source_name);
		}
	}
};

var getRightNestingName =function(md, nesting_name) {
	if (md.preview_nesting_source && nesting_name == 'preview_list') {
		nesting_name = md.preview_nesting_source;
	} else if (nesting_name == md.preview_mlist_name){
		nesting_name = md.main_list_name;
	}
	return nesting_name;
};

var models_counters = 1;
provoda.StatesEmitter.extendTo(provoda.Model, function(add) {
add({
	getNonComplexStatesList: function(state_name) {
		if (!this.hasComplexStateFn(state_name)) {
			return state_name;
		} else {
			var result = [];
			for (var i = 0; i < this.compx_check[state_name].depends_on.length; i++) {
				var cur = this.compx_check[state_name].depends_on[i];
				result.push(this.getNonComplexStatesList(cur));
				//
				//Things[i]
			}
			return spv.collapseAll.apply(null, result);
		}
	},
	getNestingSource: function(nesting_name, app) {
		nesting_name = getRightNestingName(this, nesting_name);
		var dclt = this['nest_req-' + nesting_name];
		var network_api = dclt && getNetApiByDeclr(dclt[1], this, app);
		return network_api && network_api.source_name;
	},
	getStateSources: function(state_name, app) {
		var parsed_state = getEncodedState(state_name);
		if (parsed_state && parsed_state.rel_type == 'nesting') {
			return this.getNestingSource(parsed_state.nesting_name, app);
		} else {
			var maps_for_state = getReqMapsForState(this.req_map, state_name);
			if (maps_for_state) {
				var result = new Array(maps_for_state.length/2);
				for (var i = 0; i < maps_for_state.length; i+=2) {
					var selected_map = maps_for_state[ i + 1 ];
					var network_api = getNetApiByDeclr(selected_map[2], this, app);
					result[i/2] = network_api.source_name;
				}
				return result;
			}
		}


		
	},
	collectStateChangeHandlers: function(props) {
		var need_recalc = false;
		if (this.hasOwnProperty('state_change')){
			need_recalc = true;
		} else {
			need_recalc = hasPrefixedProps(props, 'stch-');

		}
		if (!need_recalc){
			return;
		}
		this._has_stchs = true;
	},
	collectNestingsDeclarations: function(props) {
		var
			has_props = hasPrefixedProps(props, 'nest-'),
			has_pack = this.hasOwnProperty('nest'),
			prop, cur, real_name;

		if (has_props || has_pack){
			var result = [];

			var used_props = {};

			if (has_props) {
				for (prop in this) {
					if (prop.indexOf('nest-') === 0) {

						real_name = prop.replace('nest-','');
						cur = this[prop];
						used_props[real_name] = true;
						result.push({
							nesting_name: real_name,
							subpages_names_list: cur[0],
							preload: cur[1],
							init_state_name: cur[2]
						});
					}
				}
			}

			if (has_pack) {
				for (real_name in this.nest) {
					if (used_props[real_name]) {
						continue;
					}
					cur = this.nest[real_name];
					used_props[real_name] = true;
					result.push({
						nesting_name: real_name,
						subpages_names_list: cur[0],
						preload: cur[1],
						init_state_name: cur[2]
					});
				}
			}
			
			this.nestings_declarations = result;
			
		}
		
		

	},
	changeDataMorphDeclarations: function(props) {
		var i, cur;


		var has_changes = false;

		if (props.hasOwnProperty('req_map')) {
			this.netsources_of_states = {
				api_names: [],
				api_names_converted: false,
				sources_names: []
			};
			has_changes = true;
			for (i = 0; i < props.req_map.length; i++) {
				cur = props.req_map[i][1];
				if (typeof cur != 'function') {
					props.req_map[i][1] = spv.mmap( cur );
				}
				changeSources(this.netsources_of_states, props.req_map[i][2]);
				
			}

		}

		var has_reqnest_decls = hasPrefixedProps(props, 'nest_req-');

		if (has_reqnest_decls) {
			this.has_reqnest_decls = true;
			this.netsources_of_nestings = {
				api_names: [],
				api_names_converted: false,
				sources_names: []
			};
			has_changes = true;
			for (var prop_name in props) {
				if (props.hasOwnProperty(prop_name) && prop_name.indexOf('nest_req-') === 0) {
					cur = props[ prop_name ];
					if (typeof cur[0][0] != 'function') {
						cur[0][0] = spv.mmap(cur[0][0]);
					}
					if (cur[0][1] && cur[0][1] !== true && typeof cur[0][1] != 'function') {
						cur[0][1] = spv.mmap(cur[0][1]);
					}
					var array = cur[0][2];
					if (array) {
						for (i = 0; i < array.length; i++) {
							var spec_cur = array[i];
							if (typeof spec_cur[1] != 'function') {
								spec_cur[1] = spv.mmap(spec_cur[1]);
							}
						}
					}
					changeSources(this.netsources_of_nestings, cur[1]);
					
				}
			}
		}
		if (has_changes) {
			this.netsources_of_all = {
				nestings: this.netsources_of_nestings,
				states: this.netsources_of_states
			};
		}
	},
	getNetworkSources: function() {
		if (!this.netsources_of_all) {
			return;
		}
		if (!this.netsources_of_all.done) {
			this.netsources_of_all.done = true;
			this.netsources_of_all.full_list = [];

			if (this.netsources_of_all.nestings) {
				changeSourcesByApiNames(this, this.netsources_of_all.nestings);
				push.apply(this.netsources_of_all.full_list, this.netsources_of_all.nestings.sources_names);
			}

			if (this.netsources_of_all.states) {
				changeSourcesByApiNames(this, this.netsources_of_all.states);
				push.apply(this.netsources_of_all.full_list, this.netsources_of_all.states.sources_names);
			}
		}

		return this.netsources_of_all.full_list;
	},
	'regfr-childchev': {
		test: function(namespace) {
			return namespace.indexOf('child_change-') === 0;
		},
		fn: function(namespace) {
			var nesting_name = namespace.replace('child_change-', '');
			var child = this.getNesting(nesting_name);
			if (child){
				return {
					value: child,
					target: this,
					nesting_name: nesting_name
				};
			}
		},
		getWrapper: function() {
			return hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return namespace.replace('child_change-', '');
		},
		handleFlowStep: stackNestingFlowStep
	},
	getStrucRoot: function() {
		return this.app;
	},
	getStrucParent: function() {
		return this.map_parent;
	},
	getSiOpts: function() {
		return getSiOpts(this);
	},
	initSi: function(Constr, data, params) {
		var instance = new Constr();
		var initsbi_opts = this.getSiOpts();
		
		this.useMotivator(instance, function(instance) {
			instance.init(initsbi_opts, data, params);
		});

		return instance;
	},
	init: function(opts){
		if (opts && opts.app){
			this.app = opts.app;
		}
		if (!this.app) {
			this.app = null;
		}
		if (opts && opts.map_parent){
			this.map_parent = opts.map_parent;
		}
		if (!this.map_parent) {
			this.map_parent = null;
		}

		this._super();

		this.req_order_field = null;

		this._provoda_id = models_counters++;
		big_index[this._provoda_id] = this;

		this.states = {};
		
		this.children_models = null;
		this._network_source = this._network_source || null;


		this.md_replacer = null;
		this.mpx = null;

		//
		
		this.prsStCon.connect.parent(this);
		this.prsStCon.connect.root(this);
		this.prsStCon.connect.nesting(this);



		if (this.nestings_declarations) {
			this.nextTick(function() {
				initDeclaredNestings(this);
			});
		}

		return this;
	},
	getConstrByPathTemplate: function(app, path_template) {
		return initDeclaredNestings.getConstrByPath(app, this, path_template);
	},
	connectMPX: function() {
		if (!this.mpx) {
			this.mpx = new MDProxy(this._provoda_id, this.states, this.children_models, this);
		}
		return this.mpx;
	},

	getReqsOrderField: function() {
		if (!this.req_order_field) {
			this.req_order_field = ['mdata', 'm', this._provoda_id, 'order'];
		}
		return this.req_order_field;
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
		triggerDestroy(this);
		big_index[this._provoda_id] = null;
		return this;
	}
});



var passCollectionsChange = function(e) {
	this.setItems(e.value, e.target.current_motivator);
};

add({
	watchChildrenStates: function(collection_name, state_name, callback) {
		//
		var items_events = new ItemsEvents('state_change-' + state_name, this, callback);
		this.on('child_change-' + collection_name, passCollectionsChange, null, items_events);
	},
	archivateChildrenStates: function(collection_name, collection_state, statesCalcFunc, result_state_name) {
		var archiver = new StatesArchiver(collection_state, result_state_name || collection_state, this, statesCalcFunc);
		this.on('child_change-' + collection_name, passCollectionsChange, null, archiver);
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
		return this.children_models && this.children_models[collection_name];
	},

	updateNesting: function(collection_name, array, opts, spec_data) {
		if (collection_name.indexOf('.') != -1){
			throw new Error('remove "." (dot) from name');
		}

		var zdsv = this.zdsv;
		if (zdsv) {
			zdsv.abortFlowSteps('collch', collection_name);
		}

		if (Array.isArray(array)){
			array = array.slice(0);
		}
		if (!this.children_models) {
			this.children_models = {};
		}

		var old_value = this.children_models[collection_name];
		this.children_models[collection_name] = array;
		// !?
		
		

		var full_ev_name = 'child_change-' + collection_name;

		var chch_cb_cs = this.evcompanion.getMatchedCallbacks(full_ev_name).matched;
		
		if (chch_cb_cs.length) {
			if (!this.zdsv) {
				this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
				//debugger;
			}
			zdsv = this.zdsv;
			var flow_steps = zdsv.createFlowStepsArray('collch', collection_name);
			

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
			//this.trigger(full_ev_name, event_obj);

			this.evcompanion.triggerCallbacks(chch_cb_cs, false, false, full_ev_name, event_obj, flow_steps);

			markFlowSteps(flow_steps, 'collch', collection_name);

		}










		if (!opts || !opts.skip_report){
			var removed = provoda.getRemovedNestingItems(array, old_value);
			this.sendCollectionChange(collection_name, array, old_value, removed);
		}

		return this;
	},
	sendCollectionChange: function(collection_name, array, old_value, removed) {
		//this.removeDeadViews();
		sync_sender.pushNesting(this, collection_name, array, old_value, removed);
		views_proxies.pushNesting(this, collection_name, array, old_value, removed);
		if (this.mpx) {
			this.mpx.sendCollectionChange(collection_name, array, old_value, removed);
		}
	},
	complex_st_prefix: 'compx-',

	sendStatesToMPX: function(states_list) {
		//this.removeDeadViews();
		var dubl = states_list.slice();
		sync_sender.pushStates(this, dubl);
		views_proxies.pushStates(this, dubl);
		if (this.mpx) {
			this.mpx.stackReceivedStates(dubl);
		}
		//
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
		this._super.apply(this, arguments);
	},
	mapStates: function(states_map, donor, acceptor) {
		if (acceptor && typeof acceptor == 'boolean'){
			acceptor = this.init_states;
		}
		return spv.mapProps(states_map, donor, acceptor);
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
			for (i = cur.children_by_selector.length - 1; i >= 0; i--) {
				all_items.push( cur, cur.children_by_selector[i] );
			}
		}
		
		if (cur.children_by_anchor) {
			for (i = cur.children_by_anchor.length - 1; i >= 0; i--) {
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
var $v = {
	getViewLocationId: function(parent_view, nesting_name, nesting_space) {
		if (!nesting_name) {
			throw new Error('no nesting_name');
		}
		/*
		помогает определить есть ли у модели вьюха, ассоциированная с локацией - с родительской вьюхой (а также с гнездом внутри родительской вьюхи) 

		*/
		return parent_view.view_id + ':' +  nesting_space + ':' + nesting_name;
	}
};
provoda.$v = $v;


var ViewLabour = function() {
	this.has_details = null;
	this._detailed = null;
	this.dettree_incomplete = null;
	this.detltree_depth = null;
	this._states_set_processing = null;
	this._collections_set_processing = null;
	this.dclrs_fpckgs_is_clonned = false;
	this.innesting_pos_current = null;
	this.innest_prev_view = null;
	this.innest_next_view = null;

	this.demensions_key_start = null;

	this.handled_expandable_dclrs = null;

	this._anchor = null;
	//this.innesting_pos_old = null;

	this.detached = null;

	this.hndTriggerTPLevents = null;

	this.marked_as_dead = null;


	this.undetailed_states = {};
	this.undetailed_children_models = {};
};

var views_counter = 1;
var way_points_counter = 0;
provoda.StatesEmitter.extendTo(provoda.View, {
	init: function(view_otps, opts){
		this._lbr = new ViewLabour();
		
		this.req_order_field = null;
		this.tpl = null;
		this.c = null;

		this.dead = null;
		this.pv_view_node = null;
		this.dclrs_fpckgs = this.dclrs_fpckgs;
		this.base_skeleton = null;

		this.nesting_space = view_otps.nesting_space;
		this.nesting_name = view_otps.nesting_name;

		if (this.base_tree_list) {
			this.base_skeleton = getBaseTreeSkeleton(this.base_tree_list);
		}

		

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
		
		this.way_points = [];
		this.dom_related_props = null;
		if (this.dom_rp){
			this.dom_related_props = [];
		}

		spv.cloneObj(this._lbr.undetailed_states, this.mpx.states);
		spv.cloneObj(this._lbr.undetailed_states, this.mpx.vstates);
		spv.cloneObj(this._lbr.undetailed_children_models, this.mpx.nestings);


		if (this.base_tree_expand_states) {
			for (var i = 0; i < this.base_tree_expand_states.length; i++) {
				this.on('state_change-' + this.base_tree_expand_states[i], this.hndExpandViewTree);
			}
		}

		
		
		this.prsStCon.connect.parent(this);
		this.prsStCon.connect.root(this);
		return this;


	},
	'stch-map_slice_view_sources': function(state) {
		if (state) {
			if (this.parent_view == this.root_view && this.nesting_name == 'map_slice') {
				var arr = [];
				if (state[0]) {
					arr.push(state[0]);
				}
				push.apply(arr, state[1][this.nesting_space]);
				this.updateState('view_sources', arr);
			}
			
		}
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
		if (!this._lbr.demensions_key_start){
			var arr = [];
			var cur = this;
			while (cur.parent_view) {
				arr.push(cur.location_name);

				cur = cur.parent_view;
			}
			arr.reverse();
			this._lbr.demensions_key_start = arr.join(' ');

			//this._lbr.demensions_key_start = this.location_name + '-' + (this.parent_view && this.parent_view.location_name + '-');
		}
	},
	getBoxDemensionKey: function() {
		var args = new Array(arguments.length); //optimization
		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
			
		}
		this.checkDemensionsKeyStart();
		return this._lbr.demensions_key_start.concat(args.join('-'));

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
		if (!this.req_order_field){
			this.req_order_field = ['mdata', 'v', this.view_id, 'order'];
		}
		return this.req_order_field;
	},
	getStoredMpx: function(md) {
		if (md.stream) {
			return md.mpx;
		} else {
			return views_proxies.getMPX(this.root_view.proxies_space, md);
		}
		//
		
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
		return new PvTemplate({
			node: node,
			callCallbacks: callCallbacks,
			pvTypesChange: pvTypesChange,
			struc_store: this.root_view.struc_store,
			calls_flow: this._getCallsFlow(),
			getSample: this.root_view.getSampleForTemplate
		});
	},
	parseAppendedTPLPart: function(node) {
		this.tpl.parseAppended(node, this.root_view.struc_store);
		this.tpl.setStates(this.states);
	},
	createTemplate: function(ext_node) {
		var con = ext_node || this.c;
		if (!con){
			throw new Error('cant create template');
		}
		var _this = this;


		if (!this._lbr.hndTriggerTPLevents) {
			this._lbr.hndTriggerTPLevents = function(e) {
				var cb_data = e.callback_data;



				for (var i = 0; i < cb_data.length; i++) {
					var cur = cb_data[i];
					if (typeof cur == 'function') {
						cb_data[i] = cur(e.scope || this.states);
					}
				}

				if (!cb_data[0] && cb_data[1]){
					var target_view;
					//var view =
					
					if (cb_data[1].indexOf('#') === 0) {
						target_view = _this.root_view;
						cb_data[1] = cb_data[1].replace('#', '');
					} else {
						target_view = _this;
					}
					if (cb_data[2]) {
						var stringed_variable = cb_data[2].match(/\%(.*?)\%/);
						if (stringed_variable) {
							cb_data[2] = spv.getTargetField(e.node, stringed_variable[1]);
						}
					}

					cb_data.shift();
					target_view.RPCLegacy.apply(target_view, cb_data);
				} else {
					if (!e.pv_repeat_context){
						_this.tpl_events[e.callback_name].call(_this, e.event, e.node, cb_data);
					} else {
						_this.tpl_r_events[e.pv_repeat_context][e.callback_name].call(_this, e.event, e.node, e.scope);
					}
				}
				
			};
		}


		var tpl = this.getTemplate(con, this._lbr.hndTriggerTPLevents, function(arr_arr) {
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
		if (!ext_node) {
			this.tpl = tpl;
		}

		return tpl;
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
		if (!this.isAlive()) {
			return;
		}
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
		var udchm = this._lbr.undetailed_children_models;
		this._lbr.undetailed_children_models = null;
		this.setMdChildren(udchm);

	},
	connectStates: function() {
		var states = this._lbr.undetailed_states;
		this._lbr.undetailed_states = null;
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
		if (!this._lbr.has_details){
			this._lbr.has_details = true;
			this.createDetails();
		}
	},
	requestDetailes: function(){
		this.requestDetailesCreating();
		this._lbr._detailed = true;
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
		var anchor = this._lbr._anchor;
		if (con && anchor && anchor.parentNode){
			$(anchor).after(con);
			//anchor.parentNode.insertBefore(con[0], anchor.nextSibling);
			this._lbr._anchor = null;
			$(anchor).detach();
			this.setVisState('con_appended', true);
		} else if (con && con.parent()[0]){
			this.setVisState('con_appended', true);

		}
	},

	getFreeCV: function(child_name, view_space, opts) {
		var md = this.getMdChild(child_name);
		if (md){
			var view = this.getFreeChildView({
				by_model_name: false,
				nesting_name: child_name,
				nesting_space: view_space
			}, md, opts);
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
	getAncestorByRooViCon: function(view_space, strict) { //находит родительскую вьюху соеденённую с корневой вьюхой
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
					if ( this.root_view.matchCildrenView( cur_ancestor, view_space, 'map_slice' ) ) {
						target_ancestor = cur_ancestor;
						break;
					}

				}
			}

			cur_ancestor = cur_ancestor.parent_view;
		}
		return target_ancestor;
	},
	findMpxViewInChildren: function(mpx, nesting_space, nesting_name) {
		nesting_space = nesting_space || 'main';
		var i;
		var views = mpx.getViews();


		var children = [];

		for (i = 0; i < this.children.length; i++) {
			var cur = this.children[i];
			if (cur.nesting_space != nesting_space) {
				continue;
			}
			if (nesting_name && cur.nesting_name != nesting_name) {
				continue;
			}
			children.push(cur);
		}


		for (i = 0; i < views.length; i++) {
			if (children.indexOf(views[i]) != -1) {
				return views[i];
			}
		}
	},
	matchCildrenView: function(target_view, nesting_space, nesting_name) {
		nesting_space = nesting_space || 'main';
		for (var i = 0; i < this.children.length; i++) {
			var cur = this.children[i];
			if (cur != target_view) {
				continue;
			}
			if (nesting_space && cur.nesting_space != nesting_space) {
				continue;
			}
			if (nesting_name && cur.nesting_name != nesting_name) {
				continue;
			}
			return true;
			
		}
		return false;
	},
	getFreeChildView: function(address_opts, md, opts) {
		var mpx = this.getStoredMpx(md);
		var
			child_name = address_opts.nesting_name,
			view_space = address_opts.nesting_space || 'main',
			location_id = $v.getViewLocationId(this, address_opts.nesting_name, view_space),
			view = mpx.getView(location_id);

		if (view){
			return false;
		} else {

			var ConstrObj;
			if (address_opts.by_model_name) {

				ConstrObj = this.children_views_by_mn &&
					(this.children_views_by_mn[address_opts.nesting_name][md.model_name] ||
					this.children_views_by_mn[address_opts.nesting_name]['$default']);
				
			} else {
				ConstrObj = this.children_views[address_opts.nesting_name];
			}

			
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
				throw new Error('there is no View for ' + address_opts.nesting_name);
			}

			view = new Constr();

			if (this.used_data_structure) {

				var field_path = address_opts.by_model_name ? ['children_by_mn', child_name, md.model_name, view_space] : ['children', child_name, view_space];
				//$default must be used too
				var sub_tree = this.used_data_structure.constr_children && spv.getTargetField(this.used_data_structure.constr_children, field_path);

				if (!sub_tree) {
					sub_tree = this.used_data_structure.tree_children && spv.getTargetField(this.used_data_structure.tree_children, field_path);
				}
				if (!sub_tree) {
					//debugger;
				}

				view.used_data_structure = sub_tree;
			}


			view.init({
				mpx: mpx,
				parent_view: this,
				root_view: this.root_view,
				location_name: child_name + '-' + view_space,
				nesting_space: view_space,
				nesting_name: child_name
			}, opts);
			mpx.addView(view, location_id);
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
	addChildView: function(view) {
		this.children.push.call(this.children, view);
		//fixme - possible memory leak when child is dead (this.children) 
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
		var i = 0;
		if (this.proxies_space) {
			views_proxies.removeSpaceById(this.proxies_space);
		}
		stackEmergency(this.remove, this, [this.getC(), this._lbr._anchor]);
		this.dead = true; //new DeathMarker();
		this.stopRequests();

		triggerDestroy(this);
		if (!skip_md_call){
			this.mpx.removeDeadViews();
		}

		this.c = null;

		if (this.base_skeleton) {
			for (i = 0; i < this.base_skeleton.length; i++) {
				$(this.base_skeleton[i].node);
			}
			this.base_skeleton = null;
		}


		this._lbr._anchor = null;
		if (this.tpl) {
			this.tpl.destroy();
			this.tpl = null;
		}
		
		if (this.tpls){
			for (i = 0; i < this.tpls.length; i++) {
				this.tpls[i].destroy();
			}
			this.tpls = null;
		}
		this.way_points = null;

		if (this.wp_box){
			this.wp_box = null;
		}
		if (this.pv_view_node){
			this.pv_view_node = null;
		}
		

		
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
			anchor = this._lbr._anchor;
		}
		if (anchor){
			$(anchor).remove();
		}

	},
	die: function(opts){
		if (!this._lbr.marked_as_dead){
			$(this.getC()).remove();
			this.markAsDead(opts && opts.skip_md_call);
			this._lbr.marked_as_dead = true;
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
		return this._lbr._anchor || (this._lbr._anchor = document.createComment(''));

		//document.createTextNode('')
	},
	requestAll: function(){
		return this.requestDeepDetLevels();
	},
	__tickDetRequest: function() {
		if (!this.isAlive()){
			return;
		}
		this._lbr.dettree_incomplete = this.requestDetalizationLevel(this._lbr.detltree_depth);
		this._lbr.detltree_depth++;
		if (this._lbr.dettree_incomplete){
			this.nextLocalTick(this.__tickDetRequest);
		}
	},
	requestDeepDetLevels: function(){
		if (this._lbr._states_set_processing || this._lbr._collections_set_processing){
			return this;
		}
		//iterate TREE
		this._lbr.detltree_depth = 1;
		this._lbr.dettree_incomplete = true;



		this.nextLocalTick(this.__tickDetRequest);
		
		return this;
	},
	softRequestChildrenDetLev: function(rel_depth) {
		if (this._lbr._states_set_processing || this._lbr._collections_set_processing){
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
		if (!this._lbr._detailed){
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
		this._lbr._states_set_processing = true;
		//disallow chilren request untill all states will be setted

		this.states = {};
		//var _this = this;


		//var complex_states = [];


		var states_list = [];

		for (var name in states){
			states_list.push(name, states[name]);
		}

		this._updateProxy(states_list);
		this._lbr._states_set_processing = null;
		return this;
	},
	updateTemplatesStates: function(total_ch, sync_tpl) {
		var i = 0;
		//var states = this.states;

		if (this.tpl){
			this.tpl.checkChanges(total_ch, this.states, !sync_tpl, !sync_tpl && this.current_motivator);
		}
		if (this.tpls){
			for (i = 0; i < this.tpls.length; i++) {
				this.tpls[i].checkChanges(total_ch, this.states, !sync_tpl, !sync_tpl && this.current_motivator);
			}
		}
	},
	requireAllParts: function() {
		for (var a in this.parts_builder){
			this.requirePart(a);
		}
		return this;
	},
	getPart: function(part_name) {
		return this.view_parts && this.view_parts[part_name];
	},
	collectStateChangeHandlers: function(props) {
		var need_recalc = false, prop;
		if (this.hasOwnProperty('state_change')){
			need_recalc = true;
		} else {
			need_recalc = hasPrefixedProps(props, 'stch-');

		}
		if (!need_recalc){
			return;
		}
		this._has_stchs = true;

		var has_stchh = {};
		var result = [];

		this.stch_hs_list = [];
		

		for (prop in this) {
			if (prop.indexOf('stch-') === 0){
				var real_name = prop.replace('stch-','');
				has_stchh[real_name] = true;
				result.push({
					name: real_name,
					item: this[prop]
				});

				this.stch_hs_list.push(real_name);
			}
		}

		if (this.state_change){
			for (prop in this.state_change) {
				if (!has_stchh[prop]){
					has_stchh[prop] = true;
					result.push({
						name: prop,
						item: this.state_change[prop]
					});

					this.stch_hs_list.push(prop);
				}

			}
		}

		this.stch_hs = result;
	},
	requirePart: function(part_name) {
		if (!this.isAlive()){
			return $();
		}
		if (this.view_parts && this.view_parts[part_name]){
			return this.view_parts[part_name];
		} else {
			if (!this.view_parts){
				this.view_parts = {};
			}

			var parts_builder = this.parts_builder[part_name];

			var part = typeof parts_builder == 'string' ? this.root_view.getSample(parts_builder) : parts_builder.call(this);


			this.view_parts[part_name] = part;
			if (!this.view_parts[part_name]){
				throw new Error('"return" me some build result please');
			}

			for (var i = 0; i < this.stch_hs.length; i++) {
				var cur = this.stch_hs[i];
				if (this.states.hasOwnProperty(cur.name) && typeof cur.item != 'function'){
					if (this.checkDepVP(cur.item, part_name)){
						cur.item.fn.call(this, this.states[cur.name]);
					}
				}
				
			}
			return this.view_parts[part_name];
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
	stackReceivedChanges: function() {
		if (!this.isAlive()){
			return;
		}
		this.nextTick(this._updateProxy, arguments);
	},
	receiveStatesChanges: function(changes_list, opts) {
		if (!this.isAlive()){
			return;
		}
		this._updateProxy(changes_list, opts);
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
		this._lbr._collections_set_processing = true;
		//вью только что создана, присоединяем подчинённые views без деталей (детали создаются позже)
		for (var i in collections) {
			this.collectionChange(i, collections[i]);
		}
		this._lbr._collections_set_processing = null;
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
					by_model_name: false,
					nesting_name: this.nesname,
					nesting_space: this.space_name,
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
					by_model_name: true,
					nesting_name: this.nesname,
					nesting_space: this.space_name,
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
			nesname: nesname,
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
			nesname: nesname,
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

		if (!this._lbr.dclrs_fpckgs_is_clonned){
			this._lbr.dclrs_fpckgs_is_clonned = true;
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
	stackCollectionChange: function() {
		this.nextTick(this.collectionChange, arguments);
	},
	collectionChange: function(nesname, array, rold_value, removed) {
		if (!this.isAlive()){
			return;
		}
		if (this._lbr.undetailed_children_models){
			this._lbr.undetailed_children_models[nesname] = array;
			return this;
		}

		var old_value = this.children_models[nesname];
		this.children_models[nesname] = array;

		var pv_views_complex_index = spv.getTargetField(this, this.tpl_children_prefix + nesname);
		if (pv_views_complex_index){
			var space_name;
			array = spv.toRealArray(array);
			for (space_name in pv_views_complex_index.usual){
				this.removeViewsByMds(removed, nesname, space_name);
			}
			for (space_name in pv_views_complex_index.by_model_name){
				this.removeViewsByMds(removed, nesname, space_name);
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

		this.checkDeadChildren();
		return this;
	},
	removeViewsByMds: function(array, nesname, space) {
		if (!array){
			return;
		}
		var location_id = $v.getViewLocationId(this, nesname, space || 'main');
		for (var i = 0; i < array.length; i++) {

			var view = this.getStoredMpx(array[i]).getView(location_id);
			if (view){
				view.die();
			} else {
				//throw 'wrong';
			}
		}
	},
	changeChildrenViewsDeclarations: function(props) {
		var nesting_name, cur;
		if (props.children_views) {
			for (nesting_name in this.children_views) {
				cur = this.children_views[nesting_name];
				if (typeof cur == 'function') {
					this.children_views[nesting_name] = {
						main: cur
					};
				}
			}
		}
		if (props.children_views_by_mn) {
			for (nesting_name in this.children_views_by_mn) {
				for (var model_name in this.children_views_by_mn[nesting_name]) {
					cur = this.children_views_by_mn[nesting_name][model_name];
					if (typeof cur == 'function') {
						this.children_views_by_mn[nesting_name][model_name] = {
							main: cur
						};
					}
				}
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
				this.removeViewsByMds(removed, nesname, declr.space);
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

		var is_wrapper_parent = collch.is_wrapper_parent &&  collch.is_wrapper_parent.match(/^\^+/gi);
		return {
			place: collch.place,
			by_model_name: collch.by_model_name,
			space: collch.space || 'main',
			strict: collch.strict,
			is_wrapper_parent: is_wrapper_parent && is_wrapper_parent[0].length,
			opts: collch.opts,
			needs_expand_state: expand_state || null
		};
	},
	simpleAppendNestingViews: function(declr, opts, nesname, array) {
		for (var bb = 0; bb < array.length; bb++) {
			var cur = array[bb];
			var original_md;
			if (declr.is_wrapper_parent) {
				original_md = cur;
				for (var i = 0; i < declr.is_wrapper_parent; i++) {
					cur = cur.getParentMapModel();
				}
			}


			this.appendFVAncorByVN({
				md: cur,
				original_md: original_md,
				by_model_name: declr.by_model_name,
				name: nesname,
				opts: (typeof opts == 'function' ? opts.call(this, cur, original_md) : opts),
				place: declr.place,
				space: declr.space,
				strict: declr.strict
			});
		}

	},
	getPrevView: function(array, start_index, location_id, view_itself) {
		

		var i = start_index - 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i >= 0; i--) {
			var view = this.getStoredMpx(array[i]).getView(location_id);
			var dom_hook = view && !view._lbr.detached && view.getT();
			if (dom_hook){
				if (view_itself){
					return view;
				} else {
					return dom_hook;
				}
			}

		}
	},
	getNextView: function(array, start_index, location_id, view_itself) {
		var i = start_index + 1;
		if (i >= array.length || i < 0){
			return;
		}
		for (; i < array.length; i++) {
			var view = this.getStoredMpx(array[i]).getView(location_id);
			var dom_hook = view && !view._lbr.detached && view.getT();
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
				by_model_name: this.by_model_name,
				nesting_name: this.nesname,
				nesting_space: this.space
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
		var location_id = $v.getViewLocationId(this, nesname, space || 'main');

		

		var ordered_rend_list = this.getRendOrderedNesting(nesname, array);
		if (ordered_rend_list){
			this.appendOrderedCollection(space, funcs, view_opts, array, not_request, ordered_rend_list);
		} else {
			this.appendOrderedCollection(space, funcs, view_opts, array, not_request);
		}



		//исправляем порядковый номер вьюхи в нэстинге
		var counter = 0;
		for (var i = 0; i < array.length; i++) {
			var view = this.getStoredMpx(array[i]).getView(location_id);
			if (view) {
				view._lbr.innesting_pos_current = counter;

				var $first = counter === 0;
				var $last = counter === (array.length - 1);

				view.updateState('$index', counter);
				view.updateState('$first', $first);
				view.updateState('$last', $last);
				view.updateState('$middle', !($first || $last));

				counter++;
			}
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

		var location_id = $v.getViewLocationId(this, funcs.nesname, space || 'main');
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
					if (this.getStoredMpx(ordered_part[i]).getView(location_id)){
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
			view = this.getStoredMpx(cur).getView(location_id);
			if (view){
				prev_view = this.getPrevView(array, i, location_id, true);
				if (prev_view){
					var current_node = view.getT();
					var prev_node = prev_view.getT();
					if (!current_node.prev().is(prev_node)){
						var parent_node = current_node[0] && current_node[0].parentNode;
						if (parent_node){
							parent_node.removeChild(current_node[0]);
						}
						view.setVisState('con_appended', false);

						view._lbr.detached = true;
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
			view = this.getStoredMpx(cur).getView(location_id);
			if (view && !view._lbr.detached){
				continue;
			}
			if (!view && ordered_part && ordered_part.indexOf(cur) == -1){
				continue;
			}
			prev_view = this.getPrevView(array, i, location_id, true);

			if (prev_view && prev_view.state('vis_con_appended')) {
				append_list.push(cur, this.createDOMComplect(complects, ordered_complects, prev_view, 'after'));
			} else {
				next_view = this.getNextView(array, i, location_id, true);
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

			view = this.getStoredMpx(cur).getView(location_id);
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
		if (!this._lbr._collections_set_processing){
			for (i = array.length - 1; i >= 0; i--) {
				view = this.getStoredMpx(array[i]).getView(location_id);
				if (view){
					view.requestDetailesCreating();
				}
			}
			if (!not_request){
				//this._lbr._collections_set_processing
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
			detached[i]._lbr.detached = null;
		}
		if (ordered_part && ordered_part.length){
			this.nextLocalTick(this.appendOrderedCollection, [space, funcs, view_opts, array, not_request, ordered_rend_list]);
			//fixme can be bug (если nesting изменён, то измнения могут конфликтовать)
		}


		for (i = 0; i < array.length; i++) {
			view = this.getStoredMpx(array[i]).getView(location_id);
			if (view){
				view._lbr.innest_prev_view = this.getPrevView(array, i, location_id, true);
				view._lbr.innest_next_view = this.getNextView(array, i, location_id, true);
				
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
	},
	appendFVAncorByVN: function(opts) {
		var view = this.getFreeChildView({
			by_model_name: opts.by_model_name,
			nesting_name: opts.name,
			nesting_space: opts.space
		}, opts.md, opts.opts);
		var place = opts.place;
		if (place && typeof opts.place == 'function'){
			if ((opts.strict || view) && place){
				place = opts.place.call(this, opts.md, view, opts.original_md);
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

provoda.BaseRootView = function BaseRootView () {};
provoda.View.extendTo(provoda.BaseRootView, {
	_getCallsFlow: function() {
		return this.calls_flow;
	},
	init: function(opts, vopts) {
		this.calls_flow = new provoda.CallbacksFlow(spv.getDefaultView(vopts.d), !vopts.usual_flow, 250);
		return this._super.apply(this, arguments);
	},
	remove: function() {
		this.calls_flow = null;
	}
});


if ( typeof window === "object" && typeof window.document === "object" ) {
	window.provoda = provoda;
}
return provoda;
});