cache_ajax = {
	get: function(prefix, hash_key, callback, hours){
		var cached_response = w_storage('c_' + prefix + '_' + hash_key);
		if (cached_response) {
			var date_string = w_storage('c_' + prefix + '_' + hash_key + '_date');
			if (date_string){
				var date_of_c_response = parseInt(date_string);
				if (date_of_c_response) {
					var now_is = (new Date).getTime();
					if ((now_is - date_of_c_response) < ( (hours || 5) * 60 * 60 * 1000)){
						try {
							var old_r = JSON.parse(cached_response);
							if (callback) {callback(old_r);}
							return true;
						} catch(e){
							return false;
						}
						
					}
				}
			}

		}
		return false;
	},
	set: function(prefix, hash_key, value){
		var _v = value;
		if ((typeof _v === 'array') || (typeof _v === 'object')){
			_v = JSON.stringify(value);
		}
		w_storage('c_' + prefix + '_' + hash_key, _v);
		w_storage('c_' + prefix + '_' + hash_key + '_date', (new Date).getTime());
	}
}
