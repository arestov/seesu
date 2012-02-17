function lastfm_api(apikey, s, stGet, stSet, cache_ajax, crossdomain, init, queue){
	if (arguments.length){
		this.init.apply(this, arguments);
	}
}

lastfm_api.prototype= {
	initers: [],
	init: function(apikey, s, stGet, stSet, cache_ajax, crossdomain, queue){
		this.apikey = apikey;
		this.stGet = stGet;
		this.stSet = stSet;
		this.s = s;
		this.cache_ajax = cache_ajax;
		this.crossdomain = crossdomain;
		if (!crossdomain){
			var srvc = document.createElement('div'); $(srvc).css('display', 'none');
			$(document).ready(function(){
				$(document.body).append(srvc);
			});
			
			var _i = document.createElement('iframe'); _i.width='30'; _i.height= '30';
			var _f = document.createElement('form'); _f.method ='POST'; _f.action=this.api_path; srvc.appendChild(_f);
			
			this.post_serv = {
				name: 'lfmpost',
				i: _i,
				c: 0,
				f: _f,
				post: function(data,callback){
					$(this.f).empty();
					for (var a in data) {
						var input = document.createElement('input');input.type='hidden';
						input.name = a;
						input.value = data[a];
						this.f.appendChild(input);
					}
					var new_i = this.i.cloneNode(true);
					this.f.target = new_i.name = new_i.id = (this.name + (++this.c));
					srvc.appendChild(new_i);
					this.f.submit();
					if (callback){callback({});}
				}
			};
		}
		if (queue){
			this.queue = queue;
		}
		
		if (this.stGet){
			
			this.sk =	this.stGet('lfmsk') || false;
			this.user_name = this.stGet('lfm_user_name') || false;
		}
		for (var i = 0; i < this.initers.length; i++) {
			this.initers[i].call(this);
		}
	},
	api_path: 'http://ws.audioscrobbler.com/2.0/',
	get: function(method, data, options){
		return this.send(method, data, options);
	},
	post: function(method, data, options){
		return this.send(method, data, options, true);
	},
	send: function(method, params, options, post){
		var _this				= this,
			deferred			= $.Deferred(),
			complex_response	= new depdc(true);
		
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

		deferred.promise( complex_response );

		if (method){
			options = options || {};
			params	= params	|| {};

			options.nocache = options.nocache || !this.cache_ajax || post;


			var use_post_serv = post && !this.crossdomain;
			
			var apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
			
			params.method = method;
			params.api_key = this.apikey;
			params.format = params.format || (use_post_serv ?	'' : 'json');

			if (apisig || !options.nocache) {
				params.api_sig = hex_md5(stringifyParams(params, ['format', 'callback']) + this.s);
			}

			var cache_used;
			if (!options.nocache){
				cache_used = this.cache_ajax.get('lastfm', params.api_sig, function(r){
					deferred.resolve(r);
				});
				if (cache_used) {
					complex_response.cache_used = true;
					return complex_response;
				}
			}
	
			if (!cache_used){
				var sendRequest = function(){
					if (complex_response.aborted){
						return;
					}
					
					if (!use_post_serv){
						var cache_used;
						if (!options.nocache){
							cache_used = cache_ajax.get('lastfm', params.api_sig, function(r){
								deferred.resolve(r);
							});
						}
						if (!cache_used){
							complex_response.xhr = $.ajax({
								url: _this.api_path,
								global: false,
								type: post ? "POST" : "GET",
								dataType: _this.crossdomain ? 'json' : 'jsonp',
								data: params,
								error: function(r){
									deferred.reject.apply(deferred, arguments);
								},
								success: function(r){
									deferred.resolve.apply(deferred, arguments);
									if (!post && _this.cache_ajax){
										_this.cache_ajax.set('lastfm', params.api_sig, r);
									}
								},
								complete: function(xhr){
								//console.log(xhr.responseText)
								}
							});
							if (options.after_ajax){
								options.after_ajax();
							}
							//console.log(params)	
						}

					} else{
						_this.post_serv.post(params, function(){
							deferred.resolve();
						});
					} 
					
				};

				if (this.queue){
					complex_response.queued = this.queue.add(sendRequest, options.not_init_queue);
				} else{
					sendRequest();
				}
			}



		} else{
			deferred.reject();
		}
		return complex_response;
	}
};