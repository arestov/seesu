var isohuntTorrentSearch = function(cross_domain_allowed) {
	this.crossdomain = cross_domain_allowed;
	var _this = this;
};
isohuntTorrentSearch.prototype = {
	constructor: isohuntTorrentSearch,
	cache_namespace: 'isohunt',
	name: "torrents",
	s: {
		name:"Isohunt torrents",
		key:0,
		type: "torrent"
	},
	send: function(query, options) {
		var
			_this				= this,
			deferred			= $.Deferred(),
			complex_response	= {
				abort: function(){
					this.aborted = true;
					deferred.reject('abort');
					if (this.queued){
						this.queued.abort();
					}
					if (this.xhr){
						this.xhr.abort();
					}
				}
			};
		deferred.promise( complex_response );
		if (query) {
			options = options || {};
			options.nocache = options.nocache || !this.cache_ajax;
			options.cache_key = options.cache_key || hex_md5('zzzzzzz' + query);

			var cache_used;

			
			if (!options.nocache){
				
				cache_used = this.cache_ajax.get(this.cache_namespace, options.cache_key, function(r){
					deferred.resolve(r);
				});
				if (cache_used) {
					complex_response.cache_used = true;
					return complex_response;
				}
			}

			if (!cache_used){
				var success = function(r){
					deferred.resolve.apply(deferred, arguments);
					if (_this.cache_ajax){
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r);
					}
				};

				var sendRequest = function() {
					if (complex_response.aborted){
						return;
					}
					if (!options.nocache){
						cache_used = this.cache_ajax.get(_this.cache_namespace, options.cache_key, function(r){
							deferred.resolve(r);
						});
					}
					
					if (!cache_used){
						$.ajax({
							url: "http://ca.isohunt.com/js/json.php",
							type: "GET",
							dataType: "json",
							data: {
								ihq: query
							},
							timeout: 20000,
							success: success,
							error:function(){
								deferred.reject.apply(deferred, arguments);
							}
							
						});



						if (options.after_ajax){
							options.after_ajax();
						}
						if (deferred.notify){
							deferred.notify('just-requested');
						}
					}

				};

				if (this.queue){
					complex_response.queued = this.queue.add(sendRequest, options.not_init_queue);
				} else{
					sendRequest();
				}
			}

			

		}
		return complex_response;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;

		var async_ans = this.send(query, opts);

		var
			result,
			olddone = async_ans.done;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
					result = [];
					if (r.items && r.items.list){
						for (var i = 0; i < Math.min(r.items.list.length, 10); i++) {
							_this.wrapItem(result, r.items.list[i], msq);
						}
					}
					
				}
				cb(result, 'torrent');

			});
			return this;
		};
		return async_ans;
	},
	url_regexp: /torrent\_details\/(\d*)\//,
	wrapItem: function(r, sitem, query) {
		r.push({
			isohunt_id: sitem.guid,
			HTMLTitle: sitem.title,
			torrent_link: 'http://isohunt.com/download/' + sitem.guid,
			query: query,
			models: {},
			getSongFileModel: function(mo, player) {
				return this.models[mo.uid] = this.models[mo.uid] || (new fileInTorrent(this, mo)).setPlayer(player);
			}
		});
	}
};





var googleTorrentSearch = function(cross_domain_allowed) {
	this.crossdomain = cross_domain_allowed;
	var _this = this;
};
googleTorrentSearch.prototype = {
	constructor: googleTorrentSearch,
	cache_namespace: 'google_isohunt',
	name: "torrents",
	s: {
		name:"Google/Isohunt torrents",
		key:0,
		type: "torrent"
	},
	send: function(query, options) {
		var
			_this				= this,
			deferred			= $.Deferred(),
			complex_response	= {
				abort: function(){
					this.aborted = true;
					deferred.reject('abort');
					if (this.queued){
						this.queued.abort();
					}
					if (this.xhr){
						this.xhr.abort();
					}
				}
			};
		deferred.promise( complex_response );
		if (query) {
			options = options || {};
			options.nocache = options.nocache || !this.cache_ajax;
			options.cache_key = options.cache_key || hex_md5('zzzzzzz' + query);

			var cache_used;

			
			if (!options.nocache){
				
				cache_used = this.cache_ajax.get(this.cache_namespace, options.cache_key, function(r){
					deferred.resolve(r);
				});
				if (cache_used) {
					complex_response.cache_used = true;
					return complex_response;
				}
			}

			if (!cache_used){
				var success = function(r){
					deferred.resolve.apply(deferred, arguments);
					if (_this.cache_ajax){
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r);
					}
				};

				var sendRequest = function() {
					if (complex_response.aborted){
						return;
					}
					if (!options.nocache){
						cache_used = _this.cache_ajax.get(_this.cache_namespace, options.cache_key, function(r){
							deferred.resolve(r);
						});
					}
					
					if (!cache_used){
						aReq({
							url: "https://ajax.googleapis.com/ajax/services/search/web",
							type: "GET",
							dataType: _this.crossdomain ? "json": "jsonp",
							data: {
								cx: "001069742470440223270:ftotl-vgnbs",
								v: "1.0",
								q: query //"allintext:" + song + '.mp3'
							},
							timeout: 20000
							
						})
						.done(success)
						.fail(function(){
							deferred.reject.apply(deferred, arguments);
						});



						if (options.after_ajax){
							options.after_ajax();
						}
						if (deferred.notify){
							deferred.notify('just-requested');
						}
					}

				};

				if (this.queue){
					complex_response.queued = this.queue.add(sendRequest, options.not_init_queue);
				} else{
					sendRequest();
				}
			}

			

		}
		return complex_response;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;

		var async_ans = this.send("allintext:" + "(" + query  + '.mp3' + ")", opts);

		var
			result,
			olddone = async_ans.done;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
					result = [];
					for (var i = 0; i < r.responseData.results.length; i++) {
						_this.wrapItem(result, r.responseData.results[i], msq);
					}
				}
				cb(result, 'torrent');

			});
			return this;
		};
		return async_ans;
	},
	url_regexp: /torrent\_details\/(\d*)\//,
	wrapItem: function(r, item, query) {
		var isohunt_id = item && item.url && item.url.match(this.url_regexp);
		if (isohunt_id && isohunt_id[1]){
			r.push(item);
			item.isohunt_id = isohunt_id[1];
			item.torrent_link = 'http://isohunt.com/download/' + item.isohunt_id;
			item.query = query;
			item.title = item.titleNoFormatting = HTMLDecode(item.titleNoFormatting);
			item.models = {};
			item.getSongFileModel = function(mo, player) {
				return this.models[mo.uid] = this.models[mo.uid] || (new fileInTorrent(this, mo)).setPlayer(player);
			};
		}
		
	}
};
