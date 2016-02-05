define(function(require) {
'use strict';

var spv = require('spv');
var $ = require('jquery');
var d_parsers = require('./directives_parsers');
var getCachedPVData = require('./getCachedPVData');

var config = d_parsers.config;
var getNodeInstanceCount = getCachedPVData.getNodeInstanceCount;

var patching_directives = d_parsers.patching_directives;
var getIndexList = d_parsers.getIndexList;
var patching_directives_list = getIndexList(patching_directives);


var patchNode = function(node, struc_store, directives_data, getSample, opts) {
	for (var i = 0; i < patching_directives_list.length; i++) {
		var cur = patching_directives_list[i];
		if (directives_data && directives_data.instructions[cur]) {
			// cur
			// debugger;
			// node, params, getSample, opts
			var result = patching_directives[cur].call(parser, node, directives_data.instructions[cur], getSample, opts);
			if (result) {
				if (!result.directives_data && !result.pvprsd) {
					throw new Error('should be directives_data');
				}
				if (result.directives_data) {
					setStrucKey(result, struc_store, result.directives_data);
				}
				return result;
			}


		}
	}
};

var setStrucKey = getCachedPVData.setStrucKey;

var PvSimpleSampler = (function(){
	var push = Array.prototype.push;

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

	var PvSimpleSampler = function(node, struc_store, getSample) {
		node = $(node);
		node = node[0];
		if (!node){
			throw new Error('wrong node');
		}
		this.onode = node;
		this.mod_root_node = null;
		this.patched_cache = null;

		this.parsed = false;
		this.structure_data_as_root = null;
		this.structure_data = null;
		this.struc_store = struc_store;
		this._id = ++samplers_counter;

		this.getSample = getSample;
		this.nodes = null;
		this.pstd_cache = null;
	};
	(function() {
		var setStructureData = function(struc_store, is_root_node, cur_node, bind_data, states_list, children_list, getSample) {
			if (!is_root_node) {
				if (bind_data.instructions['pv-nest']) {
					children_list.push({
						item: parseStructureData(cur_node, struc_store, false, getSample),
						data: bind_data.instructions['pv-nest']
					});
				}


				var has_scope_gen = false;
				for (var i = 0; i < config.scope_g_list.length; i++) {
					var directive_name = config.scope_g_list[i];
					if (bind_data.instructions[directive_name]) {
						has_scope_gen = true;
						if (config.states_using_directives[directive_name]) {
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
			for (var i = 0; i < config.sud_list.length; i++) {
				var cur = config.sud_list[i];
				if (bind_data.instructions[cur]) {
					push.apply(states_list, bind_data.instructions[cur].sfy_values);
					//debugger;
				}
			}
		};


		var parseStructureData = function(node, struc_store, is_not_root, getSample) {
			var structure_data = {
				node_id: null,
				states: [],
				children: null,
				children_by_mn: null
			};
			var children_list = [];


			var bind_data_list = parser.parseEasy(node, !is_not_root && node, struc_store, getSample);
			for (var i = 0; i < bind_data_list.length; i+=3) {
				var
					is_root_node = bind_data_list[ i ],
					cur_node = bind_data_list[ i + 1 ],
					bind_data = bind_data_list[ i + 2 ];

				setStructureData(struc_store, is_root_node, cur_node, bind_data, structure_data.states, children_list, getSample);
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

		PvSimpleSampler.prototype.getStructure = function(is_not_root) {
			var str_d_prop_name = 'structure_data' + (is_not_root ? '' : '_as_root');

			if (!this.pstd_cache) {this.pstd_cache = {};}

			if (!this.pstd_cache[str_d_prop_name]) {
				this.pstd_cache[str_d_prop_name] = parseStructureData(this.onode, this.struc_store, is_not_root, this.getSample);
				//this[str_d_prop_name]._id = this._id;
				this.parsed = true;

			}
			return this.pstd_cache[str_d_prop_name];

		};

	})();


	var getPatched = function(node, struc_store, getSample, opts) {
		// var result = [];

		var match_stack = [ node ], i = 0;
		while (match_stack.length){
			var cur_node = match_stack.shift();
			var is_start_node = node === cur_node;
			var node_type = cur_node.nodeType;
			var directives_data = null;
			if (node_type == 1){
				directives_data = getPVData(cur_node, struc_store, getSample);
				// result.push(cur_node, directives_data);
			} else if (node_type == 8) {
				directives_data = getCommentPVData(cur_node, struc_store, getSample);
				// result.push(cur_node, directives_data);
			}

			var patched = !is_start_node && patchNode(cur_node, struc_store, directives_data, getSample, opts);
			if (patched) {
				match_stack.unshift(patched);
			}


			// if (directives_data.replacer) {
			// 	match_stack.unshift(directives_data.node);
			// }

			if (node_type == 1){
				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node.childNodes[i]);
				}
			}

		}
		// return result;
		return node;
	};

	var buildClone = function(onode, struc_store, sample_id) {
		var cloned = onode.cloneNode(true);

		var all_onodes = getAll(onode);
		var all_cnodes = getAll(cloned);

		if (all_onodes.length !== all_cnodes.length){
			throw new Error('something wrong');
		}

		for (var i = 0; i < all_onodes.length; i++) {
			all_cnodes[i].pvprsd = all_onodes[i].pvprsd;
			all_cnodes[i].pvprsd_inst = getNodeInstanceCount(all_onodes[i].pvprsd, struc_store);
			all_cnodes[i].pv_sample_id = sample_id;
		}

		return cloned;
	};

	PvSimpleSampler.prototype.getClone = function(opts) {
		if (!this.onode){
			return;
		}

		if (opts && !opts.key) {
			throw new Error('opts should have uniq key');
		}

		if (opts) {
			console.log("IMPLEMENT OPTIONS SUPPORT");
		}

		if (!this.nodes) {
			this.nodes = parser.parse(this.onode, this.struc_store, this.getSample, opts);
		}

		if (opts) {
			if (!this.patched_cache) {
				this.patched_cache = {};
			}
			if (!this.patched_cache[opts.key]) {
				this.patched_cache[opts.key] = getPatched(
					buildClone(this.onode, this.struc_store, this._id),
					this.struc_store, this.getSample, opts);
			}

			return buildClone(this.patched_cache[opts.key], this.struc_store, this._id);

		} else {
			if (!this.mod_root_node) {
				this.mod_root_node = getPatched(
					buildClone(this.onode, this.struc_store, this._id),
					this.struc_store, this.getSample, opts);
			}

			return buildClone(this.mod_root_node, this.struc_store, this._id);
		}

		// if (!this.parsed){
		// 	this.parsed = true;
		// 	parser.parse(this.onode, this.struc_store, this.getSample, opts);
		// }


	};
	PvSimpleSampler.prototype.clone = PvSimpleSampler.prototype.getClone;

	return PvSimpleSampler;
})();

var getCommentPVData = function(cur_node, struc_store, getSample) {
	return getCachedPVData(cur_node, struc_store, true, getSample, parser);
};

var getPVData = function(cur_node, struc_store, getSample) {
	return getCachedPVData(cur_node, struc_store, false, getSample, parser);
};

var parser = {
	config: config,
	comment_directives_p: d_parsers.comment_directives_p,
	directives_p: d_parsers.directives_p,
	scope_generators_p: d_parsers.scope_generators_p,
	parse: function(start_node, struc_store, getSample, opts) {
		//полный парсинг, без байндинга

		var result = [];

		var match_stack = [ start_node ], i = 0;
		while (match_stack.length){
			var cur_node = match_stack.shift();
			var node_type = cur_node.nodeType;
			var directives_data = null;
			if (node_type == 1){
				directives_data = getPVData(cur_node, struc_store, getSample);
				result.push(cur_node, directives_data);
			} else if (node_type == 8) {
				directives_data = getCommentPVData(cur_node, struc_store, getSample);
				result.push(cur_node, directives_data);
			}

			// if (directives_data.replacer) {
			// 	match_stack.unshift(directives_data.node);
			// }

			if (node_type == 1){
				for (i = 0; i < cur_node.childNodes.length; i++) {
					match_stack.push(cur_node.childNodes[i]);
				}
			}

		}
		return result;
	},
	parseEasy: function(start_node, vroot_node, struc_store, getSample) {
		//полный парсинг, байндинг одного scope (раньше и парсинг был только в пределах одного scope)
		var list_for_binding = [];
		var match_stack = [ start_node, true ];

		while (match_stack.length){
			var cur_node = match_stack.shift();
			var can_bind = match_stack.shift();
			var node_type = cur_node.nodeType;
			var directives_data = null;
			var is_start_node = cur_node === start_node;

			if (node_type == 1){
				var i = 0;
				var is_root_node = vroot_node === cur_node;
				directives_data = getPVData(cur_node, struc_store, getSample);

				var can_bind_children = (!directives_data.new_scope_generator || is_root_node);

				// if (directives_data.replacer) {
				// 	match_stack.unshift(directives_data.node);
				// } else {
					for (i = 0; i < cur_node.childNodes.length; i++) {
						// если запрещен байндинг текущего нода, то и его потомков тоже запрещён
						match_stack.push(cur_node.childNodes[i], can_bind && can_bind_children);
					}
					if (can_bind) {
						list_for_binding.push(is_root_node, cur_node, directives_data);
					}
				// }
			} else if (node_type == 8) {
				directives_data = getCommentPVData(cur_node, struc_store, getSample);
				// if (directives_data.replacer) {
					// match_stack.unshift(directives_data.node, can_bind);
				// } else
				if (can_bind) {
					list_for_binding.push(false, cur_node, directives_data);
				}
			}
			var patched = !is_start_node && patchNode(cur_node, struc_store, directives_data, getSample, null);
			if (patched) {
				match_stack.unshift(patched, can_bind);
			}
		}
		return list_for_binding;
	}
};

parser.PvSimpleSampler = PvSimpleSampler;

return parser;
});
