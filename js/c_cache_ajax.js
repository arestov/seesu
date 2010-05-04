cache_ajax = {
	get: function(prefix, hash_key, callback, hours){
		var cached_response = widget.preferenceForKey(prefix + '_' + hash_key);
		if (cached_response) {
			var date_string = widget.preferenceForKey(prefix + '_' + hash_key + '_date');
			if (date_string){
				var date_of_c_response = parseInt(date_string);
				if (date_of_c_response) {
					var now_is = (new Date).getTime();
					if ((now_is - date_of_c_response) < ( (hours || 5) * 60 * 60 * 1000)){
						var old_r = JSON.parse(cached_response);
						if (callback) {callback(old_r);}
						return true;
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
		widget.setPreferenceForKey(_v, prefix + '_' + hash_key);
		widget.setPreferenceForKey((new Date).getTime(), prefix + '_' + hash_key + '_date');
	}
}
