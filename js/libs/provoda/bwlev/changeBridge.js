define(function (require) {
'use strict';
var showMOnMap = require('./showMOnMap')

var redirected = function(map, pioneer) {
  var BWL = map.BWL; // kinda hack?! TODO FIXME

  var redirectBWLev = pioneer.redirectBWLev
  if (!redirectBWLev) {
    return null
  }

  return showMOnMap(BWL, map, redirectBWLev(pioneer));

}

return function changeBridge(bwlev_raw) {
  var pioneer = bwlev_raw.getNesting('pioneer')

  var map = bwlev_raw.map
  var bwlev = redirected(map, pioneer) || bwlev_raw
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
