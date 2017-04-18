define(function(require) {
"use strict";
var pv = require('pv');
var spv = require('spv');
var get_constr = require('./provoda/structure/get_constr');
var flatStruc = require('./provoda/structure/flatStruc');
var routePathByModels = require('./provoda/routePathByModels');
var getUsageStruc = require('./provoda/structure/getUsageStruc');
var getModelSources = require('./provoda/structure/getModelSources');

var getSPIConstr = routePathByModels.getSPIConstr;
var getSPI= routePathByModels.getSPI;

var pvState = pv.state;
var cloneObj = spv.cloneObj;
var countKeys = spv.countKeys;

var getDeclrConstr = get_constr.getDeclrConstr;

/*
поправить навигацию
проверить работу истории
поправить остатки wantSong

генерируемые плейлисты

*/

function setStartBwlev(self, mainLevelResident) {
	self.mainLevelResident = mainLevelResident;
	self.start_bwlev = createLevel(-1, false, self.mainLevelResident, self);
}

var BrowseMap = {};

function _goDeeper(map, md, parent_bwlev){
	// без parent_bwlev нет контекста
	if (!parent_bwlev) {
		// будем искать parent_bwlev на основе прямой потомственности от уровня -1
		parent_bwlev = getBwlevInParentBwlev(md.map_parent, map);
	}

	var parent_md = md.map_parent;

	var target_lev;

		var map_level_num;
		if (parent_bwlev) {
			map_level_num = parent_bwlev.state('map_level_num') + 1;
		} else {
			if (typeof md.map_level_num != 'number') {
				throw new Error('md must have `map_level_num`');
			}
			map_level_num = md.map_level_num;
		}
		// нужно чтобы потом использовать все уровни-предки
		var parent_lev = parent_bwlev;
		if (!parent_lev && parent_md) {
			throw new Error('`md.lev` prop dissalowed');
		}

		target_lev = createLevel(map_level_num, parent_lev, md, map);

	return target_lev;

};

function createLevel(num, parent_bwlev, md, map) {
	var bwlev = getBWlev(md, parent_bwlev, num, map);
	bwlev.map = map;
	return bwlev;
}

var limits = {
	same_model_matches: 1,
	big_steps: 4
};

var isBigStep = function(cur, cur_child) {
	return cur.map_parent && cur.map_parent.getNesting('pioneer') != cur_child.map_parent;
};

var getNavGroups = function(bwlev) {
	var cur_group = [];
	var groups = [cur_group];

	var cur = bwlev;
	var cur_child = cur.getNesting('pioneer');
	while (cur) {
		cur_group.push(cur_child);

		if (isBigStep(cur, cur_child)) {
			cur_group = [];
			groups.push(cur_group);
		}

		cur = cur.map_parent;
		cur_child = cur && cur.getNesting('pioneer');
	}
	return groups;
};


var getEdgeSimilarModelPos = function(bwlev, model_name, limit) {
	var edge_group_num = -1;
	var groups_of_similar = 0;
	var groups_count = 0;
	var cur = bwlev;
	var cur_child = cur.getNesting('pioneer');
	while (cur) {
		if (cur_child.model_name == model_name) {
			if (edge_group_num != groups_count) {
				edge_group_num = groups_count;
				groups_of_similar++;
				if (groups_of_similar == limit) {
					break;
				}
			}
		}

		if (isBigStep(cur, cur_child)) {
			groups_count++;
		}

		cur = cur.map_parent;
		cur_child = cur && cur.getNesting('pioneer');
	}
	return groups_of_similar == limit ? edge_group_num : -1;
};


var countGroups = function(bwlev) {
	var groups_count = 1;
	var cur = bwlev;
	var cur_child = cur.getNesting('pioneer');
	while (cur) {

		if (isBigStep(cur, cur_child)) {
			groups_count++;
		}

		cur = cur.map_parent;
		cur_child = cur && cur.getNesting('pioneer');
	}
	return groups_count;
};


function interestPart(group){
	return {
		md: group[0],
		distance: group.length
	};
}

var getLimitedParent = function(parent_bwlev, end_md){
	var pioneer = parent_bwlev.getNesting('pioneer');
	// var pre_mn = pioneer.model_name == end_md.model_name;
	var pre_group = pioneer != end_md.map_parent;


	// var cur = parent_bwlev;
	// var cur_child = end_md;
	// var counter = 0;

	// var big_steps = 0;
	// var same_model_matches = 0;

	// var last_ok;

	// var cut = false;


	var groups_count = countGroups(parent_bwlev);
	var all_groups_count = groups_count + (pre_group ? 1 : 0);


	var similar_model_edge = getEdgeSimilarModelPos(parent_bwlev, end_md.model_name, 3);

	if (all_groups_count > 3 || similar_model_edge != -1) {

		var count_slice = 3 + ( pre_group ? -1 : 0 );
		var sm_slice = similar_model_edge == -1 ? Infinity : similar_model_edge + 1;
		var slice = Math.min(count_slice, sm_slice);
		var groups = getNavGroups(parent_bwlev);
		var sliced = groups.slice(0, slice);

		return sliced.map(interestPart).reverse();
	}

	return false;
};

var followFromTo = function(map, parent_bwlev, end_md) {
	var cutted_parents = getLimitedParent(parent_bwlev, end_md);

	var result;

	if (cutted_parents) {
		var last_cutted_parentbw = BrowseMap.showInterest(map, cutted_parents);
		result = _goDeeper(map, end_md, last_cutted_parentbw);
	} else {
		// parent_bwlev.showOnMap();

		var bwlev = getBwlevFromParentBwlev(parent_bwlev, end_md);

		if (ba_canReuse(bwlev)) {
			result = showMOnMap(map, end_md, bwlev);
		} else {
			showMOnMap(map, parent_bwlev.getNesting('pioneer'), parent_bwlev);
			result = _goDeeper(map, end_md, parent_bwlev);
		}
	}

	return result;
};

function showMOnMap(map, model, bwlev) {

	var is_start = model.map_level_num == -1;

	if (is_start) {
		bwlev = map.start_bwlev;
	}

	var bwlev_parent = false;

	if (!is_start && (!bwlev || !ba_inUse(bwlev))){
		// если модель не прикреплена к карте,
		// то прежде чем что-то делать - находим и отображаем "родительску" модель
		var parent_md;
		if (bwlev) {
			parent_md = bwlev.map_parent.getNesting('pioneer');
		} else {
			parent_md = model.map_parent;
		}

		bwlev_parent = showMOnMap(map, parent_md, bwlev && bwlev.map_parent, true);
	}

	var result = null;

	if (bwlev_parent || bwlev_parent === false) {

		if (bwlev_parent) {
			if (!bwlev) {
				bwlev = getBwlevFromParentBwlev(bwlev_parent, model);
			}
		}

		if (model.state('has_no_access')) {
			model.switchPmd();
		} else if (ba_canReuse(bwlev) || is_start){//если модель прикреплена к карте
			result = bwlev;
		} else {
			if (!model.model_name){
				throw new Error('model must have model_name prop');
			}
			// this.bindMMapStateChanges(model, model.model_name);
			result = _goDeeper(map, model, bwlev && bwlev.map_parent);
		}
	}

	return result;
	//
};

function getBwlevFromParentBwlev(parent_bwlev, md) {
	return parent_bwlev.children_bwlevs[md._provoda_id];
};

function getBwlevInParentBwlev(md, map) {
	if (!md.map_parent) {
		if (map.mainLevelResident != md) {
			throw new Error('root map_parent must be `map.mainLevelResident`');
		}
		return map.start_bwlev;
	}

	var parent_bwlev = getBwlevInParentBwlev(md.map_parent, map);
	return getBwlevFromParentBwlev(parent_bwlev, md);
};

var getCommonBwlevParent = function(bwlev, md) {
	var cur_bwlev = bwlev;
	while (cur_bwlev) {
		var pioneer = cur_bwlev.getNesting('pioneer');

		var cur_md = md;
		while (cur_md) {
			if (pioneer == cur_md) {
				return cur_bwlev;
			}
			cur_md = md.map_parent;
		}

		cur_bwlev = cur_bwlev.map_parent;
	}
};

var getPathToBwlevParent = function(bwlev, md) {
	var pioneer = bwlev.getNesting('pioneer');
	var matched;
	var result = [];
	var cur = md;
	while (cur) {

		if (pioneer == cur) {
			matched = true;
			break;
		}

		result.push(cur);

		cur = cur.map_parent;
	}

	if (!matched) {
		throw new Error('trying to get path for unconnected parts');
	}
	return result.reverse();

};


BrowseMap.getConnectedBwlev = function(bwlev, md) {
	var common_bwlev = getCommonBwlevParent(bwlev, md);
	var path = getPathToBwlevParent(common_bwlev, md);
	var cur = common_bwlev;
	for (var i = 0; i < path.length; i++) {
		cur = getBwlevFromParentBwlev(common_bwlev, md);
	}
	return cur;
};

BrowseMap.getBwlevFromParentBwlev = getBwlevFromParentBwlev;

var BrowseLevel = spv.inh(pv.Model, {
	strict: true,
	naming: function(fn) {
		return function BrowseLevel(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	init: function(self, opts, data, params, more, states) {
		self.children_bwlevs = {};
		self.model_name = states['model_name'];

		if (!self.model_name) {
			throw new Error('must have model name');
		}

    var pioneer = states['pioneer'];

		self.ptree = [self];
		self.rtree = [pioneer];

		if (self.map_parent) {
			self.ptree = self.ptree.concat(self.map_parent.ptree);
			self.rtree = self.rtree.concat(self.map_parent.rtree);
		}

	}
}, {
	getParentMapModel: function() {
		return this.map_parent;
	},
	showOnMap: function() {
		showMOnMap(this.map, this.getNesting('pioneer'), this);
		changeBridge(this);
	},
	requestPage: function(id) {
		var md = pv.getModelById(this, id);
		var pioneer = this.getNesting('pioneer');

		var target_is_deep_child;

		var cur = md;
		var bwlev_children = [];

		while (cur.map_parent) {
			bwlev_children.push(cur);

			if (cur.map_parent == pioneer) {
				target_is_deep_child = true;
				break;
			}
			cur = cur.map_parent;
		}

		if (!target_is_deep_child) {
			return md.requestPage();
		}

		bwlev_children = bwlev_children.reverse();

		var map = md.app.map;

		showMOnMap(map, pioneer, this);

		var last_called = null;
		var parent_bwlev = this;
		for (var i = 0; i < bwlev_children.length; i++) {
			if (!parent_bwlev) {
				continue;
			}
			var cur_md = bwlev_children[i];

			if (cur_md.state('has_no_access')) {
				parent_bwlev = null;
				cur_md.switchPmd();
			} else {
				parent_bwlev = _goDeeper(map, cur_md, parent_bwlev);
				last_called = parent_bwlev;
			}
		}

		changeBridge(last_called);
	},
	zoomOut: function() {
		if (this.state('mp_show')) {
			changeBridge(this);
		}
	},
	followTo: function(id) {
		var md = pv.getModelById(this, id);
		if (md.getRelativeModel) {
			md = md.getRelativeModel();
		}
		// md.requestPage();
		var bwlev = followFromTo(this.map, this, md);
		changeBridge(bwlev);
	},
	'stch-mpl_attached': function(target, state) {
		var md = target.getNesting('pioneer');
		var obj = pvState(md, 'bmpl_attached');
		obj = obj ? cloneObj({}, obj) : {};
		obj[target._provoda_id] = state;
		pv.update(md, 'bmpl_attached', obj);
		pv.update(md, 'mpl_attached', countKeys(obj, true));
	},
	'compx-map_slice_view_sources': [
		['struc', '@pioneer'],
		function (struc, pioneer) {
			if (!pioneer) {return;}

			return [pioneer._network_source, getStrucSources(pioneer, struc)];
		}
 	],
	'compx-struc': [
		['@one:used_data_structure:map', '@pioneer', 'map_level_num'],
		function(struc, pioneer, num) {
			if (num == -2) {return}
			if (!struc || !pioneer) {return;}
			return getUsageStruc(pioneer, 'map_slice', struc, this.app);
		}
	],
	'compx-to_init': [
		['mp_dft', 'struc'],
		function(mp_dft, struc) {
			if (!mp_dft || mp_dft > 2 || !struc) {return;}
			return struc;
		}
	],
	'stch-to_init': function(target, struc) {
		if (!struc) {return;}

		var md = target.getNesting('pioneer');
		var idx = md.idx_nestings_declarations;
		if (!idx) {return;}

		var obj = struc.main.m_children.children;
		for (var name in obj) {
			var nesting_name = pv.hp.getRightNestingName(md, name);
			var el = idx[nesting_name];
			if (!el) {continue;}
			if (el.init_state_name && (el.init_state_name !== 'mp_show' && el.init_state_name !== 'mp_has_focus')) {
				continue;
			}
			if (md.getNesting(el.nesting_name)) {
				continue;
			}
			md.updateNesting(el.nesting_name, pv.getSubpages( md, el ));
		}
	},
	'compx-to_load': [
		['mp_dft', 'struc'],
		function(mp_dft, struc) {
			if (!mp_dft || mp_dft > 1 || !struc) {return;}
			return struc;
		}
	],
	'stch-to_load': function(target, struc) {
		if (!struc) {return;}

		var md = target.getNesting('pioneer');
		var idx = md.idx_nestings_declarations;
		if (!idx) {return;}

		var obj = struc.main.m_children.children;
		for (var name in obj) {
			var nesting_name = pv.hp.getRightNestingName(md, name);
			var el = idx[nesting_name];
			if (!el) {continue;}

			var item = pv.getSubpages( md, el );
			if (Array.isArray(item) || !item.preloadStart) {
				continue;
			}
			if (item.full_comlxs_index['preview_list'] || item.full_comlxs_index['preview_loading']) {
				continue;
			}
			item.preloadStart();
		}
	},
	'compx-struc_list': [['struc'], function(struc) {
		if (!this.getNesting('pioneer') || !struc) {return;}
		return flatStruc(this.getNesting('pioneer'), struc);
	}],
	'compx-supervision': [
		[], function () {
			return {
				needy: this,
				store: {},
				reqs: {},
				is_active: {}
			};
		}
	],
	'compx-to_load_all': [
		['mp_dft', 'struc_list', 'supervision'],
		function(mp_dft, struc, supervision) {
			return {
				inactive: !mp_dft || mp_dft > 1 || !struc,
				list: struc,
				supervision: supervision
			};
		}
	],
	'stch-to_load_all': function(target, obj, prev) {
		if (!obj.list) {
			return;
		}

		if (obj.inactive == (prev && prev.inactive)) {
			return;
		}

		var md = target.getNesting('pioneer');

		if (!obj.inactive) {
			for (var i = 0; i < obj.list.length; i++) {
				var cur = obj.list[i];
				if (!cur) {continue;}
				md.addReqDependence(obj.supervision, cur);
			}

		} else if (prev && prev.list){
			for (var i = 0; i < prev.list.length; i++) {
				var cur = prev.list[i];
				if (!cur) {continue;}
				md.removeReqDependence(obj.supervision, cur);
			}
		}

	}
});

function getBWlev(md, parent_bwlev, map_level_num, map){
	var cache = parent_bwlev && parent_bwlev.children_bwlevs;
	var key = md._provoda_id;
	if (cache && cache[key]) {
		return cache[key];
	}

	var bwlev = pv.create(BrowseLevel, {
		map_level_num: map_level_num,
		model_name: md.model_name,
		pioneer: md
	}, {
		nestings: {
			pioneer: md,
			map: map
		}
	}, parent_bwlev, md.app);

	if (cache) {
		cache[key] = bwlev;
	};

	return bwlev;
};

var getDistantModel = function(md, distance){
	var cur = md;
	for (var i = 1; i < distance; i++) {
		cur = cur.map_parent;
	}
	return cur;
};

BrowseMap.showInterest = function(map, interest) {
	if (!interest.length) {
		return showMOnMap(map, map.mainLevelResident);
	}

	var first = interest.shift();
	// first.md.lev fixme

	var parent_bwlev = showMOnMap(first.md.app.map, first.md);

	for (var i = 0; i < interest.length; i++) {
		var cur = interest[i];

		var distance = cur.distance;
		if (!distance) {throw new Error('must be distance: 1 or more');}
		while (distance) {
			var md = getDistantModel(interest[i].md, distance);
			parent_bwlev = _goDeeper(map, md, parent_bwlev);
			distance--;
		}


	}

	return parent_bwlev;
};


var interest_part = /(\#(?:\d*\:)?)/gi;
BrowseMap.getUserInterest = function(pth_string, start_md) {
	/*
		/users/me/lfm:neighbours#3:/users/lfm:kolczyk0
	*/
	var parts = pth_string.split(interest_part);

	var interest = [];

	while (parts.length) {
		var path = parts.pop();
		var distance_part = parts.pop();
		var distance = distance_part && distance_part.slice(1, distance_part.length - 1 );
		interest.push({
			md: BrowseMap.routePathByModels(start_md, path),
			// path: path,
			distance: distance || 1
		});
	}

	return interest.reverse();
};

BrowseMap.routePathByModels = routePathByModels;

BrowseMap.getDeclrConstr = getDeclrConstr;

function getStrucSources(md, struc) {
	//console.log(struc);
	var result = {};
	for (var space_name in struc) {
		result[space_name] = getModelSources(md.app, md, struc[space_name]);
		//var cur = struc[space_name];
	}
	return result;
	//console.log(md.model_name, md.constr_id, result);
};

BrowseMap.Model = spv.inh(pv.HModel, {
	strict: true,
	naming: function(fn) {
		return function BrowseMapModel(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
  init: function (self, opts, data) {
    if (!self.skip_map_init){
      if (data) {
        if (data['url_part']){
          self.initState('url_part', data['url_part']);
        }
        if (data['nav_title']){
          self.initState('nav_title', data['nav_title']);
        }
      }
    }

    self.lists_list = null;
    // self.map_level_num = null;
    self.head_props = self.head_props || null;

    /*
      результат работы этого кода - это
      1) установленное значение head_props
      2) состояния url_part и nav_title
      3) установленное значение sub_pa_params


      использование data_by_hp подразумевает, что у родителя есть head_props
      head_props могут быть собраны вручную, но в основном собирается с помощью hp_bound
      hp_bound использует data и если будет ссылатся на родителя,
        то sub_pa_params родителя, sub_pa_params может передаваться и непосредственно как data

    */


    if (self.hp_bound && !data) {
      throw new Error('pass data arg!');
    } else {
      if (self.head_props) {
        console.log('already has head_props');
      } else if (self.hp_bound) {

        var complex_obj = {
          '--data--': null
        };

        if (self.map_parent.sub_pa_params) {
          cloneObj(complex_obj, self.map_parent.sub_pa_params);
        }

        complex_obj['--data--'] = data;

        self.head_props = self.hp_bound(complex_obj);
      }
    }

    opts = opts || {};


    if (self.data_by_hp && typeof self.data_by_hp == 'function') {
      self.sub_pa_params = self.data_by_hp(data);
    }



    if (self.allow_data_init) {
      self.updateManyStates(data);
    }

    if (self.preview_nesting_source) {
      self.on('child_change-' + self.preview_nesting_source, function(e) {
        pv.updateNesting(this, 'preview_list', e.value);
      });
    }
  }
}, {
	network_data_as_states: true,
	'__required-nav_title': true,
	preview_nesting_source: 'lists_list',
	/*

	*/
	getSPIConstr: function(sp_name) {
		return getSPIConstr(this, sp_name);
	},
	getSPI: function(sp_name) {
		return getSPI(this, sp_name);
	},
	preloadNestings: function(array) {
		//var full_list = [];
		for (var i = 0; i < array.length; i++) {
			var md = this.getNesting(array[i]);
			if (md) {
				md.preloadStart();
			}

		}
	},
	requestPage: function() {
		this.showOnMap();
	},
	showOnMap: function() {
		var bwlev = showMOnMap(this.app.map, this);
		changeBridge(bwlev);
	},
	getParentMapModel: function() {
		return this.map_parent;
	},
	setFullUrl: function(url) {
		pv.update(this, 'mp_full_url ', url);
	},
	getTitle: function() {
		return this.state('nav_title');
	},
	getURL: function() {
		return '';
	}
});

function ba_inUse(bwlev){
	return bwlev.state('mp_show');
}

function ba_isOpened(bwlev){
	return !!bwlev.map && !bwlev.closed;
}

function ba_canReuse(bwlev) {
	//если модель прикреплена к карте
	return bwlev && (ba_inUse(bwlev) || !ba_isOpened(bwlev));
}

function changeBridge(bwlev) {
	bwlev.map.bridge_bwlev = bwlev;
	bwlev.map.trigger('bridge-changed', bwlev);

	return bwlev;
}

function hookRoot(rootmd, start_page) {
	var bwlev_root = createLevel(-2, null, rootmd, null);
	if (start_page) {
		setStartBwlev(bwlev_root, start_page);
	}

	return bwlev_root;
}

BrowseMap.hookRoot = hookRoot;
BrowseMap.changeBridge = changeBridge;
return BrowseMap;
});
