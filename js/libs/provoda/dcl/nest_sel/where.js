define(function (require) {
'use strict';
var spv = require('spv');
var startsWith = spv.startsWith;

return function (self, where) {
  if (!where) {
    return;
  }
  if (Array.isArray(where)) {
    self.args_schema = getArgsSchema(where[0]);

    if (typeof where[1] !== 'function') {
      throw new Error('where[1] should be func');
    }
    self.selectFn = where[1];
    self.where_states = where[0];
  }
};

function isForDeep(name) {
	return startsWith(name, ">") && name.slice(1);
}

function getArgsSchema(list) {
	var args_schema = [];
	for (var i = 0; i < list.length; i++) {
		var cur = list[i];
		var state_name = isForDeep(cur);
		if (state_name) {
			args_schema.push({
				type: 'deep',
				name: state_name
			});

		} else {
			args_schema.push({
				type: 'base',
				name: cur
			});

		}
	}
	return args_schema;
}
});
