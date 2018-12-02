define(function (require) {
'use strict';
var initBWlev = require('./initBWlev')

return function getBWlev(BrowseLevel, md, probe_name, parent_bwlev, map_level_num, map){
  var cache = parent_bwlev && parent_bwlev.children_bwlevs;
  var key = md._provoda_id;
  if (cache && cache[key]) {
    return cache[key];
  }

  // debugger;
  // var BrowseLevel = require('./BrowseLevel');
  if (!BrowseLevel) {
    throw new Error('provide BrowseLevel constructor');
  }

  var bwlev = initBWlev(BrowseLevel, md, probe_name, map_level_num, map, parent_bwlev)

  if (cache) {
    cache[key] = bwlev;
  };

  return bwlev;
};

});
