define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var NestCntDeclr = require('./item')
var checkApi = checkPrefix('nest_conj-', NestCntDeclr, '_chi_nest_conj');

return function check(self, props) {
  var cnts = checkApi(self, props);
  if (!cnts) {return;}

  self.nest_concat_nest_matches = [];

  for (var res in cnts) {
    self.nest_concat_nest_matches.push(cnts[res]);
  }
};

});
