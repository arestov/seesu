(function(){
	var ram_storage = {};
	
	var store_get = function(){return false};
	var store_set = function(){return false};
	if ((typeof widget === 'object') && (typeof widget.setPreferenceForKey == 'function')) {
		store_get = function(key){
			return widget.preferenceForKey(key);
		}
		store_set = function(key, value){
			return widget.setPreferenceForKey(value, key);
		}
	} else
	if (typeof localStorage === 'object') {
		store_get = function(key){
			return localStorage.getItem(key);
			
		}
		store_set = function(key, value, important){
			if (!important){return null}
			try {
				return localStorage.setItem(key, value);
			} catch(e){
				return null;
			}
			
		}
	} else
	if ( (typeof System != "undefined") && System.Gadget && System.Gadget.Settings){
		store_get = function(key){
			return System.Gadget.Settings.readString(key);
		}
		store_set = function(key, value){
			return System.Gadget.Settings.writeString(key, value);
		}
	}
	var get_key = function(key){
		var ram_value = ram_storage[key];
		if (typeof ram_value !== 'undefined'){
			return ram_value;
			
		} else{
			return store_get(key);
		}
	}
	var set_key = function(key, value){
		ram_storage[key] = value;
		return store_set(key, value);
	}
	
	
	var stringify = function(value){
		return value;
	}
	if ((typeof JSON === 'object') && JSON.stringify){
		stringify = function(value){
			if ((typeof value === 'object') || (typeof value === 'array')){
				return JSON.stringify(value);
			} else{
				return value;
			}
			
		}
	}
	
	
	
	window.w_storage = function(key, value, important){
		if (key){
			if (typeof value === 'undefined'){
				return get_key(key);
			} else {
				return set_key(key, stringify(value), important);
			}
		} else {
			return false
		}
		
	}
})();

