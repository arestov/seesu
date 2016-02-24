define(function(require) {
'use strict';

var hp = require('../helpers');
var getRightNestingName = hp.getRightNestingName;

var getDeclrConstr = function(app, md, item) {
	if (typeof item == 'function') {
		return item;
	} else if (typeof item == 'string') {
		return md.getConstrByPathTemplate(app, item);
	} else {
		return item;
	}
};

var getNestingConstr = function(app, md, nesting_name) {
	nesting_name = getRightNestingName(md, nesting_name);


	if (md[ 'nest_rqc-' + nesting_name ]) {
		var target = md[ 'nest_rqc-' + nesting_name ];
		if (Array.isArray(target)) {
			if (!target.constrs_array) {
				var result = [];
				var index = target[1];
				for (var prop in index) {
					if (!index.hasOwnProperty(prop)) {
						continue;
					} else {
						result.push( getDeclrConstr(app, md, index[prop]) );
					}

				}
				target.constrs_array = result;
			}

			return target.constrs_array;
		} else {
			return getDeclrConstr(app, md, target);
		}

	} else if (md[ 'nest_posb-' + nesting_name ]) {
		return constrsList(app, md, md[ 'nest_posb-' + nesting_name ]);
	} else if (md[ 'nest-' + nesting_name]) {
		var declr = md[ 'nest-' + nesting_name];
		return constrsList(app, md, declr[0]);
	}
};

function constrsList(app, md, items) {
	if (Array.isArray(items)) {
		var result = [];
		for (var i = 0; i < items.length; i++) {
			result.push(getDeclrConstr(app, md, items[i]));
		}
		return result;
	} else {
		return getDeclrConstr(app, md, items);
	}
}

return {
	getDeclrConstr: getDeclrConstr,
	getNestingConstr: getNestingConstr
};

});
