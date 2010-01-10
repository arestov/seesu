


//var viewer_id 		= seesu.vk_id;
var vk_api = function(viewer_id,s,api_id){
	this.viewer_id 	= viewer_id;
	this.s 			= s;
	this.api_id 	= api_id;
	this.api_link 	= 'http://api.vkontakte.ru/api.php';
	this.v 			= '2.0';
}

vk_api.prototype = {
	'use': function(method,params,callback,error){
	
		if (method) {
			var _this = this;
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig =  true; // yes, we need signature
			
			params_full.method 	= method;
			params_full.api_id 	= this.api_id;
			params_full.v		= this.v;
			params_full.format 	= params_full.format || 'json';
			
			if(apisig) {
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
			
			$.ajax({
			  url: _this.api_link,
			  global: false,
			  type: "GET",
			  dataType: params_full.format || "XML",
			  data: params_full,
			  error: function(xhr){
			  	if (error) {error(xhr);}
			  },
			  success: function(r){
				if (callback) {callback(r);}
			  },
			  complete: function(xhr){
			  	log(xhr.responseText)
			  }
			});
		}
	},
	audio_search: function(query,params,callback,error){
		var params_u = params || {};
			params_u.q = query;
			params_u.count = params_u.count || 30;
		this.use('audio.search',params_u,callback,error)
	}
}