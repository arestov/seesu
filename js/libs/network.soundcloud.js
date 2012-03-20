var scApi = function(key, queue) {
	this.queue = queue;
	this.key = key;
};
scApi.prototype = {
	constructor: scApi,
	makeSong: function(cursor, sc_key){
		var search_string = cursor.title || cursor.description;
		if (search_string){
			var replacer = hex_md5(Math.random()+'aaaaaaaaf');
			var t =search_string.replace('-', replacer)
			var _ttl = search_string.split(replacer,2);
			var artist = (_ttl.length == 2) && _ttl[0];
			var track_title = (_ttl.length == 2) && (_ttl[1] && _ttl[1].replace(/^\s*|\s*$/,'') || '') || _ttl[0];
			
			
			if (!artist){
				artist = cursor.user.permalink || '';
			}
			
			var entity = {
				artist  	: HTMLDecode(artist),
				track		: HTMLDecode(track_title),
				duration	: cursor.duration,
				link		: (cursor.download_url || cursor.stream_url) + '?consumer_key=' + sc_key,
				from		: 'soundcloud',
				real_title	: cursor.title,
				page_link	: cursor.permalink_url,
				description : cursor.description || false,
				downloadable: cursor.downloadable,
				_id			: cursor.id,
				type: 'mp3'
			};
			
		}
		return entity
	},
	find: function(msq, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		var query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
		
		var search_source = {name: 'soundcloud', key: 0};
		var sc_key = getPreloadedNK('sc_key');
		var use_cache = !nocache;
		if (use_cache){
			var cache_used = cache_ajax.get('soundcloud', query, function(r){callback(r,search_source);})
			if (cache_used) {return true;}
		}
		if (only_cache){
			return false;
		}

		var data = {
			consumer_key: sc_key,
			filter:'streamable,downloadable'
		}
		if (query){
			data.q= query
		}
		return this.queue.add(function(){
			seesu.track_event('mp3 search', 'soundcloud search');
			$.ajax({
				timeout: 10000,
				url: "http://api.soundcloud.com/tracks.js",
				global: false,
				type: "GET",
				dataType: "jsonp",
				data: data,
				error:function(xhr){
					if  (error) {error(search_source);}
				},
				success:function(r,xhr){
					if (r && r.length){
						var music_list = [];
						for (var i=0; i < r.length; i++) {
							var ent = _this.makeSong(r[i], sc_key);
							if (ent){
								if (!has_music_copy(music_list,ent)){
									music_list.push(ent)
								}
							}
						};
					}
					if (music_list && music_list.length){
						cache_ajax.set('soundcloud', query, music_list);
						if (callback ){
							callback(music_list, search_source);
						}
					} else {
						if  (error) {error(search_source, true);}
					}
					
				}
				  
			})
			if (after_ajax) {after_ajax();}
		}, true);
	},
	getSongById: function(id, callback, error, nocache, after_ajax, only_cache) {
		var _this = this;
		var search_source = {name: 'soundcloud', key: 0};
		var sc_key = this.key;
		var use_cache = !nocache;
		if (use_cache){
			var cache_used = cache_ajax.get('soundcloudgetbyid', id, function(r){callback && callback(r,search_source);})
			if (cache_used) {return true;}
		}
		if (only_cache){
			return false;
		}

		var data = {
			consumer_key: sc_key,
			filter:'streamable,downloadable'
		}
		if (id){
			data.ids= id;
		}
		return this.queue.add(function(){
			seesu.track_event('mp3 search', 'soundcloud search');
			$.ajax({
				timeout: 10000,
				url: "http://api.soundcloud.com/tracks.js",
				global: false,
				type: "GET",
				dataType: "jsonp",
				data: data,
				error:function(xhr){
					if  (error) {error(search_source, true);}
				},
				success:function(r,xhr){
					if (r && r[0] && r[0].download_url){
						var entity = _this.makeSong(r[0], sc_key);
						if (entity){
							cache_ajax.set('soundcloudgetbyid', id, entity);
							if (callback ){
								callback(entity, search_source);
							}
						} else{
							if  (error) {error(search_source, true);}
						}
					}
				}
				  
			})
			if (after_ajax) {after_ajax();}
		}, true);
	}
};

