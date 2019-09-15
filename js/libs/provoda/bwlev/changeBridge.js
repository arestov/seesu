define(function () {
'use strict';

return function changeBridge(bwlev_raw) {
  var pioneer = bwlev_raw.getNesting('pioneer')

  var bwlev = bwlev_raw
  var map = bwlev.map
  if (map.bridge_bwlev === bwlev) {
    return bwlev;
  }

  bwlev.map.bridge_bwlev = bwlev;

  var copy = bwlev.ptree.slice();
  copy.reverse();

  bwlev.map.updateNesting('wanted_bwlev_chain', copy);
  return bwlev;
}
});
