define(function (require) {
'use strict';

var checkPrefix = require('../../StatesEmitter/checkPrefix');
var rebuild = require('./rebuild')
var ApiDeclr = require('./dcl')

var checkApi = checkPrefix('api-', ApiDeclr, '__apis');

function handleApis(self, props, typed_state_dcls) {
  var apis = checkApi(self, props);

  if (!apis) {
    return
  }

  rebuild(self, apis, typed_state_dcls)
  return true
}

return function checkApis(self, props, typed_state_dcls) {
  // var states = checkApiState(self, props);
  handleApis(self, props, typed_state_dcls)
};

});
