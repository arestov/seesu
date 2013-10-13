define(function(){
"use strict";
var cache_ajax = {
		storage: {},
		get: function(prefix, hash_key, callback){
			var _this= this;
			
			var cached_response = (cached_response = _this.storage['c_' + prefix + '_' + hash_key]) && cached_response.v;
			if (cached_response) {

				if (cached_response !== new Object(cached_response) && typeof cached_response == 'string'){
					try {
						cached_response = JSON.parse(cached_response);
					} catch(e){

					}
				}
				if (callback) {
					setTimeout(function(){
						callback(cached_response);
					},30);
				}
				return true;
			}
			return false;
		},
		set: function(prefix, hash_key, value, timeout){
			value = {
				v: value,
				t: (Date.now() + (timeout || (1000 * 60 * 60 * 5)))
			};
			this.storage['c_' + prefix + '_' + hash_key] = value;
		}
	};
	setInterval(function(){
		var now = Date.now();
		for (var a in cache_ajax.storage){
			var timeout = cache_ajax.storage[a].t;
			if (timeout < now){
				delete cache_ajax.storage[a];
			}
		}
	}, 30000);

return cache_ajax;
});

