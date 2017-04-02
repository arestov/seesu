define(function (require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var transportName = require('../../dcl/probe/transportName');
var spv = require('spv');
var nil = spv.nil;

var NestProbeDcl = function (name, View) {
  this.name = name;
  this.probe_view = View;
  this.transport_name = transportName(name);
};

var checkNestProbes = checkPrefix('probe-', NestProbeDcl, '_probe');

return function check(self, props) {
  var probes = checkNestProbes(self, props);

  if (nil(probes)) {return;}

  props.children_views = spv.cloneObj({}, props.children_views);
  self.children_views = spv.cloneObj({}, self.children_views);

  for (var name in probes) {
    var cur = probes[name];
    props.children_views[cur.transport_name] = self.children_views[cur.transport_name] = cur.probe_view;
  }
};

});
