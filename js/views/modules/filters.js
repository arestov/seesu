define(function() {
"use strict";
var filters = {
	limitTo: function(input, limit) {
		if (Array.isArray(input)){
			return input.slice(0, limit);
		} else if ( typeof input == 'string' ) {
			if (limit) {
				return limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length);
			} else {
				return "";
			}
		} else {
			return input;
		}
	},
	notGIF: function(input) {
		if (input.lastIndexOf('.gif') == input.length - 4){
			return;
		} else {
			return input;
		}
	}
};

return filters;
});