define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var Item = require('./item')

var check = checkPrefix('nest_compx-', Item, '_chi_nest_compx');
return check;
});
