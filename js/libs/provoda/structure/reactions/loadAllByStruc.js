define(function () {
'use strict';

return function loadAllByStruc(md, obj, prev) {
	// obj.list is `struc`
	if (!obj.inactive) {
		for (var i = 0; i < obj.list.length; i++) {
			var cur = obj.list[i];
			if (!cur) {continue;}
			md.addReqDependence(obj.supervision, cur);
		}

	} else if (prev && prev.list){
		for (var i = 0; i < prev.list.length; i++) {
			var cur = prev.list[i];
			if (!cur) {continue;}
			md.removeReqDependence(obj.supervision, cur);
		}
	}
};
});
