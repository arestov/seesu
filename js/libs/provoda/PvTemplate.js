define(function(require) {
"use strict";

var spv = require('spv');
var angbo = require('angbo');
var $ = require('jquery');
var parser = require('./pvTemplate/parser');
var PvSimpleSampler = require('./pvTemplate/PvSimpleSampler');
var parseEasy = require('./pvTemplate/parseEasy');

var push = Array.prototype.push;
var addEvent = spv.addEvent;
var removeEvent = spv.removeEvent;

/*

<!--
<div pv-import="imp-area_for_button">
	<script type="pv-import-map">
		[
			{
				"imp-desc_item": "imp-desc_item-tag"
			},
		  {
		    "nav_title": "nav_title"
		  },
		  {
		    "previews": [
		      [{
		        "title": "full_title"
		      }],
		      "songs"
		    ]
		  }
		]
	</script>
</div>
-->
*/

var makeSpecStatesList = function(states) {
	var result = [];
	for (var state_name in states) {
		if (!states.hasOwnProperty(state_name)){
			continue;
		}
		result.push(true, state_name, states[state_name]);
	}
	return result;
};
var PvTemplate = function(opts) {
	this.pv_types_collecting = false;
	this.states_inited = false;
	this.waypoints = null;


	//this.pv_views = null;
	//this.parsed_pv_views = null;

	this.stwat_index = null;
	this.all_chunks = [];

	this.root_node = opts.node;

	this.root_node_raw = 'nodeType' in this.root_node ? this.root_node : this.root_node[0];
	this.pv_repeat_context = null;
	if (opts.pv_repeat_context){
		this.pv_repeat_context = opts.pv_repeat_context;
	}

	this.calls_flow = opts.calls_flow || null;
	if (!this.calls_flow) {
		//debugger;
	}
	this.calls_flow_index = this.calls_flow ? {} : null;
	this.scope = null;
	if (opts.scope){
		this.scope = opts.scope;
	}
	this.spec_states_props_list = null;
	if (opts.spec_states){
		this.spec_states_props_list = makeSpecStatesList(opts.spec_states);
		//spec_states
	}
	if (opts.callCallbacks){
		this.sendCallback = opts.callCallbacks;
	}
	this.pvTypesChange = opts.pvTypesChange;
	this.pvTreeChange = opts.pvTreeChange;
	this.struc_store = opts.struc_store;
	this.ancs = null;
	//this.pv_views = [];
	//this.parsed_pv_views = [];
	this.pv_repeats = null;
	this.children_templates = null;

	this.data_limitations = opts.data_limitations;

	this.states_watchers = [];
	this.stwat_index = {};
	this.pv_types = null;
	this.pv_repeats_data = null;
	this.destroyers = null;

	this.getSample = opts.getSample;

	this.pv_types_collecting = true;
	this.parsePvDirectives(this.root_node, opts.struc_store);
	if (!angbo || !angbo.interpolateExpressions){
		console.log('cant parse statements');
	}

	// if (this.pv_replacers_simple) {
	// 	for (var i = 0; i < this.pv_replacers_simple.length; i++) {
	// 		var cur = this.pv_replacers_simple[i];
	// 		var sample = this.getSample(cur.sample_name);
	// 		$(cur.node).after(sample);
	// 		this.parsePvDirectives(sample, opts.struc_store);


	// 	}
	// }

	if (this.scope){
		this.setStates(this.scope);
	}
	this.pv_types_collecting = false;
	if (this.pv_types) {
		this._pvTypesChange();
	}


};


var appendSpace = function() {
	//fixme
	//$(target).append(document.createTextNode(' '));
};


var abortFlowStep = function(tpl, w_cache_key) {
	var flow_step = tpl.calls_flow_index[w_cache_key];
	if (flow_step) {
		tpl.calls_flow_index[w_cache_key] = null;
		flow_step.abort();
	}
};

var removeFlowStep = function(tpl, w_cache_key) {
	tpl.calls_flow_index[w_cache_key] = null;
};

var hndPVRepeat = function(new_fv, states) {
	var wwtch = this;
	removeFlowStep(wwtch.context, wwtch.w_cache_key);
	//var new_fv = spv.getTargetField(states, wwtch.field_name);


	if (wwtch.original_fv != new_fv){
		var context = wwtch.context;
		//var node = wwtch.node;
		var old_nodes = wwtch.old_nodes;
		var repeat_data = wwtch.repeat_data;
		var field_name = wwtch.field_name;
		var valueIdent = wwtch.valueIdent;
		var keyIdent = wwtch.keyIdent;
		var comment_anchor = wwtch.comment_anchor;
		var sampler = wwtch.sampler;
		/*var new_value = calculator(states);
		if (simplifyValue){
			new_value = simplifyValue.call(_this, new_value);
		}*/


		var repeats_array = [];
		repeat_data.array = [];
		context.pv_types_collecting = true;

		$(old_nodes).detach();
		old_nodes.length = 0;

		wwtch.original_fv = new_fv;
		var collection = wwtch.calculator(states);

		var prev_node;

		var full_pv_context = '';
		if (context.pv_repeat_context){
			full_pv_context = context.pv_repeat_context + '.$.';
		}
		full_pv_context += field_name;

		var fragt = window.document.createDocumentFragment();

		for (var i = 0; i < collection.length; i++) {
			var scope = {};
			scope[valueIdent] = collection[i];
			if (keyIdent) {scope[keyIdent] = i;}
			scope.$index = i;

			scope.$first = (i === 0);
			scope.$last = (i === (collection.length - 1));
			scope.$middle = !(scope.$first || scope.$last);

			var cur_node = sampler.getClone();
			var template = new PvTemplate({
				node: cur_node,
				pv_repeat_context: full_pv_context,
				scope: scope,
				callCallbacks: context.sendCallback,
				struc_store: context.struc_store,
				calls_flow: context.calls_flow
			});

			old_nodes.push(cur_node);
			$(fragt).append(cur_node);
			appendSpace(fragt);
			prev_node = cur_node;
			repeats_array.push(template);
			repeat_data.array.push(template);
		}
		$(comment_anchor).after(fragt);
		if (!context.pv_repeats) {
			context.pv_repeats = {};
		}
		context.pv_repeats[full_pv_context] = repeats_array;
		context.pv_types_collecting = false;
		context._pvTypesChange();

	//	setValue.call(_this, node, attr_obj, new_value, original_value);
	//	original_value = new_value;
	}
};


var checkPVRepeat = function(states, async_changes, current_motivator) {
	var wwtch = this;
	abortFlowStep(wwtch.context, wwtch.w_cache_key);
	var new_fv = spv.getTargetField(states, wwtch.field_name);



	if (wwtch.original_fv != new_fv) {
		if (async_changes) {

			var flow_step = wwtch.context.calls_flow.pushToFlow(hndPVRepeat, this, [new_fv, states], false, false, false, current_motivator);
			wwtch.context.calls_flow_index[wwtch.w_cache_key] = flow_step;
		} else {
			hndPVRepeat.call(this, new_fv, states);
		}
	}
};


var removePvView = function(item, index) {
	var real_name = item.coll_name;
	var space = item.space || 'main';
	if (item.for_model){
		var field = [real_name, 'by_model_name', space];
		var storage = spv.getTargetField(index, field);
		if (storage) {
			storage.index[item.for_model] = null;
		}
	} else {
		spv.setTargetField(index, [real_name, 'usual', space], null);

		//result[real_name][space] = cur;
	}
};


var indexPvView = function(item, index) {
	var real_name = item.coll_name;
	var space = item.space || 'main';
	if (item.for_model){
		var field = [real_name, 'by_model_name', space];
		var storage = spv.getTargetField(index, field);
		if (!storage){
			storage = {index: {}};
			spv.setTargetField(index, field, storage);
		}
		if (storage.index[item.for_model]) {
			throw new Error("you can't have multiple `by_model` views");
			// not implemented yet. so don't use it;
		}

		item.comment_anchor = window.document.createComment(
			'collch anchor for: ' + real_name + ", " + item.for_model + ' (by_model_name)'
		);
		$(item.node).before(item.comment_anchor);

		//cur.sampler
		item.original_node = item.node;
		//cur.sampler =
		$(item.node).detach();

		storage.index[item.for_model] = item;
	} else {
		spv.setTargetField(index, [real_name, 'usual', space], item);

		//result[real_name][space] = cur;
	}
};

var BnddChunk = function(type, data) {
	this.type = type;
	this.data = data;
	this.dead = false;
	this.handled = false;
	this.destroyer = null;
};


var handleChunks = (function() {
	var chunk_destroyers = {
		'states_watcher': function(chunk, tpl) {
			tpl.states_watchers = spv.findAndRemoveItem(tpl.states_watchers, chunk.data);
		},
		'ancs': function(chunk, tpl) {
			if (!tpl.ancs) {return;}
			var anchor_name = chunk.data.anchor_name;
			tpl.ancs[anchor_name] = null;
		},
		'pv_type': function(chunk, tpl) {
			if (!tpl.pv_types) {return;}
			tpl.pv_types = spv.findAndRemoveItem(tpl.pv_types, chunk.data);
		},
		'pv_event': function(chunk) {
			chunk.destroyer();
		},
		'pv_view': function(chunk, tpl) {
			if (!tpl.children_templates) {return;}
			removePvView(chunk.data, tpl.children_templates);
			if (chunk.data.destroyers) {
				while (chunk.data.destroyers.length) {
					var cur = chunk.data.destroyers.pop();
					cur();
				}
			}
		},
		'pv_repeat': function(chunk, tpl) {
			if (!tpl.pv_repeats_data) {return;}
			tpl.pv_repeats_data = spv.findAndRemoveItem(tpl.pv_repeats_data, chunk.data);
		}
	};
	var chunk_handlers = {
		'states_watcher': function(chunk, tpl) {
			tpl.states_watchers.push(chunk.data);
		},
		'ancs': function(chunk, tpl) {
			if (!tpl.ancs) {
				tpl.ancs = {};
			}
			var anchor_name = chunk.data.anchor_name;
			if (tpl.ancs[anchor_name]){
				throw new Error('anchors exists');
			} else {
				tpl.ancs[anchor_name] = $(chunk.data.node);
			}
		},
		'pv_type': function(chunk, tpl) {
			if (!tpl.pv_types) {
				tpl.pv_types = [];
			}
			tpl.pv_types.push(chunk.data);
		},
		'pv_event': function(chunk, tpl) {
			chunk.destroyer = tpl.bindPVEvent(chunk.data.node, chunk.data.evdata);
		},
		'pv_view': function(chunk, tpl) {
			if (!tpl.children_templates) {
				tpl.children_templates = {};
			}
			indexPvView(chunk.data, tpl.children_templates);
		},
		'pv_repeat': function(chunk, tpl) {
			if (!tpl.pv_repeats_data) {
				tpl.pv_repeats_data = [];
			}
			tpl.pv_repeats_data.push(chunk.data);
		}
	};

	return function handleChunks(items, tpl, need_clean) {
		if (!items) {return need_clean && [];}
		var result = need_clean && [];
		for (var i = 0; i < items.length; i++) {
			var chunk = items[i];
			if (!chunk.dead) {
				result.push(chunk);
			} else {
				var destroyer = chunk_destroyers[chunk.type];
				if (destroyer) {
					destroyer(chunk, tpl);
				}
			}
			if (!chunk.dead && !chunk.handled) {
				chunk.handled = true;
				chunk_handlers[chunk.type](chunk, tpl);
			}
		}
		return result;
	};
})();

spv.Class.extendTo(PvTemplate, {
	_pvTypesChange: function() {
		if (this.pv_types_collecting){
			return;
		} else {
			if (this.pvTypesChange){
				this.pvTypesChange.call(this, this.getTypedNodes());
			}
		}
	},
	destroy: function() {
		this.dead = true;
		for (var i = 0; i < this.all_chunks.length; i++) {
			this.all_chunks[i].dead = true;
		}
		handleChunks(this.all_chunks, this, false);
		this.all_chunks = null;
		this.stwat_index = {};

		if (this.destroyers) {


			while (this.destroyers.length) {
				var cur = this.destroyers.shift();
				cur.call(this);
			}
		}
		if (this.calls_flow_index) {
			for (var w_cache_key in this.calls_flow_index) {
				if (this.calls_flow_index.hasOwnProperty(w_cache_key) && typeof this.calls_flow_index[w_cache_key] == 'function') {
					this.calls_flow_index[w_cache_key].abort();
					this.calls_flow_index[w_cache_key] = null;

				}
			}
		}
	},
	getTypedNodes: function() {
		var result = [];
		var objs = [this];
		while (objs.length){
			var cur = objs.shift();
			if (cur.pv_types && cur.pv_types.length){
				result.push(cur.pv_types);
			}

			if (!cur.pv_repeats_data) {
				continue;
			}

			for (var i = 0; i < cur.pv_repeats_data.length; i++) {
				if (cur.pv_repeats_data[i].array){
					objs = objs.concat(cur.pv_repeats_data[i].array);
				}

			}
		}
		return result;
	},


	scope_generators:{

		'pv-nest': function(node, data) {
			//coll_name for_model filter
			if (typeof data.coll_name == 'string'){
				var pv_view = {
					views: [],
					node: node,
					sampler: new PvSimpleSampler(node, this.struc_store, this.getSample),
					coll_name: data.coll_name,
					controller_name: data.controller_name,
					for_model: data.for_model,
					space: data.space,
					filterFn: data.filterFn,
					destroyers: null,
					onDie: function(cb) {
						if (!pv_view.destroyers) {
							pv_view.destroyers = [];
						}
						pv_view.destroyers.push(cb);
					}
				};
				return new BnddChunk('pv_view', pv_view);
			}
		},
		'pv-repeat': function(node, data) {
			if (node == this.root_node){
				return;
			}

			var
				expression = data.expression,
				valueIdent = data.valueIdent,
				keyIdent = data.keyIdent,
				calculator = data.calculator,
				sfy_values = data.sfy_values;

			var comment_anchor = window.document.createComment('pv-repeat anchor for: ' + expression);
			$(node).after(comment_anchor).detach();
			var repeat_data = {
				array: null
			};
			var nothing;

			return [
				new BnddChunk('pv_repeat', repeat_data),
				new BnddChunk('states_watcher', {
					w_cache_key:  node.pvprsd + '_' + node.pvprsd_inst + '*' + 'pv-repeat',
					node: node,
					context: this,
					original_fv: nothing,
					old_nodes: [],


					repeat_data: repeat_data,
					comment_anchor: comment_anchor,


					sampler: new PvSimpleSampler(node, this.struc_store, this.getSample),
					valueIdent: valueIdent,
					keyIdent: keyIdent,
					calculator: calculator,
					field_name: sfy_values[0],

					values: calculator.propsToWatch,
					sfy_values: sfy_values,
					checkFunc: checkPVRepeat
				})
			];
		}
	},

	empty_state_obj: {},

	bindPVEvent: (function() {
		var getDestroer = function(node, event_name, callback) {
			return function destroyer() {
				removeEvent(node, event_name, callback);
			};
		};

		return function(node, evdata) {
			var _this = this;

			var userCallback = evdata.fn;
			var event_name = evdata.event_name;

			evdata = null;

			var callback = function(e) {
				userCallback.call(this, e, _this);
			};

			var destroyer = getDestroer(node, event_name, callback);

			addEvent(node, event_name, callback);

			// if (!this.destroyers) {
			// 	this.destroyers = [];
			// }

			// this.destroyers.push(destroyer);
			return destroyer;
		};
	})(),


	callEventCallback: function(node, e, data) {
		this.sendCallback({
			event: e,
			node: node,
			callback_name: data[0],
			callback_data: data,
			pv_repeat_context: this.pv_repeat_context,
			scope: this.scope
		});
	},
	checkChanges: function(changes, full_states, async_changes, current_motivator) {
		if (this.dead) {return;}
		if (async_changes && !current_motivator) {
			// throw new Error('should be current_motivator');
		}
		//вместо того что бы собирать новый хэш на основе массива изменений используются объект всеъ состояний
		var matched = [], i = 0;
		for (i = 0; i < changes.length; i+= 3 ) { //ищем подходящие директивы
			var name = changes[i+1];
			if (this.stwat_index[name]){
				push.apply(matched, this.stwat_index[name]);
			}
		}

		matched = spv.getArrayNoDubs(matched);//устраняем повторяющиеся директивы

		var states_summ = this.getStatesSumm(full_states);

		if (!this.states_inited){
			this.states_inited = true;

			var remainded_stwats = spv.arrayExclude(this.states_watchers, matched);
			for (i = 0; i < remainded_stwats.length; i++) {
				remainded_stwats[i].checkFunc(states_summ, async_changes, current_motivator);
				if (this.dead) {return;}
			}
		}

		for (i = 0; i < matched.length; i++) {
			matched[i].checkFunc(states_summ, async_changes, current_motivator);
			if (this.dead) {return;}
		}
	},
	getStatesSumm: function(states) {
		var states_summ;
		if (this.spec_states_props_list){
			states_summ = Object.create(states);

			for (var i = 0; i < this.spec_states_props_list.length; i+=3) {
				var state_name = this.spec_states_props_list[ i + 1 ];
				var state_value = this.spec_states_props_list[ i + 2];
				states_summ[ state_name ] = state_value;
			}

			spv.cloneObj(states_summ, this.spec_states);

		} else {
			states_summ = states;
		}
		return states_summ;
	},
	setStates: function(states) {
		var states_summ = this.getStatesSumm(states);
		for (var i = 0; i < this.states_watchers.length; i++) {
			this.states_watchers[i].checkFunc(states_summ);
		}

	},
	/*
	checkValues: function(array, all_states) {
		var checked = [];

		for (var i = 0; i < array.length; i++) {
			array[i]
		}
	},*/
	handleDirective: (function() {
		var directives_h = {
			// 'pv-replace': function(node, index) {
			// 	if (index) {
			// 		if (index['pv-when']) {

			// 		} else {
			// 			var data = {
			// 				sample_name: index.sample_name,
			// 				node: node
			// 			};
			// 			return new BnddChunk('pv_replacer_simple', data);
			// 		}
			// 	}
			// },
			'pv-when-condition': function(node, standch) {
				if (standch) {
					var wwtch = standch.createBinding(node, this);
					var destroyer = function() {
						if (wwtch.destroyer) {
							wwtch.destroyer();
						}
					};
					var chunk = new BnddChunk('states_watcher', wwtch);
					chunk.destroyer = destroyer;
					return chunk;
				}

			},
			'pv-text': function(node, standch){
				if (standch){
					var wwtch = standch.createBinding(node, this);
					return new BnddChunk('states_watcher', wwtch);
				}
			},
			'pv-class': function(node, standches) {
				if (standches){
					var result = [];
					for (var i = 0; i < standches.length; i++) {
						var wwtch = standches[i].createBinding(node, this);
						result.push(new BnddChunk('states_watcher', wwtch));
					}
					return result;
				}
			},
			'pv-props': function(node, standches) {
				if (standches){
					var result = [];
					for (var i = 0; i < standches.length; i++) {
						var wwtch = standches[i].createBinding(node, this);
						result.push(new BnddChunk('states_watcher', wwtch));
					}
					return result;
				}
			},

			'pv-anchor': function(node, full_declaration) {
				var anchor_name = full_declaration;
				return new BnddChunk('ancs', {
					anchor_name: anchor_name,
					node: node
				});
			},
			'pv-type': function(node, standch) {
				if (standch){
					var pv_type_data = {node: node, marks: null};

					var wwtch = standch.createBinding(node, this);
					wwtch.pv_type_data = pv_type_data;
					wwtch.checkFunc(this.empty_state_obj);

					return [
						new BnddChunk('states_watcher', wwtch),
						new BnddChunk('pv_type', pv_type_data)
					];

				}
			},
			'pv-events': function(node, pv_events_data) {
				if (pv_events_data){

					if (!this.sendCallback){
						throw new Error('provide the events callback handler to the Template init func');
					}
					var result = [];

					for (var i = 0; i < pv_events_data.length; i++) {
						var evdata = pv_events_data[i];
						result.push(new BnddChunk('pv_event', {node: node, evdata: evdata}));
					}
					return result;
				}
			}
		};

		return function(directive_name, node, full_declaration) {
			var method = directives_h[directive_name];
			if (!method){
				//window.dizi = [directive_name, node, full_declaration]
				//window.dizi2 = directives_h;
				//window.dizi3 = directives_h[directive_name];
				console.log(directive_name, node, full_declaration);
				console.log(directives_h);
			}
			var result = method.call(this, node, full_declaration);
			return result;


		};
	})(),
	indexPvViews: function(array, result) {

		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			indexPvView(cur, result);

		}
		return result;
	},
	parseAppended: function(node) {
		return this.parsePvDirectives(node);
	},
	iterateBindingList: (function() {

		var config = parser.config;

		var pseudo_list = config.pseudo_list;
		var scope_g_list = config.scope_g_list;
		var directives_names_list = config.directives_names_list;
		var comment_directives_names_list = config.comment_directives_names_list;

		var pushChunks = function(all_chunks, chunks) {
			if (chunks) {
				if (Array.isArray(chunks)) {
					push.apply(all_chunks, chunks);
				} else {
					all_chunks.push(chunks);
				}
			}
			return all_chunks;
		};

		return function(is_root_node, cur_node, directives_data, all_chunks) {
			var i = 0;
			var directive_name;
			if (!is_root_node){
				//используем директивы генерирующие scope только если это не корневой элемент шаблона
				for (i = 0; i < pseudo_list.length; i++) {
					directive_name = pseudo_list[i];
					if (directives_data.instructions[directive_name]){
						var chunks_o = this.handleDirective(directive_name, cur_node, directives_data.instructions[directive_name]);
						pushChunks(all_chunks, chunks_o);
					}
				}

				for (i = 0; i < scope_g_list.length; i++) {
					directive_name = scope_g_list[i];
					if (directives_data.instructions[directive_name]){
						var chunks_s = this.scope_generators[directive_name]
							.call(this, cur_node, directives_data.instructions[directive_name]);

						pushChunks(all_chunks, chunks_s);
					}

				}
			}
			if (!directives_data.new_scope_generator || is_root_node){
				//используем директивы если это node не генерирующий scope или это корневой элемент шаблона

				for (i = 0; i < directives_names_list.length; i++) {
					directive_name = directives_names_list[i];
					if (directives_data.instructions[directive_name]){
						var chunks_d = this.handleDirective(directive_name, cur_node, directives_data.instructions[directive_name]);
						pushChunks(all_chunks, chunks_d);
					}
				}

				for (i = 0; i < comment_directives_names_list.length; i++) {
					directive_name = comment_directives_names_list[i];
					if (directives_data.instructions[directive_name]){
						var chunks_c = this.handleDirective(directive_name, cur_node, directives_data.instructions[directive_name]);
						pushChunks(all_chunks, chunks_c);
					}
				}

			}
			return all_chunks;
		};
	})(),
	checkChunks: function() {
		this.all_chunks = handleChunks(this.all_chunks, this, true);
		this.stwat_index = spv.makeIndexByField(this.states_watchers, 'sfy_values', true);
	},
	parsePvDirectives: function(start_node) {
		if (this.dead) {return;}
		var struc_store = this.struc_store;
		start_node = 'nodeType' in start_node ? start_node : start_node[0];

		var vroot_node = this.root_node_raw;

		var list_for_binding = parseEasy(start_node, vroot_node, struc_store, this.getSample);

		var all_chunks = [];
		for (var i = 0; i < list_for_binding.length; i+=3) {
			this.iterateBindingList(
				list_for_binding[ i ],
				list_for_binding[ i + 1 ],
				list_for_binding[ i + 2 ],
				all_chunks);
		}
		if (this.dead) {return;}
		this.all_chunks = this.all_chunks.concat(all_chunks);


		this.checkChunks();
		//this.children_templates = this.indexPvViews(this.parsed_pv_views, this.children_templates);

		// this.pv_views = this.pv_views.concat(this.parsed_pv_views);
		// this.parsed_pv_views = [];


		return all_chunks;
	}
});
PvTemplate.SimplePVSampler = PvSimpleSampler;

PvTemplate.templator = function(calls_flow, getSample, struc_store) {
	struc_store = struc_store || {};
	function template(node, callCallbacks, pvTypesChange, spec_states, pvTreeChange) {
		return new PvTemplate({
			node: node[0] || node,
			spec_states: spec_states,
			callCallbacks: callCallbacks,
			pvTypesChange: pvTypesChange,
			struc_store: struc_store,
			calls_flow: calls_flow,
			getSample: getSample,
			pvTreeChange: pvTreeChange
		});
	}

	function sampler(sample_node) {
		return new PvSimpleSampler(sample_node, struc_store, getSample);
	}

	return {
		template: template,
		sampler: sampler
	};
};

return PvTemplate;
});
