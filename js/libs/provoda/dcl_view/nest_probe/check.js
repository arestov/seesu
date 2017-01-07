define(function (require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var transportName = require('../../dcl/probe/transportName');

var NestProbeDcl = function (name, data) {
  this.name = name;
  this.probe_name = data.probe_name;
  this.source = data.source;
};

var checkNestProbes = checkPrefix('nest_probe-', NestProbeDcl, '_nest_probe');

return function check(self, props) {
  // kinda dead code

  var probes = checkNestProbes(self, props);

  if (!probes) {return;}

  var by_transport_name = {};

  for (var name in probes) {
    if (!probes.hasOwnProperty(name)) {continue;}

    var cur = probes[name];
    by_transport_name[transportName(cur.probe_name)] = cur;
  }

  self._nest_probe_transports = by_transport_name;

  // debugger;

  // self.nest_concat_nest_matches = [];
  //
	// for (var res in cnts) {
	// 	self.nest_concat_nest_matches.push(cnts[res]);
	// }
};

});
