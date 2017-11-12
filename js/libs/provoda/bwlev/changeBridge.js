define(function () {
'use strict';

return function changeBridge(bwlev) {
  if (bwlev.map.bridge_bwlev === bwlev) {
    return bwlev;
  }

  bwlev.map.bridge_bwlev = bwlev;
  bwlev.map.trigger('bridge-changed', bwlev);
  bwlev.map.updateNesting('selected__bwlev', bwlev);
  bwlev.map.updateNesting('selected__md', bwlev.getNesting('pioneer'));
  bwlev.map.updateState('selected__name', bwlev.model_name);

  return bwlev;
}
});
