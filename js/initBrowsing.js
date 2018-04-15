define(function(require) {
'use strict';
var pv = require('pv');
var navi = require('./libs/navi');
var BrowseMap = require('./libs/BrowseMap');
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');
var app_serv = require('app_serv');

var pvUpdate = pv.update;
var app_env = app_serv.app_env;

return function initBrowsing(app) {
  var map = BrowseMap.hookRoot(app, app.start_page);
  app.map = map;
  return map;
};

});
