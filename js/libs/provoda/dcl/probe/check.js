define(function (require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var ProbeDcl = function (name, data) {
  this.name = name;
  this.type = data.main[0];
  this.main = data.main;
  this.steps_to_surface_limit = data.steps_to_surface_limit;
};
var checkApi = checkPrefix('probe-', ProbeDcl, '_probs');

return function checkProbe(self, props) {
  var probes = checkApi(self, props);

  if (!probes) {return;}

  // debugger;

  // self.nest_concat_nest_matches = [];
  //
	// for (var res in cnts) {
	// 	self.nest_concat_nest_matches.push(cnts[res]);
	// }
};

});
