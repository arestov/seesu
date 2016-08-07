define(function(require) {
'use strict';
var d_parsers = require('./directives_parsers');
var getCachedPVData = require('./getCachedPVData');

var patching_directives = d_parsers.patching_directives;
var getIndexList = d_parsers.getIndexList;

var patching_directives_list = getIndexList(patching_directives);
var setStrucKey = getCachedPVData.setStrucKey;

var patchNode = function(parser, node, struc_store, directives_data, getSample, opts) {
	for (var i = 0; i < patching_directives_list.length; i++) {
		var cur = patching_directives_list[i];
		if (!directives_data || !directives_data.instructions[cur]) {
			continue;
		}
		// cur
		// node, params, getSample, opts
		var result = patching_directives[cur].call(parser, node, directives_data.instructions[cur], getSample, opts);
		if (!result) {
			return;
		}

		if (!result.directives_data && !result.pvprsd) {
			throw new Error('should be directives_data');
		}
		if (result.directives_data) {
			setStrucKey(result, struc_store, result.directives_data);
		}
		return result;
	}
};
return patchNode;
});
