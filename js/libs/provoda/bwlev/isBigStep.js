define(function() {
'use strict';
return function isBigStep(cur, cur_child) {
	return cur.map_parent && cur.map_parent.getNesting('pioneer') != cur_child.map_parent;
};
});
