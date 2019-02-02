define(function(require) {
'use strict';
var ApiEffectDeclr = require('./produce/dcl')
var rebuildEffects = require('./produce/rebuild')
var checkPrefix = require('../../../StatesEmitter/checkPrefix');

var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

return function checkEffects(self, props, typed_state_dcls) {
  var effects = checkEffect(self, props);
  if (!effects) {
    return
  }

  rebuildEffects(self, effects, typed_state_dcls)

  return true
}
})
