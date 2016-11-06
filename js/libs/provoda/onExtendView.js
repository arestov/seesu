define(function (require) {
'use strict';
var spv = require('spv');
var cloneObj = spv.cloneObj;

return function(self, props, original) {
	if (props.tpl_events) {
		self.tpl_events = {};
		cloneObj(self.tpl_events, original.tpl_events);
		cloneObj(self.tpl_events, props.tpl_events);
	}

	if (props.tpl_r_events) {
		self.tpl_r_events = {};
		cloneObj(self.tpl_r_events, original.tpl_r_events);
		cloneObj(self.tpl_r_events, props.tpl_r_events);
	}
};
});
