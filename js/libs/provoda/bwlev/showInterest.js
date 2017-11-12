define(function (require) {
'use strict';
var _goDeeper = require('./_goDeeper');
var showMOnMap = require('./showMOnMap');

return function showInterest(map, interest) {
  var BWL = map.BWL; // kinda hack?! TODO FIXME

  if (!interest.length) {
    return showMOnMap(BWL, map, map.mainLevelResident);
  }

  var first = interest.shift();
  // first.md.lev fixme

  var parent_bwlev = showMOnMap(BWL, first.md.app.map, first.md);

  for (var i = 0; i < interest.length; i++) {
    var cur = interest[i];

    var distance = cur.distance;
    if (!distance) {throw new Error('must be distance: 1 or more');}
    while (distance) {
      var md = getDistantModel(interest[i].md, distance);
      parent_bwlev = _goDeeper(BWL, map, md, parent_bwlev);
      distance--;
    }


  }

  return parent_bwlev;
};

function getDistantModel(md, distance){
  var cur = md;
  for (var i = 1; i < distance; i++) {
    cur = cur.map_parent;
  }
  return cur;
};
})
