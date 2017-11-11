define(function(require) {
'use strict';
var $ = require('jquery');
var Promise = require('Promise');
var extendPromise = require('./extendPromise');

var toBigPromise = extendPromise.toBigPromise;

function wrapRequest(request_params, options){
	var deferred = $.Deferred();

	var complex_response = toBigPromise(deferred);

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

	options.nocache = options.nocache || !options.cache_ajax;

	var cache_used;
	if (!options.nocache){
		cache_used = options.cache_ajax.get(options.cache_namespace, options.cache_key, function(r){
			deferred.resolve(r);
		});
		if (cache_used) {
			var promise = toBigPromise(deferred);
			promise.cache_used = true;
			return {
				defer: deferred,
				complex: promise
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

		if (options.queue){
			var asSend;
			var asAbort;
			var queued_promise = new Promise(function(resolve, reject) {
				asSend = resolve;
				asAbort = reject;
			});
			queued_promise.asAbort = asAbort;
			complex_response.queued_promise = queued_promise;
			deferred.queued = options.queue.add(sendRequest, options.not_init_queue);
		} else{
			sendRequest();
		}

		function sendRequest(){
			if (deferred.aborted){
				return;
			}

			complex_response.sended = true;

			asSend();

			if (!options.manualSend) {
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
					deferred.xhr = request;
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
		}
	}
	return {
		defer: deferred,
		complex: complex_response
	};

}

return wrapRequest;
});
