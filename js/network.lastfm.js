var apikey = '2803b2bcbc53f132b4d4117ec1509d65';
var	s = '77fd498ed8592022e61863244b53077d';
var api='http://ws.audioscrobbler.com/2.0/';
var lastfm_cache_on = true;
var lastfm = function(method, params, callback, nocache, type_of_xhr_is_post) {
	if (method) {
		var use_cache = (lastfm_cache_on && !type_of_xhr_is_post && !nocache)


		var pv_signature_list = [], // array of <param>+<value>
			params_full = params || {},
			apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
		
		params_full.method = method;
		params_full.api_key = apikey;
		params_full.format = params_full.format || 'json';
		

		var paramsstr = '';
		if(apisig || use_cache) {
			for (var param in params_full) {
				if ((param != 'format') && (param != 'callback')){
					pv_signature_list.push(param + params_full[param]);
				}
			}
			pv_signature_list.sort();
			
			for (var i=0, l = pv_signature_list.length; i < l; i++) {
				paramsstr += pv_signature_list[i];
			};
			params_full.api_sig = hex_md5(paramsstr + s);
		}
		
		if (use_cache){
			var cache_used = cache_ajax.get('lastfm', params_full.api_sig, callback)	
		}

		if (!cache_used){
			return seesu.lfm_quene.add(function(){
				$.ajax({
				  url: api,
				  global: false,
				  type: (type_of_xhr_is_post == true) ? "POST" : "GET",
				  dataType: "jsonp",
				  data: params_full,
				  error: function(r){
				  },
				  success: function(r){
					cache_ajax.set('lastfm', params_full.api_sig, r)
					if (callback) {callback(r);}
				  },
				  complete: function(xhr){
				  	//console.log(xhr.responseText)
				  }
				});
				//console.log(params_full)
			})
		}

	}
};

var lfm_sc = {
	scrobbling:  w_storage('lfm_scrobbling_enabled') ? true : false, 
	music: (function(){
		var lfmscm = w_storage('lfm_scrobble_music');
		if (lfmscm) {
			return JSON.parse(lfmscm);
		} else {
			return [];
		}
	})(),
	nowplay: function(mo){
		if (!lfm_auth.sk){return false}
		lastfm('track.updateNowPlaying', {
			sk: lfm_auth.sk,
			artist: mo.artist,
			track: mo.track,
			duration: mo.duration
			
		}, function(r){}, true, true);
	},
	submit: function(mo){
		var _this = this;
		var artist = mo.artist,
			title = mo.track,
			duration = mo.duration,
			starttime = mo.start_time,
			last_scrobble = mo.last_scrobble,
			timestamp = ((new Date()).getTime()/1000).toFixed(0);
			
		
		if (((timestamp - starttime)/duration > 0.2) || (last_scrobble && ((timestamp - last_scrobble)/duration > 0.6)) ){
			this.music.push({
				'artist': artist, 
				'track': track,
				'duration': duration, 
				'timestamp': timestamp
			});
			mo.start_time = false;
			mo.last_scrobble = timestamp;
		} 
		if (lfm_auth.sk && this.music.length) {
			var _this = this;
			
			var post_m_obj = {sk: lfm_auth.sk};
			for (var i=0,l=_this.music.length; i < l; i++) {
				post_m_obj['artist[' + i + ']'] = _this.music[i].artist;
				post_m_obj['track[' + i + ']'] = _this.music[i].track;
				post_m_obj['timestamp[' + i + ']'] = _this.music[i].timestamp;
				post_m_obj['duration[' + i + ']'] = _this.music[i].duration;
			};
			
			
			lastfm('track.scrobble', post_m_obj, function(r){
				if (r){
					_this.music = [];
					w_storage('lfm_scrobble_music', '');
				} 
				
			}, true, true);
		} else {
			if (_this.music.length){
				w_storage('lfm_scrobble_music', _this.music);
			} 
		}
	}
};
