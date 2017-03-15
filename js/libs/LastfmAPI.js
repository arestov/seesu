define(function(require) {
"use strict";
var $ = require('jquery');
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');

var LastfmAPI = function(){};
spv.Class.extendTo(LastfmAPI, {
	checkResponse: function(r) {
		if (r.error) {
			return r.message || r.error;
		}
	},
	source_name: 'last.fm',
	init: function(apikey, s, stGet, stSet, cache_ajax, crossdomain, queue){
		this.apikey = apikey;
		this.stGet = stGet;
		this.stSet = stSet;
		this.s = s;
		this.cache_ajax = cache_ajax;
		this.crossdomain = crossdomain;
		if (!crossdomain){
			var srvc = window.document.createElement('div'); $(srvc).css('display', 'none');
			$(window.document).ready(function(){
				$(window.document.body).append(srvc);
			});

			var _i = window.document.createElement('iframe'); _i.width='30'; _i.height= '30';
			var _f = window.document.createElement('form'); _f.method ='POST'; _f.action=this.api_path; srvc.appendChild(_f);

			this.post_serv = {
				name: 'lfmpost',
				i: _i,
				c: 0,
				f: _f,
				post: function(data,callback){
					$(this.f).empty();
					for (var a in data) {
						var input = window.document.createElement('input');input.type='hidden';
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
	api_path: 'https://ws.audioscrobbler.com/2.0/',
	cache_namespace: "lastfm",
	thisOriginAllowed: true,
	get: function(method, data, options){
		return this.send(method, data, options);
	},
	post: function(method, data, options){
		return this.send(method, data, options, true);
	},
	send: function(method, params, options, post) {
		var _this = this;


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


		if (options && options.paging) {
			params.limit = options.paging.page_limit;
			params.page = options.paging.next_page;
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
			requestFn: aReq,
			not_save_cache: post,
			responseFn: function(r) {
				if (!post && _this.checkMethodResponse){
					_this.checkMethodResponse(method, params, r);
				}
				return r;
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
			thisOriginAllowed: this.thisOriginAllowed,
			context: options.context
		}, wraprq_opts);

		return wrap_def.complex;

	}
});
return LastfmAPI;
});
