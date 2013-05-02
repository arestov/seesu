define(function(){
	'use strict';
	var stringify = function(value){
		return value;
	};
	if ((typeof JSON == 'object') && JSON.stringify){
		stringify = function(value){
			if ((typeof value == 'object')){
				return JSON.stringify(value);
			} else{
				return value;
			}
			
		};
	}
	
	
	
	
	
	var ram_storage = {};
	
	var store_get = function(){return false;};
	var store_set = function(){return false;};
	if ((typeof widget == 'object') && !widget.fake_widget && (typeof widget.setPreferenceForKey == 'function')) {
		store_get = function(key){
			return widget.preferenceForKey(key);
		};
		store_set = function(key, value){
			return widget.setPreferenceForKey(stringify(value), key);
		};
	} else if (typeof localStorage == 'object') {
		store_get = function(key){
			return localStorage.getItem(key);
			
		};
		store_set = function(key, value, important){
			if (!important){return null;}
			try {
				return localStorage.setItem(key, stringify(value));
			} catch(e){
				return null;
			}
			
		};
	} else if ( (typeof System != "undefined") && System.Gadget && System.Gadget.Settings){
		store_get = function(key){
			return System.Gadget.Settings.readString(key);
		};
		store_set = function(key, value){
			return System.Gadget.Settings.writeString(key, stringify(value));
		};
	}
	var get_key = function(key){
		var r_value = ram_storage[key];
		if (typeof r_value != 'undefined'){
			return r_value;
			
		} else{
			return store_get(key);
		}
	};
	var set_key = function(key, value, opts){
		ram_storage[key] = value;
		return store_set(key, value, opts);
	};
	
	
	
	
	
	
	var w_storage = function(key, value, opts){
		if (key){
			if (typeof value == 'undefined'){
				return get_key(key);
			} else {
				return set_key(key, value, opts);
			}
		} else {
			return false;
		}
		
	};
	
	return w_storage;
});


