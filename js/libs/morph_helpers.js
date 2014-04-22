define(['app_serv'], function(app_serv) {
"use strict";
return {
	num: function(value) {
		return parseFloat(value);
	},
	lfm_image: function(value) {
		return app_serv.getLFMImageWrap(value);
	},
	timestamp: function(value) {
		return value * 1000;
	}
};
});