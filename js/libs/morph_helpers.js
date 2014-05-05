define(['app_serv'], function(app_serv) {
"use strict";
return {
	num: function(value) {
		return parseFloat(value);
	},
	lfm_image: function(value) {
		return app_serv.getLFMImageWrap(value);
	},
	'seconds': function(value) {
		return value * 1000;
	},
	timestamp: function(value) {
		return value * 1000;
	},
	urlp: function(value) {
		return '/' + value;
	}
};
});