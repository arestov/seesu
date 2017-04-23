define(function (require) {
'use strict';

var getBwlevFromParentBwlev = require('./getBwlevFromParentBwlev');
var ba_canReuse = require('./ba_canReuse');
var _goDeeper = require('./_goDeeper');

var ba_inUse = ba_canReuse.ba_inUse;

return function showMOnMap(BWL, map, model, bwlev) {

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

		bwlev_parent = showMOnMap(BWL, map, parent_md, bwlev && bwlev.map_parent, true);
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
			result = _goDeeper(BWL, map, model, bwlev && bwlev.map_parent);
		}
	}

	return result;
	//
};
});
