$.extend(lastfm_api.prototype, {
	search_source:{
		name:"lastfm",
		key:0	
	},
	createLastfmTrack: function(tr, link, duration, id, downloadable){
		return {
			from:'lastfm',
			artist: tr.artist,
			link: link,
			track: tr.track,
			duration: duration,
			downloadable: downloadable,
			_id: id
		}	
	},
	searchMp3: function(msq, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		if (!(msq.artist && msq.track)){
			if (error){error(_this.search_source);}
		} else{
			return this.use('track.getInfo', {artist: msq.artist, track: msq.track}, function(r){
				if (r && r.track){

					var free = r.track.freedownload;
					if (free){
						
						callback([_this.createLastfmTrack(msq, free, r.track.duration/1000, r.track.id, true)], _this.search_source);
					} else{
						var steamable = r && r.track && r.track.streamable && r.track.streamable['#text'] == '1';
						if (steamable){
							duration = 30;
							var link = 'http://ws.audioscrobbler.com/2.0/?method=track.previewmp3&trackid=' + r.track.id + "&api_key=" + _this.apikey;
							callback([_this.createLastfmTrack(msq, link, 30, r.track.id)], _this.search_source);
						} else{
							if (error){error(_this.search_source);}
						}
					}
				} else{
					if (error){error(_this.search_source);}
				}
				
				
				
			}, function(){
				if (error){error(_this.search_source);}
			}, false, nocache, {after_ajax: after_ajax, not_init_queue: true});
		}
		
	},
	getAudioById: function(id, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		callback({
			downloadable: false,
			from:'lastfm',
			link: 'http://ws.audioscrobbler.com/2.0/?method=track.previewmp3&trackid=' + id + "&api_key=" + _this.apikey,
			_id: id
		}, _this.search_source);
	}
	
});
lastfm_api.prototype.initers.push(function(){
	this.asearch = {
		test: function(mo){
			return canUseSearch(mo, _this.search_source);
		},
		search: function(){
			return _this.searchMp3.apply(_this, arguments);
		},
		name: this.search_source.name,
		description: 'last.fm',
		slave: false,
		preferred: null,
		s: this.search_source,
		q: this.queue,
		getById: function(id){
			return false;
			return _this.getAudioById.apply(_this, arguments);
		}
	};
});