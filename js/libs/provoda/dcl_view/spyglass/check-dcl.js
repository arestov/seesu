define(function (require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var transportName = function(spyglass_name) {
  return 'spyglass__' + spyglass_name.replace('/', '__');
}
var spv = require('spv');
var nil = spv.nil;

var NestSpyglassDcl = function (name, data) {
  this.name = name;

  var View = data[0];

  var params = data[1];
  var context_md = nil(params && params.context_md) ? true : params.context_md;
  var bwlev = nil(params && params.bwlev) ? true : params.bwlev;

  this.spyglass_view = View;
  this.context_md = context_md;
  this.bwlev = bwlev;

  this.nest_name = transportName(name);
};

var checkNestSpyglasses = checkPrefix('spyglass-', NestSpyglassDcl, '_spyglass');

return function check(self, props) {
  var spyglasses = checkNestSpyglasses(self, props);

  if (nil(spyglasses)) {return;}

  props.children_views = spv.cloneObj({}, props.children_views);
  self.children_views = spv.cloneObj({}, self.children_views);

  for (var name in spyglasses) {
    var cur = spyglasses[name];
    props.children_views[cur.nest_name] = self.children_views[cur.nest_name] = cur.spyglass_view;
  }
};

});
