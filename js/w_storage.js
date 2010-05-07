(function(){
	var store_get = function(){return false};
	var store_set = function(){return false};
	if (typeof localStorage === 'object') {
		store_get = function(key){
			return localStorage.getItem(key);
		}
		store_set = function(key, value){
			return localStorage.setItem(key, value);
		}
	} else
	if (typeof widget === 'object') {
		store_get = function(key){
			return widget.preferenceForKey(key);
		}
		store_set = function(key, value){
			return widget.setPreferenceForKey(value, key);
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
	
	
	
	
	var stringify = function(value){
		return value
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
	
	
	
	window.w_storage = function(key, value){
		if (key){
			if (typeof value === 'undefined'){
				return store_get(key);
			} else {
				return store_set(key, stringify(value));
			}
		} else {
			return false
		}
		
	}
})();

