define(['spv'], function(spv) {
"use strict";
var getTreeSample = function() {
	return {
		basetree: null,
		states: {
			stch: [],
			compx_deps: [],
			deep_compx_deps: [],
			
		},
		constr_children: {
			children: {},
			children_by_mn: {}
		},
		tree_children: {},
		m_children: {},
		merged_states: [],
		base_from_parent: null,
		base_root_constr_id: null
	};
};

var bCh = function(item, nesting_name, nesting_space, children_list_index, children_list) {
	var field_path = ['children', nesting_name, nesting_space];
	if (!children_list_index[field_path.join('{}')]) {
		children_list.push(field_path);
	}
};

var bChByMN = function(item, nesting_name, model_name, nesting_space, children_list_index, children_list) {
	var field_path = ['children_by_mn', nesting_name, model_name, nesting_space];
	if (!children_list_index[field_path.join('{}')]) {
		children_list.push(field_path);
	}
};

var iterateChildren = function(children, cb, arg1, arg2) {
	for (var nesting_name in children) {
		for (var nesting_space in children[nesting_name]) {
			cb(children[nesting_name][nesting_space], nesting_name, nesting_space, arg1, arg2);
		}
	}
};
var iterateChildrenByMN = function(children_by_mn, cb, arg1, arg2) {
	for (var nesting_name in children_by_mn) {
		for (var model_name in children_by_mn[nesting_name]) {
			for (var nesting_space in children_by_mn[nesting_name][model_name]) {
				cb(children_by_mn[nesting_name][model_name][nesting_space], nesting_name, model_name, nesting_space, arg1, arg2);
			}
		}
	}
};
var buildFreeChildren = function(tree, base_from_parent, base_root_constr_id) {
	var used_base = base_from_parent;
	var children_list_index = {}, children_list = [];
	if (used_base) {
		if (used_base.children) {
			iterateChildren(used_base.children, bCh, children_list_index, children_list);
		}
		if (used_base.children_by_mn) {
			iterateChildrenByMN(used_base.children_by_mn, bChByMN, children_list_index, children_list);
		}
		
	}
	if (base_from_parent && base_from_parent.states) {
		tree.merged_states = spv.collapseAll(tree.merged_states, base_from_parent.states);
	}
	for (var i = 0; i < children_list.length; i++) {
		var cur = children_list[i];

		var parent_basetree_chi = tree.basetree ? spv.getTargetField(tree.basetree, cur) : (base_from_parent && spv.getTargetField(base_from_parent, cur));

		var struc = getTreeSample();

		spv.setTargetField(tree.tree_children, cur, struc);
		spv.setTargetField(tree.m_children, cur, struc);
		buildFreeChildren(struc, parent_basetree_chi, base_root_constr_id);
		struc.base_from_parent = parent_basetree_chi;
		struc.base_root_constr_id = base_root_constr_id;



		if (!base_root_constr_id) {
			//debugger;
		}
	}
};

var getUsageTree = function(getUsageTree, root_view, base_from_parent, base_root_constr_id) {
	/*
	- collch
	- pv-view внутри .tpl
	- pv-view внутри .tpl нераскрытые

	*/

	/*
	{
		stch
		состояния-источники для compx 
		свои состояния как состояния-источники для compx внутри потомков
		используемые в шаблоне состояния (tpl, tpls, base_tree)

		шаблон, который задекларирован у потомка или шаблон, который родитель сам передаст потомку 
	}
	*/
	getUsageTree = getUsageTree || this.getUsageTree;


	/*
	собираем состояния из контроллера
	1) stch_hs
	2)  full_comlxs_list
	*/
	var tree = getTreeSample();

	var push = Array.prototype.push;


	tree.states.stch = (function() {

		return (this.stch_hs_list && this.stch_hs_list.slice()) || [];

	}).call(this);

	tree.states.compx_deps = (function() {
		if (!this.full_comlxs_list) {
			return [];
		}

		var result = [];

		var compxs_itself = [];

		for (var i = 0; i < this.full_comlxs_list.length; i++) {
			push.apply(result, this.full_comlxs_list[i].depends_on);
			compxs_itself.push(this.full_comlxs_list[i].name);
		}

		return spv.collapseAll(spv.arrayExclude(result, compxs_itself));
		
	}).call(this);


	tree.merged_states = spv.collapseAll(tree.states.stch, tree.states.compx_deps);

	tree.basetree = (function() {

		if (this.base_tree_list) {
			var i, cur;
			var arr = [];

			for (i = 0; i < this.base_tree_list.length; i++) {
				cur = this.base_tree_list[i];


				var sample_name = cur.sample_name;
				if (!sample_name && cur.part_name && typeof this.parts_builder[cur.part_name] == 'string') {
					sample_name = this.parts_builder[cur.part_name];
				}

				if (!sample_name) {
					throw new Error('can\'t get sampler');
				}
				var sampler = root_view.getSampler(sample_name);

				var structure_data = sampler.getStructure(cur.parse_as_tplpart);
	
				arr.push(structure_data);
				//this.structure_data
				
			}
			var merged_tree = {
				node_id: null,
				children: null,
				children_by_mn: null,
				states: null
			};

			var setUndefinedField = function(store, field_path, value) {
				var current_value = spv.getTargetField(store, field_path);
					if (!current_value) {
						spv.setTargetField(store, field_path, value);
					}
			};
			var nesting_name, nesting_space, field_path, model_name;

			var tree_id = [];

			for (i = 0; i < arr.length; i++) {
				cur = arr[i];
				tree_id.push(cur.node_id);
				if (cur.states) {
					if (!merged_tree.states) {
						merged_tree.states = [];
					}
					push.apply(merged_tree.states, cur.states);
				}

				if (cur.children) {
					if (!merged_tree.children) {
						merged_tree.children = {};
					}
					for (nesting_name in cur.children) {
						for (nesting_space in cur.children[nesting_name]) {
							field_path = [nesting_name, nesting_space];
							setUndefinedField(merged_tree.children, field_path, spv.getTargetField(cur.children, field_path));
						}
					}
				}

				if (cur.children_by_mn) {
					if (!merged_tree.children_by_mn) {
						merged_tree.children_by_mn = {};
					}
					for (nesting_name in cur.children_by_mn) {
						if (!merged_tree.children_by_mn[nesting_name]) {
							merged_tree.children_by_mn[nesting_name] = {};
						}
						for (model_name in cur.children_by_mn[nesting_name]) {
							for (nesting_space in cur.children_by_mn[nesting_name][model_name]) {
								field_path = [nesting_name, model_name, nesting_space];
								setUndefinedField(merged_tree.children_by_mn, field_path, spv.getTargetField(cur.children_by_mn, field_path));
							}
						}
					}
				}
			}
			merged_tree.node_id = tree_id.join('&');
			return merged_tree;
			
		} else {
			return null;
		}
		
	}).call(this);


	if (tree.basetree && tree.basetree.states) {
		tree.merged_states = spv.collapseAll(tree.merged_states, tree.basetree.states);
	}

	

	//создаём список для итерации по потомкам
	//могут быть и basetree и конструкторы для одного nest и space а может быть только basetree или только конструктор
	//нужно использовать всё



	var children_list_index = {};
	var children_list = [];

	if (this.children_views) {
		iterateChildren(this.children_views, bCh, children_list_index, children_list);
	}
	if (this.children_views_by_mn) {
		iterateChildrenByMN(this.children_views_by_mn, bChByMN, children_list_index, children_list);
	}

	var used_base = tree.basetree || base_from_parent;

	if (used_base) {
		if (used_base.children) {
			iterateChildren(used_base.children, bCh, children_list_index, children_list);
		}
		if (used_base.children_by_mn) {
			iterateChildrenByMN(used_base.children_by_mn, bChByMN, children_list_index, children_list);
		}
		
	}


	

	if (base_from_parent && base_from_parent.children) {
		//debugger;
	}

	var own_children = {
		children: this.children_views,
		children_by_mn: this.children_views_by_mn
	};

	for (var i = 0; i < children_list.length; i++) {
		var cur = children_list[i];
		var constr = spv.getTargetField(own_children, cur);
		//var basetree = tree.basetree &&  spv.getTargetField(tree.basetree, cur);
		var parent_basetree_chi;
		var chi_constr_id;

		var base_tree_chi = tree.basetree && spv.getTargetField(tree.basetree, cur);
		if (tree.basetree) {
			parent_basetree_chi = base_tree_chi;
			chi_constr_id = this.constr_id;
		} else {
			parent_basetree_chi = base_from_parent && spv.getTargetField(base_from_parent, cur);
			chi_constr_id = base_root_constr_id;
		}


		

		if (constr) {
			var struc = getUsageTree.call(constr.prototype, getUsageTree, root_view, parent_basetree_chi, parent_basetree_chi && chi_constr_id);
			spv.setTargetField(tree.constr_children, cur, struc);
			spv.setTargetField(tree.m_children, cur, struc);
		} else if (parent_basetree_chi) {
			var struc = getTreeSample();
			spv.setTargetField(tree.tree_children, cur, struc);
			spv.setTargetField(tree.m_children, cur, struc);
			buildFreeChildren(struc, parent_basetree_chi, parent_basetree_chi && chi_constr_id);
			struc.base_from_parent = parent_basetree_chi;
			struc.base_root_constr_id = chi_constr_id;
			//getTreeSample
		}
	}
	tree.base_from_parent = base_from_parent || null;
	tree.base_root_constr_id = base_root_constr_id || null;

	if (tree.base_from_parent && tree.base_from_parent.states) {
		tree.merged_states = spv.collapseAll(tree.merged_states, tree.base_from_parent.states);
	}

	return tree;
};
return getUsageTree;
});