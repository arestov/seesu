define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var NestCntDeclr = require('./item')

var checkApi = checkPrefix('nest_conj-', NestCntDeclr, '_chi_nest_conj');

return checkApi;

});
