define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var NestCntDeclr = require('./item')
var build = require('./build')

var checkApi = checkPrefix('nest_conj-', NestCntDeclr, '_chi_nest_conj', build);

return checkApi;

});
