define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var NestCntDeclr = require('./item')
var handle = function(self, cnts) {
  self.nest_concat_nest_matches = [];

  for (var res in cnts) {
    self.nest_concat_nest_matches.push(cnts[res]);
  }
}
var checkApi = checkPrefix('nest_conj-', NestCntDeclr, '_chi_nest_conj', handle);

return checkApi;

});
