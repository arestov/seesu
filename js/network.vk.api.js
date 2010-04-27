


//var viewer_id 		= seesu.vk_id;
var vk_api = function(viewer_id, s, api_id, test_mode, cache){
	this.viewer_id 	= viewer_id;
	this.s 			= s;
	this.api_id 	= api_id;
	this.api_link 	= 'http://api.vkontakte.ru/api.php';
	this.v 			= '2.0';
	if (test_mode){
		this.test_mode = true;
	}
	if (cache){
		this.use_cache = true;
	}
}

vk_api.prototype = {
	'use': function(method, params, callback, error, nocache){
	
		if (method) {
			var use_cache = (this.use_cache && !nocache)

			var _this = this;
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig =  true; // yes, we need signature
			
			params_full.method 	= method;
			params_full.api_id 	= this.api_id;
			params_full.v		= this.v;
			params_full.format 	= params_full.format || 'json';
			
			if (this.test_mode) {
				params_full.test_mode = 1;
			}
			
			if(apisig || use_cache) {
				for (var param in params_full) {
					pv_signature_list.push(param + '=' + params_full[param]);
					
				}
				
				pv_signature_list.sort();
				var paramsstr = '';
				for (var i=0, l = pv_signature_list.length; i < l; i++) {
					paramsstr += pv_signature_list[i];
				};
				
				params_full.sig = hex_md5(this.viewer_id + paramsstr + this.s);

			}
			
			if (use_cache){
				var cache_used = cache_ajax.get('vk_api', params_full.api_sig, callback)
				if (cache_used) {return true;}
			}

			if (seesu.delayed_search.waiting_for_mp3provider){
				return false;
			}
			
			seesu.mp3_quene.add(function(){
				$.ajax({
				  url: _this.api_link,
				  global: false,
				  type: "GET",
				  dataType: params_full.format || "XML",
				  data: params_full,
				  timeout: 20000,
				  error: function(xhr){
				  	if (error) {error(xhr);}
				  },
				  success: function(r){
					cache_ajax.set('vk_api', params_full.api_sig, r)
					if (callback) {callback(r);}
				  },
				  complete: function(xhr){
				  }
				});

			});
			return true;
			
		}
	},
	audio_search: function(query, callback, error, nocache, after_ajax, params){
		var params_u = params || {};
			params_u.q = query;
			params_u.count = params_u.count || 30;
		var used_successful = this.use('audio.search', params_u, 
		function(r){
			if (r.response && (r.response.length > 1 )) {
				var music_list = [];
				for (var i=1, l = r.response.length; i < l; i++) {
					var entity = {
						'artist'  	:r.response[i].artist,
						'duration'	:r.response[i].duration,
						'link'		:r.response[i].url,
						'track'		:r.response[i].title
					
					};
					if (!has_music_copy(music_list,entity)){
						music_list.push(entity)
					}
				
				
				};
				if (music_list && music_list.length){
					if (callback) {callback(music_list);}
				} else{
					if (error) {error()}
				}
			
			} else{
				if (error) {error()}
			}
		}, error, nocache)
		if (after_ajax) {after_ajax();}
		return used_successful;
	}
}

$(function(){
	seesu.vk_api =  new vk_api('198193', '4YEx7NPh3I', '1858111', true);
	seesu.delayed_search.vk_api.search_tracks = function(){
		seesu.vk_api.audio_search.apply(seesu.vk_api, arguments)
	};
	if (typeof seesu.vk_api === 'object') {
		seesu.delayed_search.available.push('vk_api');
		swith_to_provider(true);
		$('#mp3way-vk-api').removeClass('cant-be-used');
	}
	
	prov_count_down--;
	if (prov_count_down == 0){
		swith_to_provider();
	}
})
