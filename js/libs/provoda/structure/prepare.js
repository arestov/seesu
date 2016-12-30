define(function (require) {
'use strict';
var Model = require('../Model');
var mark = require('./mark');
var spv = require('spv');

var Probe = spv.inh(Model, {
  naming: function(fn) {
    return function Probe(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
});

return function prepare(root) {
  var augmented = spv.inh(root, {}, {
    'chi-__probe': Probe
  });
  return mark(augmented, augmented);
};

});
