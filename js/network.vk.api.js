


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
				var cached_response = widget.preferenceForKey('vk_api_' + hash);
				if (cached_response) {
					var date_string = widget.preferenceForKey('vk_api_' + hash + '_date');
					if (date_string){
						var date_of_c_response = parseInt(date_string);
						if (date_of_c_response) {
							var now_is = (new Date).getTime();
							if ((now_is - date_of_c_response) < (5 * 60 * 60 * 1000)){
								var old_r = JSON.parse(cached_response);
								if (callback) {callback(old_r);}
								return true;
							}
						}
					}
		
				}
	
	
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
				  success: function(r, textStatus, xhr){
					if (callback) {callback(r, xhr.responseText);}
					widget.setPreferenceForKey(xhr.responseText, 'vk_api_' + params_full.api_sig);
					widget.setPreferenceForKey((new Date).getTime(), 'vk_api_' + params_full.api_sig + '_date');
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
		this.use('audio.search', params_u, callback, error)
	}
}


//seesu.vk_api = new vk_api(user_id,'secret',app_id , true);
