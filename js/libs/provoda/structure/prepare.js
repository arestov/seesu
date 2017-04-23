define(function (require) {
'use strict';
var Model = require('../Model');
var mark = require('./mark');
var spv = require('spv');
var BrowseLevel = require('../bwlev/BrowseLevel');

var Probe = spv.inh(Model, {
  naming: function(fn) {
    return function Probe(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
}, {
  inti: function(self) {
    self.bwlevs = {};
  },
  'compx-struc': [
    ['@one:struc:owner_bwlev', 'name'],
    function(struc, name) {
      if (!struc) {return;}

      console.log('---------Probe', name, struc.main.m_children.children);
      return struc.main.m_children[name];
    }
  ]
});

BrowseLevel.prototype.BWL = BrowseLevel;

return function prepare(root) {
  var augmented = spv.inh(root, {}, {
    'chi-__probe': Probe
  });
  return mark(augmented, augmented);
};

});
