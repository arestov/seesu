define(function (require) {
'use strict';
var getShortStateName = require('./getShortStateName');
var getPropsPrefixChecker= require('./getPropsPrefixChecker');
var getParsedState = require('./getParsedState')
var groupDeps = require('./groupDeps')
var getEncodedState = require('./getEncodedState')

return {
  getShortStateName: getShortStateName,
  getParsedState: getParsedState,
  getEncodedState: getEncodedState,
  getPropsPrefixChecker: getPropsPrefixChecker,
  groupDeps: groupDeps,
};
});
