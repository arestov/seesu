var cache_ajax = {
	storage: {},
	get: function(prefix, hash_key, callback, hours){
		var _this= this;
		
		var cached_response = _this.storage['c_' + prefix + '_' + hash_key];
		if (cached_response) {
			var date_string = _this.storage['c_' + prefix + '_' + hash_key + '_date'];
			if (date_string){
				var date_of_c_response = parseInt(date_string);
				if (date_of_c_response) {
					var now_is = (new Date).getTime();
					if ((now_is - date_of_c_response) < ( (hours || 5) * 60 * 60 * 1000)){
						var status;
						
						var old_r = (cached_response == Object(cached_response) && cached_response) || null;
						
						if (old_r){
							try {
								if (!old_r && typeof cached_response == 'string'){
									var old_r = JSON.parse(cached_response);
								}
								
							} catch(e){
								console.log(e);
							}
						}
						
						
						if (old_r){
							if (callback) {callback(old_r);}
							return true;
						} else{
							return false;
						}
					}
				}
			}

		}
		return false;
	},
	set: function(prefix, hash_key, value){
		var _this = this;
		var _v = value;
		_this.storage['c_' + prefix + '_' + hash_key] = _v;
		_this.storage['c_' + prefix + '_' + hash_key + '_date'] =  (new Date).getTime();
	}
};
