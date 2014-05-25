define(['jquery'], function($) {
"use strict";
return function(request_params, options, complex_response){
	complex_response = complex_response || {};
	var deferred = $.Deferred();
	
	complex_response.abort = function(){
		this.aborted = true;
		deferred.reject('abort');
		if (this.queued){
			this.queued.abort();
		}
		if (this.xhr){
			this.xhr.abort();
		}
	};

	/*
		var options = {
			cache_ajax: cache_ajax
			nocache: false,
			cache_key: '',
			cache_namespace: 'string',
			requestFn
			not_save_cache
			manualSend: func,
			responseFn: func,
			queue
		}

	*/

	deferred.promise( complex_response );

	options.nocache = options.nocache || !options.cache_ajax;

	var cache_used;
	if (!options.nocache){
		cache_used = options.cache_ajax.get(options.cache_namespace, options.cache_key, function(r){
			deferred.resolve(r);
		});
		if (cache_used) {
			complex_response.cache_used = true;
			return {
				defer: deferred,
				complex: complex_response
			};
		}
	}

	if (!cache_used){
		var sucessFn = function(r) {
			if (options.responseFn){
				r = options.responseFn(r);
				arguments[0] = r;
			}
			deferred.resolve.apply(deferred, arguments);
			if (!options.not_save_cache && options.cache_ajax){
				var error = options.checkResponse && options.checkResponse(r);
				if (!error) {
					options.cache_ajax.set(options.cache_namespace, options.cache_key, r, options.cache_timeout);
				}
				
			}
		};
		var sendRequest = function(){
			if (complex_response.aborted){
				return;
			}
			
			if (!options.manualSend){
				var cache_used;
				if (!options.nocache){
					cache_used = options.cache_ajax.get(options.cache_namespace, options.cache_key, function(r){
						deferred.resolve(r);
					});
				}
				if (!cache_used){

					var request;
					if (options.requestFn){
						request = options.requestFn(request_params);
					} else {
						request = $.ajax(request_params);
					}
					complex_response.xhr = request;
					request
						.fail(function(){
							deferred.reject.apply(deferred, arguments);
						})
						.done(sucessFn);

					if (deferred.notify){
						deferred.notify('just-requested');
					}
				
					//console.log(params)
				}

			} else{
				options.manualSend(function(r){
					deferred.resolve(r);
				});
			}
			
		};

		if (options.queue){
			complex_response.queued = options.queue.add(sendRequest, options.not_init_queue);
		} else{
			sendRequest();
		}
	}
	return {
		defer: deferred,
		complex: complex_response
	};

};
});