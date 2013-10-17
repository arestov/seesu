define(['spv', 'angbo', 'jquery'], function(spv, angbo, $) {
"use strict";
var push = Array.prototype.push;
var PvTemplate = function() {};
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
var getFieldsTreesBases = function(all_vs) {
	var sfy_values = new Array(all_vs.length);
	for (var i = 0; i < all_vs.length; i++) {
		var parts = all_vs[i].split(DOT);
		var main_part = parts[0];
		sfy_values[i] = main_part;
	}
	return sfy_values;
};

spv.Class.extendTo(PvTemplate, {
	init: function(opts) {
		this.pv_types_collecting = false;
		this.states_inited = false;
		this.waypoints = null;

		this.pv_views = null;
		this.parsed_pv_views = null;

		this.stwat_index = null;

		this.root_node = opts.node;
		this.root_node_raw = this.root_node[0] || this.root_node;
		this.pv_repeat_context = null;
		if (opts.pv_repeat_context){
			this.pv_repeat_context = opts.pv_repeat_context;
		}
		this.scope = null;
		if (opts.scope){
			this.scope = opts.scope;
		}
		this.spec_states = null;
		if (opts.spec_states){
			this.spec_states = opts.spec_states;
		}
		if (opts.callCallbacks){
			this.sendCallback = opts.callCallbacks;
		}
		this.pvTypesChange = opts.pvTypesChange;
		this.ancs = {};
		this.pv_views = [];
		this.parsed_pv_views = [];
		this.pv_repeats = {};
		this.children_templates = {};

		this.states_watchers = [];
		this.stwat_index = {};
		this.pv_types = [];
		this.pv_repeats_data = [];


		

		this.parsePvDirectives(this.root_node);
		if (!angbo || !angbo.interpolateExpressions){
			console.log('cant parse statements');
		}
		if (this.scope){
			this.setStates(this.scope);
		}
	},
	directives_names_list: [],
	scope_g_list: [],
	makeOrderedDirectives: function() {
		var directive_name;
		for (directive_name in this.directives){
			//порядок директив важен, по идее
			//должен в результате быть таким каким он задекларирован
			this.directives_names_list.push(directive_name);
		}
		for (directive_name in this.scope_generators){
			//порядок директив важен, по идее
			//должен в результате быть таким каким он задекларирован
			this.scope_g_list.push(directive_name);
		}
	},
	_pvTypesChange: function() {
		if (this.pv_types_collecting){
			return;
		} else {
			if (this.pvTypesChange){
				this.pvTypesChange.call(this, this.getTypedNodes());
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

			//coll_name for_model filter
			if (typeof coll_name == 'string'){
				this.parsed_pv_views.push({
					views: [],
					node: node,
					for_model: for_model,
					view_name: coll_name,
					space: space,
					filterFn: filterFn
				});
			}
		},
		'pv-repeat': function(node, full_declaration) {
			if (node == this.root_node){
				return;
			}
			var repeat_data = {
				array: null
			};
			this.pv_repeats_data.push(repeat_data);

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


			var comment_anchor = document.createComment('pv-repeat anchor for: ' + expression);
			$(node).after(comment_anchor).remove();

			var _this = this;
			var calculator = angbo.parseExpression(rhs);

			var all_values = calculator.propsToWatch;
			var sfy_values = getFieldsTreesBases(all_values);
			var field_name = sfy_values[0];

			var original_fv;
			var old_nodes = [];

			this.states_watchers.push({
				values: calculator.propsToWatch,
				sfy_values: sfy_values,
				checkFunc: function(states) {
					var new_fv = spv.getTargetField(states, field_name);



					/*var new_value = calculator(states);
					if (simplifyValue){
						new_value = simplifyValue.call(_this, new_value);
					}*/
					if (original_fv != new_fv){
						var repeats_array = [];
						repeat_data.array = [];
						_this.pv_types_collecting = true;

						$(old_nodes).remove();
						old_nodes = [];

						original_fv = new_fv;
						var collection = calculator(states);

						var prev_node;

						var full_pv_context = '';
						if (_this.pv_repeat_context){
							full_pv_context = _this.pv_repeat_context + '.$.';
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

							var cur_node = node.cloneNode(true);
							var template = new PvTemplate();


							template.init({
								node: cur_node,
								pv_repeat_context: full_pv_context,
								scope: scope,
								callCallbacks: _this.sendCallback
							});
							old_nodes.push(cur_node);
							$(fragt).append(cur_node);
							appendSpace(fragt);
							prev_node = cur_node;
							repeats_array.push(template);
							repeat_data.array.push(template);
						}
						$(comment_anchor).after(fragt);
						_this.pv_repeats[full_pv_context] = repeats_array;
						_this.pv_types_collecting = false;
						_this._pvTypesChange();

					//	setValue.call(_this, node, attr_obj, new_value, original_value);
					//	original_value = new_value;
					}
				}
			});
		}
	},
	regxp_spaces: /\s+/gi,
	regxp_edge_spaces: /^\s+|\s+$/gi,
	regxp_props_com: /\S[\S\s]*?\:[\S\s]*?\{\{[\S\s]*?\}\}/gi,
	regxp_props_spaces: /^\s*|s*?$/,
	regxp_props_coms_part: /\s*\:\s*?(?=\{\{)/,
	regxp_props_statement: /(^\{\{)|(\}\}$)/gi,
	directives_p: {
		'pv-text': function(node, full_declaration) {
			return this.createStandCh(node, {
				complex_statement: full_declaration,
				getValue: this.dom_helpres.getTextValue,
				setValue: this.dom_helpres.setTextValue
			});
		},
		'pv-class': function(node, full_declaration) {
			full_declaration = hlpSimplifyValue(full_declaration);
			return this.createStandCh(node, {
				complex_statement: full_declaration,
				getValue: this.dom_helpres.getClassName,
				setValue: this.dom_helpres.setClassName,
				simplifyValue: hlpSimplifyValue
			});
		},
	},
	createStandCh: function(node, opts) {
		var standch = new this.StandartChange(opts, this, node);
		if (standch.calculator){
			return standch;
		}
	},
	directives: {
		'pv-text': function(node, standch){
			if (standch){
				var wwtch = standch.createBinding(node);
				this.states_watchers.push(wwtch);
			}
		},
		'pv-class': function(node, standch) {
			if (standch){
				var wwtch = standch.createBinding(node);
				this.states_watchers.push(wwtch);
			}
		},
		'pv-props': function(node, full_declaration) {
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
				this.bindPropChange(node, prop, statement);
			}
			//пример:
			//"style.width: {{play_progress}} title: {{full_name}} style.background-image: {{album_cover_url}}"

		},
		'pv-anchor': function(node, full_declaration) {
			var anchor_name = full_declaration;
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

		},
		'pv-type': function(node, full_declaration) {
			if (!full_declaration){
				return;
			}
			full_declaration = hlpSimplifyValue(full_declaration);
			var pv_type_data = {node: node, marks: null};
			this.pv_types.push(pv_type_data);
			this.bindStandartChange(node, {
				complex_statement: full_declaration,
				getValue: function(){return '';},
				setValue: function(node, new_value){
					var types = new_value.split(this.regxp_spaces);
					pv_type_data.marks = {};
					for (var i = 0; i < types.length; i++) {
						if (types[i]){
							pv_type_data.marks[types[i]] = true;
						}
					}
					this._pvTypesChange();
				},
				simplifyValue: hlpSimplifyValue
			}, true);

			//
		},
		'pv-events': function(node, full_declaration) {
			/*
			click:Callback
			mousemove|(sp,pd):MovePoints
			*/
			var declarations = full_declaration.split(this.regxp_spaces);
			for (var i = 0; i < declarations.length; i++) {
				var decr_parts =  declarations[i].split('|');
				var cur = decr_parts[0].split(':');

				var dom_event = cur.shift();

				this.bindEvents(node, dom_event, cur, decr_parts[1]);
			}
		}
	},
	dom_helpres: {
		getTextValue: function(node) {
			return $(node).text();
		},
		setTextValue: function(node, new_value, old_value) {
			$(node).text(new_value);
		},
		getClassName: function(node) {
			return node.className;
		},
		setClassName: function(node, new_value, old_value) {
			node.className = new_value;
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
	bindPropChange: function(node, prop, statement) {
		var parts = prop.split(DOT);
		for (var i = 0; i < parts.length; i++) {
			parts[i] = this.convertFieldname(parts[i]);
		}
		prop = parts.join(DOT);

		this.bindStandartChange(node, {
			statement: statement,
			getValue: function(node) {
				return spv.getTargetField(node, prop);
			},
			setValue: function(node, value) {
				return spv.setTargetField(node, prop, value || '');
			}
		});
	},
	StandartChange: (function() {
		var StandartChange = function(opts, context, node) {
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
			this.calculator = calculator;
			this.context = context;
			this.all_vs = all_vs;
			this.simplifyValue = opts.simplifyValue;
			this.setValue = opts.setValue;
			this.getValue = opts.getValue;
			this.sfy_values = calculator ? getFieldsTreesBases(this.all_vs) : null;

			if (calculator){
				var original_value = this.getValue.call(this.context, node);
				if (this.simplifyValue){
					original_value = this.simplifyValue.call(this, original_value);
				}
				this.original_value = original_value;
			}

		};
		StandartChange.prototype = {
			checkFunc: function(states, twchd) {
				var _this = this.context;
				var new_value = this.calculator(states);
				if (this.simplifyValue){
					new_value = this.simplifyValue.call(_this, new_value);
				}
				if (twchd.current_value != new_value){
					this.setValue.call(_this, twchd.node, new_value, twchd.current_value);
					twchd.current_value = new_value;
				}
			},
			createBinding: function(node, check_at_once) {
				var nothing;
				var twchd = {
					node: node,
					current_value: nothing
				};
				twchd.current_value = this.original_value;
				//var sfy_values = getFieldsTreesBases(standch.all_vs);
				var _this = this;
				var wwtch = {
					values: this.all_vs,
					sfy_values: this.sfy_values,
					twchd: twchd,
					checkFunc: function(states) {
						_this.checkFunc(states, twchd);
					}
				};
				if (check_at_once){
					this.checkFunc({}, twchd);
				}
				return wwtch;
			}
		};
		return StandartChange;
	})(),
	bindStandartChange: function(node, opts, check_at_once) {
		var standch = new this.StandartChange(opts, this, node);
		if (standch.calculator){
			var wwtch = standch.createBinding(node, check_at_once);
			this.states_watchers.push(wwtch);
		}
	},
	bindEvents: function(node, event_name, data, event_opts) {
		event_opts = event_opts && event_opts.split(',');
		var event_handling = {};
		if (event_opts){
			for (var i = 0; i < event_opts.length; i++) {
				event_handling[event_opts[i]] = true;
			}
		}
		var _this = this;
		if (!this.sendCallback){
			throw new Error('provide the events callback handler to the Template init func');
		}
		$(node).on(event_name, function(e) {
			if (event_handling.sp){
				e.stopPropagation();
			}
			if (event_handling.pd){
				e.preventDefault();
			}
			_this.callEventCallback(this, e, data.slice());
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
	checkChanges: function(changes, full_states) {
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
				remainded_stwats[i].checkFunc(states_summ);
			}
		}

		for (i = 0; i < matched.length; i++) {
			matched[i].checkFunc(states_summ);
		}
	},
	getStatesSumm: function(states) {
		var states_summ;
		if (this.spec_states){
			states_summ = {};
			if (states){
				spv.cloneObj(states_summ, states);
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
		this.directives[directive_name].call(this, node, full_declaration);
	},
	indexPvViews: function(array) {
		var result = this.children_templates;
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var real_name = cur.view_name;
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
				cur.original_node = cur.node;
				$(cur.node).remove();

				storage.index[cur.for_model] = cur;
			} else {
				spv.setTargetField(result, [real_name, 'usual', space], cur);

				//result[real_name][space] = cur;
			}
			
		}
		return result;
	},
	parseAppended: function(node) {
		this.parsePvDirectives(node);
	},
	getDirectivesData: function(cur_node) {
		var
			directives_data = {},
			i = 0, attr_name = '', directive_name = '', attributes = cur_node.attributes,
			new_scope_generator = false;// current_data = {node: cur_node};

		var attributes_list = [];
		for (i = 0; i < attributes.length; i++) {
			//создаём кэш, список "pv-*" атрибутов
			attr_name = attributes[i].name;
			if (attr_name.indexOf('pv-') == 0){
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
				
				directives_data[directive_name] = value;
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
					value = this.directives_p[directive_name].call(this, cur_node, value);
				}
				directives_data[directive_name] = value;
				
			}
		}
		return directives_data;
	},
	parsePvDirectives: function(start_node) {
		var match_stack =[];

		//var anchors = [];


		start_node = start_node && start_node[0] || start_node;
		match_stack.push(start_node);

		var vroot_node = this.root_node_raw;


		var list_for_binding = [];

		while (match_stack.length){
			var cur_node = match_stack.shift();
			if (cur_node.nodeType != 1){
				continue;
			}
			var i = 0, directives_data = this.getDirectivesData(cur_node),
				is_root_node = vroot_node === cur_node;

			if (!directives_data.new_scope_generator || is_root_node){
				//получаем потомков
				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node.childNodes[i]);
				}
			}
			list_for_binding.push({
				is_root_node: is_root_node,
				node: cur_node,
				data: directives_data
			});

		}
		var _this = this;
		list_for_binding.forEach(function(el) {
			var i = 0;
			var directive_name;
			if (!el.is_root_node){
				//используем директивы генерирующие scope только если это не корневой элемент шаблона
				for (i = 0; i < _this.scope_g_list.length; i++) {
					directive_name = _this.scope_g_list[i];
					if (el.data[directive_name]){
						_this.scope_generators[directive_name].call(_this, el.node, el.data[directive_name]);
					}
					
				}
			}
			if (!el.data.new_scope_generator || el.is_root_node){
				//используем директивы если это node не генерирующий scope или это корневой элемент шаблона 
				for (i = 0; i < _this.directives_names_list.length; i++) {
					directive_name = _this.directives_names_list[i];
					if (el.data[directive_name]){
						_this.handleDirective(directive_name, el.node, el.data[directive_name]);
					}
					
				}
			}
		});

		this.indexPvViews(this.parsed_pv_views);

		this.pv_views = this.pv_views.concat(this.parsed_pv_views);
		this.parsed_pv_views = [];

		this.stwat_index = spv.makeIndexByField(this.states_watchers, 'sfy_values');
	}
});
PvTemplate.prototype.makeOrderedDirectives();


return PvTemplate;
});