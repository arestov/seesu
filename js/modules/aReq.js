define(['jquery'],function($){
'use strict';
var create_jsonp_callback;
(function(){
	var jsonp_counter = 0;
	create_jsonp_callback = function(func){
		var func_name = 'jspc_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	};
})();
var async_script_support = "async" in document.createElement("script");
var xhr2_support = window.XMLHttpRequest && "withCredentials" in (new XMLHttpRequest());  //https://gist.github.com/1431660
var aReq = function(options){
	if (options.dataType != "jsonp"){
		return $.ajax(options);
	} else if (xhr2_support && options.thisOriginAllowed) {
		options.dataType = "json";
		options.crossDomain = true;
		if (options.afterChange){
			options.afterChange(options);
		}
		return $.ajax(options);
	} else {
		var
			img,
			script,
			callback_func_name,
			script_load_timeout,
			deferred			= $.Deferred(),
			cancelLoad = function() {
				if (img){
					img.src = null;
					unbindImage();
				}
				if (script){
					script.src = null;
				}
				if (callback_func_name && window[callback_func_name]){
					window[callback_func_name] = $.noop();
				}
			},
			complex_response	= {
				abort: function(){
					this.aborted = true;
					cancelLoad();
					

				}
			};
		deferred.promise( complex_response );
		
		var timeout = options.timeout || ($.ajaxSettings && $.ajaxSettings.timeout);
		if (timeout){
			script_load_timeout = setTimeout(function() {
				deferred.reject();
			}, timeout);
		}

		var params = {};
		$.extend(params, options.data || {});

		var callback_param_name = options.callback || "callback";

		if (!options.jsonpCallback && !params[callback_param_name]){
			callback_func_name = create_jsonp_callback(function(r){
				if (script_load_timeout){
					clearTimeout(script_load_timeout);
				}
				
				
				deferred.resolve(r);
			});
			params[callback_param_name] = callback_func_name;
		}


		var params_url = $.param(params);
		var full_url = (options.url || "") + (params_url ? "?" + params_url : "");

		

		
		var done;
		var loadScript = function(){
			script = document.createElement("script");
			script.async = true;
			script.onload = function(){
				//document.documentElement.firstChild.removeChild(script);
				

				
			};
			script.onerror = function(){
				deferred.reject();
			};
			script.src = full_url;
			document.documentElement.firstChild.insertBefore(script, document.documentElement.firstChild.firstChild);
		};


		var unbindImage = function(){
			img.onload = null;
			img.onerror = null;
		};
		if (async_script_support){
			loadScript();
		} else if (options.resourceCachingAvailable){
			img = document.createElement("img");
			var completeImage = function(){
				if (!done){
					done = true;
					loadScript();
				}
			};

			img.src = full_url;
			
			if (img.complete){
				setTimeout(completeImage,0);
			} else {
				img.onload = completeImage;
				img.onerror = completeImage;
			}
		} else {
			loadScript();
		}
			
		
		
		return complex_response;
		
	}
};
return aReq;
});