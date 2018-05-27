define(function(require) {
'use strict';
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var SelectNestingDeclaration = require('./item')
var build = require('./build');

var checkNestSel = checkPrefix('nest_sel-', SelectNestingDeclaration, '_chi_nest_sel', build);

return checkNestSel;
});
