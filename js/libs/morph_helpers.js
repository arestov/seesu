define(['spv'], function(spv) {
"use strict";



var getLFMImageId = function(url) {
	var url_parts = url.split(/\/+/);
	if (url_parts[1] == 'userserve-ak.last.fm'){
		return url_parts[4].replace(/png$/, 'jpg');

	}
	
};

var getLFMImageWrap = function(array) {
	if (!array){
		return;
	}
	var
		url,
		lfm_id;

	if (typeof array == 'string'){
		url = array;
	} else {
		url = spv.getTargetField(array, '3.#text');
	}
	if (url){
		if (url.indexOf('http://cdn.last.fm/flatness/catalogue/noimage') === 0){
			return;
		} else {
			lfm_id = getLFMImageId(url);

			if (lfm_id){
				return {
					lfm_id: lfm_id
				};
			} else {
				return {
					url: url
				};
			}
		}

		
	}

	
};

return {
	num: function(value) {
		return parseFloat(value);
	},
	lfm_image: getLFMImageWrap,
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