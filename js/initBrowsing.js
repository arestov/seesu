define(function(require) {
'use strict';
var BrowseMap = require('./libs/BrowseMap');

return function initBrowsing(app) {
  var bwroot = BrowseMap.hookRoot(app, app.start_page);
  app.bwroot = bwroot;
  return bwroot;
};

});
