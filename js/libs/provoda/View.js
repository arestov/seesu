define(function(require) {
'use strict';
var spv = require('spv');
var PvTemplate = require('./PvTemplate');


var CoreView = require('./CoreView')

var DomView = spv.inh(CoreView, {}, {

})
DomView._PvTemplate = PvTemplate;

return DomView

})
