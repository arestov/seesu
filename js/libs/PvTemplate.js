define(['spv', 'angbo', 'jquery'], function(spv, angbo, $) {
"use strict";
var push = Array.prototype.push;


var makeSpecStatesList = function(states) {
	var result = [];
	for (var state_name in states) {
		if (!states.hasOwnProperty(state_name)){
			continue;
		}
		result.push(state_name, states[state_name]);
	}
	return result;
};
var PvTemplate = function(opts) {
	this.pv_types_collecting = false;
	this.states_inited = false;
	this.waypoints = null;


	this.pv_views = null;
	this.parsed_pv_views = null;

	this.stwat_index = null;

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
	this.struc_store = opts.struc_store;
	this.ancs = {};
	this.pv_views = [];
	this.parsed_pv_views = [];
	this.pv_repeats = {};
	this.pv_replacers_simple = null;
	this.children_templates = {};

	this.states_watchers = [];
	this.stwat_index = {};
	this.pv_types = [];
	this.pv_repeats_data = [];
	this.destroyers = null;

	this.getSample = opts.getSample;


	

	this.parsePvDirectives(this.root_node, opts.struc_store);
	if (!angbo || !angbo.interpolateExpressions){
		console.log('cant parse statements');
	}

	if (this.pv_replacers_simple) {
		for (var i = 0; i < this.pv_replacers_simple.length; i++) {
			var cur = this.pv_replacers_simple[i];
			var sample = this.getSample(cur.sample_name);
			$(cur.node).after(sample);
			this.parsePvDirectives(sample, opts.struc_store);

			
		}
	}

	if (this.scope){
		this.setStates(this.scope);
	}

	
};
var DOT = '.';

var appendSpace = function() {
	//fixme
	//$(target).append(document.createTextNode(' '));
};

var regxp_complex_spaces = /(^\s+)|(\s+$)|(\s{2,})/gi;
var hlpFixStringSpaces = function(str, p1, p2, p3) {
	if (p1 || p2){
		return '';
	}
	if (p3){
		return ' ';
	}
	return '';
	//console.log(arguments);
};
var hlpSimplifyValue = function(value) {
	//this is optimization!
	if (!value){
		return value;
	}
	return value.replace(regxp_complex_spaces, hlpFixStringSpaces);
	
	//return value.replace(this.regxp_spaces,' ').replace(this.regxp_edge_spaces,'');
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

		var fragt = document.createDocumentFragment();

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

var getFieldsTreesBases = function(all_vs) {
	var sfy_values = new Array(all_vs.length);
	for (var i = 0; i < all_vs.length; i++) {
		var parts = all_vs[i].split(DOT);
		var main_part = parts[0];
		sfy_values[i] = main_part;
	}
	return sfy_values;
};
var template_struc_store = {};

var getIndexList = function(obj, arr) {

	var result = arr || [];
	for (var prop in obj) {
		result.push( prop );
	}
	return result;
};

var parser = {
	
	scope_generators: {
		'pv-nest': true,
		'pv-repeat': true
	},
	scope_g_list: [],
	states_using_directives: {
		'pv-text': true,
		'pv-class': true,
		'pv-props': true,
		'pv-type': true,
		'pv-repeat': true
	},
	sud_list: [],
	directives: {
		'pv-text': true,
		'pv-class': true,
		'pv-props': true,
		'pv-anchor': true,
		'pv-type': true,
		'pv-events': true
	},
	directives_names_list: [],

	comment_directives: {
		'pv-replace': true
	},
	comment_directives_names_list: [],
	
	makeOrderedDirectives: function() {
		getIndexList(this.directives, this.directives_names_list);
		//порядок директив важен, по идее
		//должен в результате быть таким каким он задекларирован
		
		getIndexList(this.scope_generators, this.scope_g_list);
		//порядок директив важен, по идее
		//должен в результате быть таким каким он задекларирован

		getIndexList(this.states_using_directives, this.sud_list);

		getIndexList(this.comment_directives, this.comment_directives_names_list);
	},
	regxp_spaces: /\s+/gi,
	regxp_edge_spaces: /^\s+|\s+$/gi,
	regxp_props_com: /\S[\S\s]*?\:[\s]*?\{\{[\S\s]+?\}\}/gi,
	regxp_props_com_soft: /\S[\S\s]*?\:[\s]*?(?:\{\{[\S\s]+?\}\})|(?:\S+?(\s|$))/gi,
	regxp_props_spaces: /^\s*|s*?$/,
	regxp_props_coms_part: /\s*\:\s*?(?=\{\{)/,
	regxp_props_statement: /(^\{\{)|(\}\}$)/gi,
	dom_helpres: {
		getTextValue: function(node) {
			return $(node).text();
		},
		setTextValue: function(node, new_value) {
			$(node).text(new_value);
		},
		getClassName: function(node) {
			return node.className;
		},
		setClassName: function(node, new_value) {
			node.className = new_value;
		},
		getPVTypes: function() {
			return '';
		},
		setPVTypes: function(node, new_value, ov, wwtch){
			var types = new_value.split(this.regxp_spaces);
			wwtch.pv_type_data.marks = {};
			for (var i = 0; i < types.length; i++) {
				if (types[i]){
					wwtch.pv_type_data.marks[types[i]] = true;
				}
			}
			wwtch.context._pvTypesChange();
		}
	},
	comment_directives_p: {
		'pv-replace': function(node, full_declaration, directive_name) {
			var index = {};
			var complex_value = full_declaration;
			var complects = complex_value.match( this.regxp_props_com_soft );
			for (var i = 0; i < complects.length; i++) {
				complects[i] = complects[i].replace( this.regxp_props_spaces, '' );
				var splitter_index = complects[i].indexOf(':');


				//var parts = complects[i].split(this.regxp_props_coms_part);
				//if ()

				var prop = complects[i].slice( 0, splitter_index );
				var statement = complects[i].slice( splitter_index + 1 ).replace( this.regxp_props_statement, '' );

				if (!prop || !statement){
					throw new Error('wrong declaration: ' + complex_value);
					//return;
				}
				index[prop] = statement;
				/*var item = this.createPropChange(node, prop, statement, prop + '$' + directive_name);
				if (item){
					result.push(item);
				}*/
				
			}
			if (index['pv-presence']) {

			}
			return index;
		}
	},
	directives_p: {
		'pv-text': function(node, full_declaration, directive_name) {
			return new this.StandartChange(node, this, {
				complex_statement: full_declaration,
				getValue: this.dom_helpres.getTextValue,
				setValue: this.dom_helpres.setTextValue
			}, directive_name);
		},
		'pv-class': function(node, full_declaration, directive_name) {
			full_declaration = hlpSimplifyValue(full_declaration);
			return new this.StandartChange(node, this, {
				complex_statement: full_declaration,
				getValue: this.dom_helpres.getClassName,
				setValue: this.dom_helpres.setClassName,
				simplifyValue: hlpSimplifyValue
			}, directive_name);
		},
		'pv-props': function(node, full_declaration, directive_name) {
			var result = [];
			var complex_value = full_declaration;
			var complects = complex_value.match(this.regxp_props_com);
			for (var i = 0; i < complects.length; i++) {
				complects[i] = complects[i].replace(this.regxp_props_spaces,'').split(this.regxp_props_coms_part);
				var prop = complects[i][0];
				var statement = complects[i][1] && complects[i][1].replace(this.regxp_props_statement,'');

				if (!prop || !statement){
					throw new Error('wrong declaration: ' + complex_value);
					//return;
				}
				var item = this.createPropChange(node, prop, statement, prop + '$' + directive_name);
				if (item){
					result.push(item);
				}
				
			}
			return result;
			//пример:
			//"style.width: {{play_progress}} title: {{full_name}} style.background-image: {{album_cover_url}}"
		},
		'pv-type': function(node, full_declaration, directive_name) {
			if (!full_declaration){
				return;
			}
			full_declaration = hlpSimplifyValue(full_declaration);

			//если pv-types не требует постоянных вычислений (не зависит ни от одного из состояний)
			//то использующие шаблон ноды могут выдавать общий результирующий объект - это нужно реализовать fixme

			return new this.StandartChange(node, this, {
				complex_statement: full_declaration,
				getValue: this.dom_helpres.getPVTypes,
				setValue: this.dom_helpres.setPVTypes,
				simplifyValue: hlpSimplifyValue
			}, directive_name);
		},
		'pv-events': function(node, full_declaration) {
			/*
			click:Callback
			mousemove|(sp,pd):MovePoints
			*/
			var result = [];
			var declarations = full_declaration.split(this.regxp_spaces);
			for (var i = 0; i < declarations.length; i++) {
				var decr_parts =  declarations[i].split('|');
				var cur = decr_parts[0].split(':');
				var dom_event = cur.shift();

				result.push(this.createPVEventData(dom_event, this.createEventParams(cur), decr_parts[1]));
			}
			return result;
		}
	},
	createEventParams: function(array) {

		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			if (cur.indexOf('{{') != -1) {
				array[i] = angbo.interpolateExpressions( cur );
			}
		}
		return array;
	},
	scope_generators_p:{
		'pv-nest': function(node, full_declaration) {
			var attr_value = full_declaration;

			var filter_parts = attr_value.split('|');

			var filterFn;
			if (filter_parts[1]){
				var calculator = angbo.parseExpression('obj |' + filter_parts[1]);
				filterFn = function(array) {
					return calculator({obj: array});
				};
			}

			var parts = filter_parts[0].split(/\s+/gi);
			var for_model,
				coll_name,
				space;

			for (var i = 0; i < parts.length; i++) {

				var cur_part = parts[i];
				if (!cur_part){
					continue;
				}
				if (cur_part.indexOf('for_model:') == 0){
					for_model = cur_part.replace('for_model:', '');
				} else {
					var space_parts = cur_part.split(':');
					if (!coll_name){
						coll_name = space_parts[0];
					}
					if (!space){
						space = space_parts[1] || '';
					}
				}

			}

			return {
				coll_name: coll_name,
				for_model: for_model,
				space: space,
				filterFn: filterFn
			};
		},
		'pv-repeat': function(node, full_declaration) {
			

			//start of angular.js code
			var expression = full_declaration;//attr.ngRepeat;
			var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
				lhs, rhs, valueIdent, keyIdent;
			if (! match) {
				throw new Error("Expected ngRepeat in form of '_item_ in _collection_' but got '" +
				expression + "'.");
			}
			lhs = match[1];
			rhs = match[2];
			match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
			if (!match) {
				throw new Error("'item' in 'item in collection' should be identifier or (key, value) but got '" +
				lhs + "'.");
			}
			valueIdent = match[3] || match[1];
			keyIdent = match[2];
			//end of angular.js code

			var calculator = angbo.parseExpression(rhs);
			var all_values = calculator.propsToWatch;
			var sfy_values = getFieldsTreesBases(all_values);

			return {
				expression: expression,
				valueIdent: valueIdent,
				keyIdent: keyIdent,
				calculator: calculator,
				sfy_values: sfy_values
			};
			
		}
	},
	convertFieldname: function(prop_name) {
		var parts = prop_name.replace(/^-/, '').split('-');
		if (parts.length > 1){
			for (var i = 1; i < parts.length; i++) {
				parts[i] = spv.capitalize(parts[i]);
			}
		}
		return parts.join('');
	},

	
	prop_ch_helpers: {
		getValue: function(node, prop) {
			return spv.getTargetField(node, prop);
		},
		setValue: function(node, value, old_value, wwtch) {
			return spv.setTargetField(node, wwtch.data, value || '');
		}
	},
	createPropChange: function(node, prop, statement, directive_name) {
		var parts = prop.split(DOT);
		for (var i = 0; i < parts.length; i++) {
			parts[i] = this.convertFieldname(parts[i]);
		}
		prop = parts.join(DOT);

		return new this.StandartChange(node, this, {
			data: prop,
			statement: statement,
			getValue: this.prop_ch_helpers.getValue,
			setValue: this.prop_ch_helpers.setValue
		}, directive_name);
	},
	StandartChange: (function() {
		var StandartChange = function(node, context, opts, directive_name) {
			var calculator = opts.calculator;
			var all_vs;
			if (!calculator){
				if (opts.complex_statement){
					calculator = angbo.interpolateExpressions(opts.complex_statement);
					var all_values = spv.filter(calculator.parts,'propsToWatch');
					all_vs = [];
					all_vs = all_vs.concat.apply(all_vs, all_values);
				} else if (opts.statement){
					calculator = angbo.parseExpression(opts.statement);
					all_vs = calculator.propsToWatch;
				}
			}

			if (!directive_name) {
				throw new Error('directive_name must be provided');
			}

			this.directive_name = directive_name;
			this.data = opts.data;
			this.calculator = calculator;
			this.context = context;
			this.all_vs = all_vs;
			this.simplifyValue = opts.simplifyValue;
			this.setValue = opts.setValue;
			this.getValue = opts.getValue;
			this.sfy_values = calculator ? getFieldsTreesBases(this.all_vs) : null;

			if (calculator){
				var original_value = this.getValue.call(this.context, node, this.data);
				if (this.simplifyValue){
					original_value = this.simplifyValue.call(this, original_value);
				}
				this.original_value = original_value;
			}

			if (!node.pvprsd) {
				//debugger;
			}
			//this.w_cache_key = node.pvprsd + '_' + node.pvprsd_inst + '*' + directive_name;

		};
		StandartChange.prototype = {
			changeValue: function(new_value, wwtch) {
				removeFlowStep(wwtch.context, wwtch.w_cache_key);
				if (wwtch.current_value != new_value) {
					var old_value = wwtch.current_value;
					wwtch.current_value = new_value;
					this.setValue.call(this.context, wwtch.node, new_value, old_value, wwtch);
				}
				
			},
			checkFunc: function(states, wwtch, async_changes, current_motivator) {
				abortFlowStep(wwtch.context, wwtch.w_cache_key);
				var new_value = this.calculator(states);
				if (this.simplifyValue){
					new_value = this.simplifyValue.call(this.context, new_value);
				}
				if (wwtch.current_value != new_value){
					if (async_changes) {
						var flow_step = wwtch.context.calls_flow.pushToFlow(this.changeValue, this, [new_value, wwtch], false, false, false, current_motivator);
						wwtch.context.calls_flow_index[wwtch.w_cache_key] = flow_step;
						//).pushToFlow(cb, mo_context, reg_args, one_reg_arg, callbacks_wrapper, this.sputnik, this.sputnik.current_motivator);
					} else {
						this.changeValue(new_value, wwtch);
					}
					
				}
			},
			helpers: {
				checkFuncPublic: function(states, async_changes, current_motivator) {
					this.standch.checkFunc(states, this, async_changes, current_motivator);
				}
			},
			createBinding: function(node, context) {
				//var sfy_values = getFieldsTreesBases(standch.all_vs);
				
				var wwtch = {
					w_cache_key: node.pvprsd + '_' + node.pvprsd_inst + '*' + this.directive_name,
					data: this.data,
					standch: this,
					context: context,
					node: node,
					current_value: this.original_value,
					pv_type_data: null,

					values: this.all_vs,
					sfy_values: this.sfy_values,
					checkFunc: this.helpers.checkFuncPublic
				};
				return wwtch;
			}
		};
		return StandartChange;
	})(),
	findDDRoot: function(directives_data) {
		var root = null, cur = directives_data;
		while ( !root && cur ) {
			if (cur.instructions['pv-nest']){
				root = cur;
			}

			if (!root && !cur.parent){
				root = cur;
			}
			cur = cur.parent;
		}
		return root;

	},
	comment_pvdiv_regexp: /(^.+?)\s/,
	getCommentDirectivesData: function(cur_node, cur_node_parent, struc_store) {
		//возвращает объект с индексом одной инструкции, основанной на тексте коммента
		var
			parent_dd = (cur_node_parent && cur_node_parent.pvprsd && this.getPVData(cur_node_parent, false, struc_store)) || null;
		var directives_data = {
			new_scope_generator: null,
			instructions: {},
			parent: parent_dd,
			children: null,
			scope_root: this.findDDRoot(parent_dd),
			children_scopes: null
		};

		/*if ( parent_dd ) {
			if (!parent_dd.children) {
				parent_dd.children = [];
			}
			parent_dd.children.push( directives_data );
		}*/


		/*var matching_list = ['pv-replace'];
		var matching_index = {
			'pv-replace': true
		};*/


		var text_content = cur_node.textContent;
		var directive_name = text_content.match(this.comment_pvdiv_regexp);
		directive_name = directive_name && directive_name[1];



		if (this.comment_directives.hasOwnProperty(directive_name)) {
			var full_declaration = text_content.replace(this.comment_pvdiv_regexp, '');
			directives_data.instructions[directive_name] = this.comment_directives_p[directive_name].call(this, cur_node, full_declaration, directive_name);
			
		}


		return directives_data;
	},
	getDirectivesData: function(cur_node, cur_node_parent, struc_store) {

		//возвращает объект с индексом инструкций нода, основанный на аттрибутах элемента
		var
			parent_dd = (cur_node_parent && cur_node_parent.pvprsd && this.getPVData(cur_node_parent, false, struc_store)) || null,
			directives_data = {
				new_scope_generator: null,
				instructions: {},

				parent: parent_dd,
				children: null,
				scope_root: this.findDDRoot(parent_dd),
				children_scopes: null
			},
			i = 0, attr_name = '', directive_name = '', attributes = cur_node.attributes,
			new_scope_generator = false;// current_data = {node: cur_node};

		/*if ( parent_dd ) {
			if (!parent_dd.children) {
				parent_dd.children = [];
			}
			parent_dd.children.push( directives_data );
		}*/

		


		var attributes_list = [];
		for (i = 0; i < attributes.length; i++) {
			//создаём кэш, список "pv-*" атрибутов
			attr_name = attributes[i].name;
			if ( attr_name.indexOf('pv-') == 0 ){
				attributes_list.push({
					name: attr_name,
					node: attributes[i]
				});
			}

		}
		//создаём индекс по имени
		var attrs_by_names = spv.makeIndexByField(attributes_list, 'name');
		var value;

		for (i = 0; i < this.scope_g_list.length; i++) {
			//проверяем есть ли среди атрибутов директивы создающие новую область видимости
			directive_name = this.scope_g_list[i];
			if (attrs_by_names[directive_name] && attrs_by_names[directive_name].length){
				if (new_scope_generator){
					throw new Error('can\'t be mulpyiply scrope generators on one node');
				}
				value = attrs_by_names[directive_name][0].node.value;

				if (this.scope_generators_p[directive_name]){
					value = this.scope_generators_p[directive_name].call(this, cur_node, value);
				}
				
				directives_data.instructions[directive_name] = value;
				directives_data.new_scope_generator = true;
				new_scope_generator = true;
			}
		}
		for (i = 0; i < this.directives_names_list.length; i++) {
			//проверяем остальные директивы нода
			directive_name = this.directives_names_list[i];
			if (attrs_by_names[directive_name] && attrs_by_names[directive_name].length){
				value = attrs_by_names[directive_name][0].node.value;
				
				if (this.directives_p[directive_name]){
					value = this.directives_p[directive_name].call(this, cur_node, value, directive_name);
				}
				directives_data.instructions[directive_name] = value;
				
			}
		}

		for (var i = 0; i < attributes_list.length; i++) {
			cur_node.removeAttributeNode(attributes_list[i].node);
		}

		if ( directives_data.scope_root && directives_data.instructions['pv-nest'] ) {
			if (!directives_data.scope_root.children_scopes) {
				directives_data.scope_root.children_scopes = [];
			}
			directives_data.scope_root.children_scopes.push( directives_data );
		}

		
		return directives_data;
	},
	createPVEventData: function(event_name, data, event_opts) {
		
		event_opts = event_opts && event_opts.split(',');
		var event_handling = {};
		if (event_opts){
			for (var i = 0; i < event_opts.length; i++) {
				event_handling[event_opts[i]] = true;
			}
		}


		return {
			event_name: event_name,
			fn: function(e, context) {
				if (event_handling.sp){
					e.stopPropagation();
				}
				if (event_handling.pd){
					e.preventDefault();
				}
				context.callEventCallback(this, e, data.slice());
			}
		};
	},
	getCachedPVData: function(cur_node, cur_node_parent, struc_store, is_comment) {
		var directives_data = null;
		var pvprsd = cur_node.pvprsd;
		var _cache_index = struc_store || template_struc_store;
		if (typeof pvprsd != 'undefined'){
			if (pvprsd){
				directives_data = _cache_index[pvprsd];
			}
			
		} else {
			if (!_cache_index.struc_counter) {
				_cache_index.struc_counter = 0;
			}
			pvprsd = ++_cache_index.struc_counter;
			cur_node.pvprsd = pvprsd;
			cur_node.pvprsd_inst = getNodeInstanceCount(pvprsd, _cache_index);
			if (is_comment) {
				directives_data = this.getCommentDirectivesData(cur_node, cur_node_parent, struc_store);
			} else {
				directives_data = this.getDirectivesData(cur_node, cur_node_parent, struc_store);
			}
			
			
			

			_cache_index[pvprsd] = directives_data;
			
		}
		return directives_data;
	},
	getCommentPVData: function(cur_node, cur_node_parent, struc_store) {
		return this.getCachedPVData(cur_node, cur_node_parent, struc_store, true);
	},
	getPVData: function(cur_node, cur_node_parent, struc_store) {
		return this.getCachedPVData(cur_node, cur_node_parent, struc_store);
		
	},
	parse: function(start_node, struc_store) {
		//полный парсинг, без байндинга
		var match_stack = [ start_node.parentNode, start_node ], i = 0;
		while (match_stack.length){
			var cur_node_parent = match_stack.shift();
			var cur_node = match_stack.shift();
			var node_type = cur_node.nodeType;
			if (node_type == 1){
				this.getPVData(cur_node, cur_node_parent, struc_store);
				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node, cur_node.childNodes[i]);
				}
			} else if (node_type == 8) {
				this.getCommentPVData(cur_node, cur_node_parent, struc_store);
				//getCommentPVData
			}
			
		}
	},
	parseEasy: function(start_node, vroot_node, struc_store) {
		//полный парсинг, байндинг одного scope (раньше и парсинг был только в пределах одного scope)
		var list_for_binding = [];
		var match_stack = [ start_node.parentNode, start_node, true ];

		while (match_stack.length){
			var cur_node_parent = match_stack.shift();
			var cur_node = match_stack.shift();
			var can_bind = match_stack.shift();
			var node_type = cur_node.nodeType;
			var directives_data;
			if (node_type == 1){
				var i = 0, is_root_node = vroot_node === cur_node;
				directives_data = this.getPVData(cur_node, cur_node_parent, struc_store);

				var can_bind_children = (!directives_data.new_scope_generator || is_root_node);

				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node, cur_node.childNodes[i], can_bind && can_bind_children);//если запрещен байндинг текущего нода, то и его потомков тоже запрещён
				}

				if (can_bind) {
					list_for_binding.push(is_root_node, cur_node, directives_data);
				}
			} else if (node_type == 8) {
				directives_data = this.getCommentPVData(cur_node, cur_node_parent, struc_store);
				if (can_bind) {
					list_for_binding.push(false, cur_node, directives_data);
				}
				
			}
			

		}
		return list_for_binding;
	}
};
parser.makeOrderedDirectives();

var getAll = function(node) {
	var result = [];
	var iteration_list = [ node ];
	var i = 0;
	while( iteration_list.length ){
		var cur_node = iteration_list.shift();
		var node_type = cur_node.nodeType;
		if ( node_type == 1 ){
			for ( i = 0; i < cur_node.childNodes.length; i++ ) {
				iteration_list.push( cur_node.childNodes[i] );
			}
			result.push( cur_node );
		} else if (node_type == 8) {
			result.push( cur_node );
		}
		
	}
	return result;
};


var samplers_counter = 0;

var SimplePVSampler = function(node, struc_store) {
	node = $(node);
	node = node[0];
	if (!node){
		throw new Error('wrong node');
	}
	this.onode = node;
	
	this.parsed = false;
	this.structure_data_as_root = null;
	this.structure_data = null;
	this.struc_store = struc_store;
	this._id = ++samplers_counter;
};
(function() {
	var setStructureData = function(struc_store, is_root_node, cur_node, bind_data, states_list, children_list) {
		if (!is_root_node) {
			if (bind_data.instructions['pv-nest']) {
				children_list.push({
					item: parseStructureData(cur_node, struc_store),
					data: bind_data.instructions['pv-nest']
				});
			}


			var has_scope_gen = false;
			for (var i = 0; i < parser.scope_g_list.length; i++) {
				var directive_name = parser.scope_g_list[i];
				if (bind_data.instructions[directive_name]) {
					has_scope_gen = true;
					if (parser.states_using_directives[directive_name]) {
						//mainaly for pv-repeat
						push.apply(states_list, bind_data.instructions[directive_name].sfy_values);
					}
					
				}
			}
			if (has_scope_gen) {
				//mainaly pv-repeat and pv-nest
				return;
			}
		}
		for (var i = 0; i < parser.sud_list.length; i++) {
			var cur = parser.sud_list[i];
			if (bind_data.instructions[cur]) {
				push.apply(states_list, bind_data.instructions[cur].sfy_values);
				//debugger;
			}
		}
	};


	var parseStructureData = function(node, struc_store, is_not_root) {
		var structure_data = {
			node_id: null,
			states: [],
			children: null,
			children_by_mn: null
		};
		var children_list = [];


		var bind_data_list = parser.parseEasy(node, !is_not_root && node, struc_store);
		for (var i = 0; i < bind_data_list.length; i+=3) {
			var
				is_root_node = bind_data_list[ i ],
				cur_node = bind_data_list[ i + 1 ],
				bind_data = bind_data_list[ i + 2 ];

			setStructureData(struc_store, is_root_node, cur_node, bind_data, structure_data.states, children_list);
		}
		structure_data.states = spv.getArrayNoDubs(structure_data.states);


		if (children_list.length) {
			var usual = null, by_model_name = null;

			for (var i = 0; i < children_list.length; i++) {
				var cur = children_list[i];
				if (cur.data.for_model) {
					if (!by_model_name) {
						by_model_name = {};
					}
					spv.setTargetField(by_model_name, [cur.data.coll_name, cur.data.for_model, cur.data.space || 'main'], cur.item);
				} else {
					if (!usual) {
						usual = {};
					}
					spv.setTargetField(usual, [cur.data.coll_name, cur.data.space || 'main'], cur.item);
				}
				
			}
			
			structure_data.children = usual;
			structure_data.children_by_mn = by_model_name;
			/*

			coll_name: "top_songs"
			filterFn: undefined
			for_model: undefined
			space: ""

			*/
		}
		structure_data.node_id = node.pvprsd;
		return structure_data;
	};

	SimplePVSampler.prototype.getStructure = function(is_not_root) {
		var str_d_prop_name = 'structure_data' + (is_not_root ? '' : '_as_root');

		if (!this[str_d_prop_name]) {
			this[str_d_prop_name] = parseStructureData(this.onode, this.struc_store, is_not_root);
			//this[str_d_prop_name]._id = this._id;
			this.parsed = true;
			
		}
		return this[str_d_prop_name];
		
	};

})();

var getNodeInstanceCount = function(pvprsd, struc_store) {
	if (!struc_store.instances_ci) {
		struc_store.instances_ci = {};
	}
	var instances_ci = struc_store.instances_ci;
	if (!instances_ci.hasOwnProperty(pvprsd)) {
		instances_ci[pvprsd] = 0;
	} else {
		instances_ci[pvprsd]++;
	}

	return instances_ci[pvprsd];
};

SimplePVSampler.prototype.getClone = function() {
	if (!this.onode){
		return;
	}
	if (!this.parsed){
		this.parsed = true;
		parser.parse(this.onode, this.struc_store);
	}
	var cloned = this.onode.cloneNode(true);

	var all_onodes = getAll(this.onode);
	var all_cnodes = getAll(cloned);

	if (all_onodes.length !== all_cnodes.length){
		throw new Error('something wrong');
	}
	
	
	for (var i = 0; i < all_onodes.length; i++) {
		all_cnodes[i].pvprsd = all_onodes[i].pvprsd;
		all_cnodes[i].pvprsd_inst = getNodeInstanceCount(all_onodes[i].pvprsd, this.struc_store);
	}
	return cloned;
};
SimplePVSampler.prototype.clone = SimplePVSampler.prototype.getClone;


var directives_h = {
		'pv-replace': function(node, index) {
			if (index) {
				if (index['pv-replace']) {

				} else {
					if (!this.pv_replacers_simple) {
						this.pv_replacers_simple = [];
					}
					this.pv_replacers_simple.push({
						sample_name: index.sample_name,
						node: node
					});
				}
			}
		},
		'pv-text': function(node, standch){
			if (standch){
				var wwtch = standch.createBinding(node, this);
				this.states_watchers.push(wwtch);
			}
		},
		'pv-class': function(node, standch) {
			if (standch){
				var wwtch = standch.createBinding(node, this);
				this.states_watchers.push(wwtch);
			}
		},
		'pv-props': function(node, standches) {
			if (standches){
				for (var i = 0; i < standches.length; i++) {
					var wwtch = standches[i].createBinding(node, this);
					this.states_watchers.push(wwtch);
				}
			}
		},
		'pv-anchor': function(node, full_declaration) {
			var anchor_name = full_declaration;
			if (this.ancs[anchor_name]){
				throw new Error('anchors exists');
			} else {
				this.ancs[anchor_name] = $(node);
			}
		},
		'pv-type': function(node, standch) {
			if (standch){
				var pv_type_data = {node: node, marks: null};
				this.pv_types.push(pv_type_data);

				var wwtch = standch.createBinding(node, this);
				wwtch.pv_type_data = pv_type_data;
				this.states_watchers.push(wwtch);
				wwtch.checkFunc(this.empty_state_obj);

			}
			//
		},
		'pv-events': function(node, pv_events_data) {
			if (pv_events_data){

				if (!this.sendCallback){
					throw new Error('provide the events callback handler to the Template init func');
				}
				for (var i = 0; i < pv_events_data.length; i++) {
					var evdata = pv_events_data[i];
					this.bindPVEvent(node, evdata);
				}
			}
		}
	};
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
			if (cur.pv_types.length){
				result.push(cur.pv_types);
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
				this.parsed_pv_views.push({
					views: [],
					node: node,
					sampler: new SimplePVSampler(node, this.struc_store),
					coll_name: data.coll_name,
					for_model: data.for_model,
					space: data.space,
					filterFn: data.filterFn
				});
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
			


			var comment_anchor = document.createComment('pv-repeat anchor for: ' + expression);
			$(node).after(comment_anchor).detach();
			var repeat_data = {
				array: null
			};
			this.pv_repeats_data.push(repeat_data);
			var nothing;
			this.states_watchers.push({
				w_cache_key:  node.pvprsd + '_' + node.pvprsd_inst + '*' + 'pv-repeat',
				node: node,
				context: this,
				original_fv: nothing,
				old_nodes: [],

				
				repeat_data: repeat_data,
				comment_anchor: comment_anchor,

				
				sampler: new SimplePVSampler(node, this.struc_store),
				valueIdent: valueIdent,
				keyIdent: keyIdent,
				calculator: calculator,
				field_name: sfy_values[0],

				values: calculator.propsToWatch,
				sfy_values: sfy_values,
				checkFunc: checkPVRepeat
			});
		}
	},
	
	empty_state_obj: {},
	
	bindPVEvent: function(node, evdata) {
		var _this = this;

		var callback = function(e) {
			evdata.fn.call(this, e, _this);
		};
		$(node).on(evdata.event_name, callback);
		if (!this.destroyers) {
			this.destroyers = [];
		}

		this.destroyers.push(function() {
			
			$(node).off(evdata.event_name, callback);
			node = null;
			_this = null;
			evdata = null;
			callback = null;
		});
	},
	

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
		//вместо того что бы собирать новый хэш на основе массива изменений используются объект всеъ состояний
		var matched = [], i = 0;
		for (i = 0; i < changes.length; i+= 2 ) { //ищем подходящие директивы
			var name = changes[i];
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
			}
		}

		for (i = 0; i < matched.length; i++) {
			matched[i].checkFunc(states_summ, async_changes, current_motivator);
		}
	},
	getStatesSumm: function(states) {
		var states_summ;
		if (this.spec_states_props_list){
			states_summ = Object.create(states);

			for (var i = 0; i < this.spec_states_props_list.length; i+=2) {
				var state_name = this.spec_states_props_list[ i ];
				var state_value = this.spec_states_props_list[ i + 1];
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
	handleDirective: function(directive_name, node, full_declaration) {
		var method = directives_h[directive_name];
		if (!method){
			//window.dizi = [directive_name, node, full_declaration]
			//window.dizi2 = directives_h;
			//window.dizi3 = directives_h[directive_name];
			console.log(directive_name, node, full_declaration);
			console.log(directives_h);
		}
		method.call(this, node, full_declaration);
	},
	indexPvViews: function(array) {
		var result = this.children_templates;
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var real_name = cur.coll_name;
			var space = cur.space || 'main';
			if (cur.for_model){
				var field = [real_name, 'by_model_name', space];
				var storage = spv.getTargetField(result, field);
				if (!storage){
					storage = {index: {}};
					spv.setTargetField(result, field, storage);
				}
				if (!storage.first){
					storage.first = cur;
					storage.comment_anchor = document.createComment('collch anchor for: ' + real_name + ", " + space + ' (by_model_name)');
					$(cur.node).before(storage.comment_anchor);
				}
				//cur.sampler 
				cur.original_node = cur.node;
				//cur.sampler = 
				$(cur.node).detach();

				storage.index[cur.for_model] = cur;
			} else {
				spv.setTargetField(result, [real_name, 'usual', space], cur);

				//result[real_name][space] = cur;
			}
			
		}
		return result;
	},
	parseAppended: function(node, struc_store) {
		this.parsePvDirectives(node, struc_store);
	},
	iterateBindingList: function(is_root_node, cur_node, directives_data) {
		var i = 0;
		var directive_name;
		if (!is_root_node){
			//используем директивы генерирующие scope только если это не корневой элемент шаблона
			for (i = 0; i < parser.scope_g_list.length; i++) {
				directive_name = parser.scope_g_list[i];
				if (directives_data.instructions[directive_name]){
					this.scope_generators[directive_name].call(this, cur_node, directives_data.instructions[directive_name]);
				}
				
			}
		}
		if (!directives_data.new_scope_generator || is_root_node){
			//используем директивы если это node не генерирующий scope или это корневой элемент шаблона 
			for (i = 0; i < parser.directives_names_list.length; i++) {
				directive_name = parser.directives_names_list[i];
				if (directives_data.instructions[directive_name]){
					this.handleDirective(directive_name, cur_node, directives_data.instructions[directive_name]);
				}
				
			}
			for (i = 0; i < parser.comment_directives_names_list.length; i++) {
				directive_name = parser.comment_directives_names_list[i];
				if (directives_data.instructions[directive_name]){
					this.handleDirective(directive_name, cur_node, directives_data.instructions[directive_name]);
				}
			}
		}
	},
	parsePvDirectives: function(start_node, struc_store) {
		start_node = 'nodeType' in start_node ? start_node : start_node[0];

		var vroot_node = this.root_node_raw;


		var list_for_binding = parser.parseEasy(start_node, vroot_node, struc_store);

		for (var i = 0; i < list_for_binding.length; i+=3) {
			this.iterateBindingList(
				list_for_binding[ i ],
				list_for_binding[ i + 1 ],
				list_for_binding[ i + 2 ]);
			
		}

		this.indexPvViews(this.parsed_pv_views);

		this.pv_views = this.pv_views.concat(this.parsed_pv_views);
		this.parsed_pv_views = [];

		this.stwat_index = spv.makeIndexByField(this.states_watchers, 'sfy_values', true);
	}
});
PvTemplate.SimplePVSampler = SimplePVSampler;


return PvTemplate;
});