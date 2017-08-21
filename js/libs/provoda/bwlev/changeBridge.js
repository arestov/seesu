define(function () {
'use strict';

return function changeBridge(bwlev) {
	if (bwlev.map.bridge_bwlev === bwlev) {
		return bwlev;
	}

	bwlev.map.bridge_bwlev = bwlev;
	bwlev.map.trigger('bridge-changed', bwlev);

	return bwlev;
}
});
