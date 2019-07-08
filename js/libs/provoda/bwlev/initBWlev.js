define(function(require) {
'use strict';
var create = require('../create');

return function initBWlev(BrowseLevel, md, probe_name, map_level_num, map, parent_bwlev) {
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

  return bwlev
}
})
