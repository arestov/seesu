define(function(require) {
'use strict';
var spv = require('spv');
var pvState = require('pv/state')
var pvUpdate = require('pv/update');
var updateNesting = require('pv/updateNesting');
var getModelById = require('../../utils/getModelById');
var getKey = require('./getKey');
var getSPByPathTemplate = require('../../initDeclaredNestings').getSPByPathTemplate;

return function(request) {
  var self = this;
  var requests_index = spv.cloneObj({}, pvState(self, 'spyglasses_requests'));

  var spyglass_key = getKey(request, self);
  var old_index = pvState(self, 'spyglasses_index') || {};
  var index = ensureSpyglass(self, old_index, spyglass_key, request)
  var spyglass = index[spyglass_key];

  requests_index[request.key] = spyglass;

  if (old_index[spyglass_key] !== index[spyglass_key]) {
    var list = (self.getNesting('spyglasses') || []).slice();
    list.push(getModelById(self, spyglass))
    updateNesting(self, 'spyglasses', list)
  }

  pvUpdate(self, 'spyglasses_index', index)
  pvUpdate(self, 'spyglasses_requests', requests_index);
}

function getModel(bwlev, steps) {
  var self = bwlev.getNesting('pioneer');

  if (steps === true) {
    return self;
  }

  var cur = self;
  for (var i = 0; i < steps.length; i++) {
    cur = cur.map_parent;
  }
  return cur;
}

function ensureSpyglass(self, index, key, request) {
  if (index[key]) {
    return index;
  }

  var path = request.name + ((key && key !== request.name) ? ('/' + key) : '');

  var spyglass = getSPByPathTemplate(self.app, self, path)

  var new_index = spv.cloneObj({}, index);

  new_index[key] = spyglass._provoda_id;

  return new_index;
}


})
