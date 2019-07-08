define(function () {
'use strict';

return function changeBridge(bwlev) {
  if (bwlev.map.bridge_bwlev === bwlev) {
    return bwlev;
  }

  bwlev.map.bridge_bwlev = bwlev;

  var copy = bwlev.ptree.slice();
  copy.reverse();

  bwlev.map.updateNesting('wanted_bwlev_chain', copy);
  return bwlev;
}
});
