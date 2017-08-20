define(function(require) {
"use strict";
var pv = require('pv');
var spv = require('spv');
var changeBridge = require('./provoda/bwlev/changeBridge');
var createLevel = require('./provoda/bwlev/createLevel');
var BrowseLevel = require('./provoda/bwlev/BrowseLevel');
var showMOnMap = require('./provoda/bwlev/showMOnMap');
var showInterest = require('./provoda/bwlev/showInterest');
var getBwlevFromParentBwlev = require('./provoda/bwlev/getBwlevFromParentBwlev');
var get_constr = require('./provoda/structure/get_constr');

var routePathByModels = require('./provoda/routePathByModels');

var getSPIConstr = routePathByModels.getSPIConstr;
var getSPI= routePathByModels.getSPI;

var cloneObj = spv.cloneObj;

var getDeclrConstr = get_constr.getDeclrConstr;

/*
поправить навигацию
проверить работу истории
поправить остатки wantSong

генерируемые плейлисты

*/

function setStartBwlev(probe_name, self, mainLevelResident) {
	self.mainLevelResident = mainLevelResident;
	self.start_bwlev = createLevel(BrowseLevel, probe_name, -1, false, self.mainLevelResident, self);
}

var BrowseMap = {};

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

BrowseMap.showInterest = showInterest;

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
        if (data['url_part'] && !self.hasComplexStateFn('url_part')){
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
		var bwlev = showMOnMap(BrowseLevel, this.app.map, this);
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

function hookRoot(rootmd, start_page) {
	var bwlev_root = createLevel(BrowseLevel, '', -2, null, rootmd, null);
	if (start_page) {
		setStartBwlev('map_slice', bwlev_root, start_page);
	}

	return bwlev_root;
}

BrowseMap.hookRoot = hookRoot;
BrowseMap.changeBridge = changeBridge;
return BrowseMap;
});
