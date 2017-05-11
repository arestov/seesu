define(function (require) {
'use strict';
var ba_canReuse = require('./ba_canReuse');
var showInterest = require('./showInterest')
var _goDeeper = require('./_goDeeper')
var getBwlevFromParentBwlev = require('./getBwlevFromParentBwlev')
var showMOnMap = require('./showMOnMap')

var limits = {
	same_model_matches: 1,
	big_steps: 4
};

return function followFromTo(BWL, map, parent_bwlev, end_md) {
	var cutted_parents = getLimitedParent(parent_bwlev, end_md);

	if (cutted_parents) {
		var last_cutted_parentbw = showInterest(map, cutted_parents);
		return _goDeeper(BWL, map, end_md, last_cutted_parentbw);
	}
	// parent_bwlev.showOnMap();

	var bwlev = getBwlevFromParentBwlev(parent_bwlev, end_md);

	if (ba_canReuse(bwlev)) {
		return showMOnMap(BWL, map, end_md, bwlev);
	}
	// !!!!showMOnMap(BWL, map, parent_bwlev.getNesting('pioneer'), parent_bwlev);
	return _goDeeper(BWL, map, end_md, parent_bwlev);
};


function isBigStep(cur, cur_child) {
	return cur.map_parent && cur.map_parent.getNesting('pioneer') != cur_child.map_parent;
};


function getLimitedParent(parent_bwlev, end_md){
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

function getNavGroups(bwlev) {
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


function getEdgeSimilarModelPos(bwlev, model_name, limit) {
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

function countGroups(bwlev) {
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
})
