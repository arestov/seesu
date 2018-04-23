define(function (require) {
'use strict';
var create = require('../create');

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

  var bwlev = create(BrowseLevel, {
    probe_name: probe_name,
    map_level_num: map_level_num,
    // model_name: md.model_name,
    pioneer_provoda_id: md._provoda_id,
    pioneer: md
  }, {
    nestings: {
      pioneer: md,
      map: map
    }
  }, parent_bwlev, md.app);

  if (cache) {
    cache[key] = bwlev;
  };

  return bwlev;
};

});
