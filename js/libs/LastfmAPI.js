define(['jquery', 'spv', 'app_serv', 'js/modules/aReq', 'js/modules/wrapRequest', 'hex_md5'], function($, spv, app_serv, aReq, wrapRequest, hex_md5) {
"use strict";

var LastfmAPI = function(){};
spv.Class.extendTo(LastfmAPI, {
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
			this.username = this.stGet('lfm_user_name') || false;
		}
	},
	api_path: 'http://ws.audioscrobbler.com/2.0/',
	cache_namespace: "lastfm",
	thisOriginAllowed: true,
	get: function(method, data, options){
		return this.send(method, data, options);
	},
	post: function(method, data, options){
		return this.send(method, data, options, true);
	},
	send: function(method, params, options, post) {
		var _this = this,
			complex_response = new spv.Depdc(true);


		if (!method){

			throw new Error('no method');
		}
		options = options || {};
		params	= params	|| {};

		options.nocache = options.nocache || post;

		var use_post_serv = post && !this.crossdomain;

		var apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature

		params.method = method;
		params.api_key = this.apikey;
		params.format = params.format || (use_post_serv ?	'' : 'json');
		if (use_post_serv){
			delete params.format;
		}


		var apisig_hash =  hex_md5(spv.stringifyParams(params, ['format', 'callback']) + this.s);

		if (apisig || !options.nocache) {
			params.api_sig = apisig_hash;
		}
		options.cache_key = options.cache_key || apisig_hash;


		var wraprq_opts = {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			requestFn: function() {
				return aReq.apply(this, arguments);
			},
			not_save_cache: post,
			responseFn: function(r) {
				if (!post && _this.checkMethodResponse){
					_this.checkMethodResponse(method, params, r);
				}
			},
			queue: this.queue
		};

		if (use_post_serv){
			wraprq_opts.manualSend = function(callback) {
				_this.post_serv.post(params, callback);
			};
		}

		var wrap_def = wrapRequest({
			url: this.api_path,
			global: false,
			type: post ? "POST" : "GET",
			dataType: this.crossdomain ? 'json' : 'jsonp',
			data: params,
			resourceCachingAvailable: true,
			thisOriginAllowed: this.thisOriginAllowed
		}, wraprq_opts, complex_response);

		return wrap_def.complex;

	}
});
return LastfmAPI;
});