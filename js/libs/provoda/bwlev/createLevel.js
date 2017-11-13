define(function (require) {
'use strict';
var getBWlev = require('./getBWlev');

return function createLevel(BrowseLevel, probe_name, num, parent_bwlev, md, map) {
  var bwlev = getBWlev(BrowseLevel, md, probe_name, parent_bwlev, num, map);
  bwlev.map = map;
  return bwlev;
};
});
