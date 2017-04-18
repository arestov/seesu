define(function (require) {
'use strict';
var spv = require('spv');
var hp = require('../helpers');
var get_constr = require('./get_constr');

var getNestingConstr = get_constr.getNestingConstr;
var selecPoineertDeclr = hp.$v.selecPoineertDeclr;

var general_path = 'm_children.children.%replace_by_switch_nesting_name%.main.m_children.children_by_mn.pioneer'.split('.');
// usualy it will be 'm_children.children.map_slice.main.m_children.children_by_mn.pioneer';
var getPath = spv.memorize(function (switch_nesting_name) {
	var pth = general_path.slice();
	pth[2] = switch_nesting_name;
	return pth;
});

var children_path = 'm_children.children_by_mn.pioneer';

return function getUsageStruc(md, switch_nesting_name, used_data_structure, app) {
	var struc;

	var model_name = md.model_name;

	var dclrs_fpckgs = used_data_structure.collch_dclrs;
	var dclrs_selectors = used_data_structure.collch_selectors;

	var path = getPath(switch_nesting_name);

	var bwlev_dclr = selecPoineertDeclr(dclrs_fpckgs, dclrs_selectors, switch_nesting_name, model_name, 'main', true);
	if (!bwlev_dclr) {
		var default_struc = spv.getTargetField(used_data_structure, path)[ '$default' ];
		return spv.getTargetField(used_data_structure, path)[ model_name ] || default_struc;
	}

	var path_mod = 'm_children.children.' + switch_nesting_name + '.' + (bwlev_dclr.space || 'main');
	//+ '.m_children.children_by_mn.pioneer';
	var bwlev_struc = spv.getTargetField(used_data_structure, path_mod);
	var bwlev_dclrs_fpckgs = bwlev_struc.collch_dclrs;
	var bwlev_dclrs_selectors = bwlev_struc.collch_selectors;

	var pioneer_model_name = bwlev_dclr.is_wrapper_parent ? md.map_parent.model_name : model_name;
	var md_dclr = selecPoineertDeclr(bwlev_dclrs_fpckgs, bwlev_dclrs_selectors, 'pioneer', pioneer_model_name, (bwlev_dclr.space || 'main'), true);

	var children = spv.getTargetField(bwlev_struc, children_path);

	struc = spv.getTargetField(children, [pioneer_model_name, md_dclr.space]) || spv.getTargetField(children, ['$default', md_dclr.space]);

	if (!bwlev_dclr.is_wrapper_parent) {
		return struc;
	}

	var nestings = struc.m_children.children;
	var Constr = md.constructor;
	for (var nesting_name in nestings) {
		var items = getNestingConstr(app, md.map_parent, nesting_name);
		if (items) {
			if (Array.isArray(items)) {
				if (items.indexOf(Constr) != -1) {
					struc = nestings[nesting_name];
					break;
				}
			} else {
				if (items == Constr) {
					struc = nestings[nesting_name];
					break;
				}
			}
		}
	}
	return struc;
};
})
