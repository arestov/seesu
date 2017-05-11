define(function (require) {
'use strict';
var pvState = require('../utils/state');

var createLevel = require('./createLevel');
var getBwlevFromParentBwlev = require('./getBwlevFromParentBwlev');

return function _goDeeper(BWL, map, md, parent_bwlev){
	// без parent_bwlev нет контекста
	if (!parent_bwlev) {
		// будем искать parent_bwlev на основе прямой потомственности от уровня -1
		parent_bwlev = getBwlevInParentBwlev(md.map_parent, map);
	}

	var parent_md = md.map_parent;

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

	return createLevel(BWL, pvState(parent_lev, 'probe_name'), map_level_num, parent_lev, md, map);
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
});
