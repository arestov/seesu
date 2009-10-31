var apikey = '2803b2bcbc53f132b4d4117ec1509d65';
var	s = '77fd498ed8592022e61863244b53077d';
var api='http://ws.audioscrobbler.com/2.0/';
var lfm = function(method,params,callback) {
	if (method) {
		var pv_signature_list = [], // array of <param>+<value>
			params_full = params || {},
			apisig = ((params && (params.sk || params.token )) || (method == 'auth.getToken')) ? true : false; // yes, we need signature
		
		params_full.method = method;
		params_full.api_key = apikey;
		params_full.format = params_full.format || 'json';
		
		if(apisig) {
			for (var param in params_full) {
				if (!(param == 'format') && !(param == 'callback')){
					pv_signature_list.push(param + encodeURIComponent(params_full[param]));
				}
			}
			
			pv_signature_list.sort();
			
			var paramsstr = '';
			for (var i=0, l = pv_signature_list.length; i < l; i++) {
				paramsstr += pv_signature_list[i];
			};
			
			log(paramsstr + s);
			
			params_full.api_sig = hex_md5(paramsstr += s);
		}
		
		
		$.ajax({
		  url: api,
		  global: false,
		  type: "GET",
		  dataType: "json",
		  data: params_full,
		  error: function(){
		  },
		  success: function(r){
			log(JSON.stringify(r));
			if (callback) {callback(r);}
		  }
		});
	}
};
window.addEventListener( 'load' , function(){
var lfm_auth = {};	
	
var l = $('#lastfm');
lfm_auth.sk = widget.preferenceForKey('lfmsk') || false;

var get_lfm_token = function(lfm_auth,callback){
	lfm('auth.getToken',false,function(r){
		lfm_auth.newtoken = r.token;
		log(lfm_auth.newtoken);
		if (callback) {callback(lfm_auth.newtoken);}
	})
}

if (lfm_auth.sk) {
	l.addClass('lastfm-ready');
} else {
	get_lfm_token(lfm_auth)
}



$('#login-lastfm-button').click(function(){
	var open_lfm_to_login = function(token){
		widget.openURL('http://www.last.fm/api/auth/?api_key=' + apikey + '&token=' + token);
		l.addClass('lastfm-auth-finish');
	};
	
	if (lfm_auth.newtoken) {
		open_lfm_to_login(lfm_auth.newtoken);
	} else {
		get_lfm_token(lfm_auth,open_lfm_to_login);
	}
	
	return false
})
$('#login-lastfm-finish').click(function(){
	lfm('auth.getSession',{'token':lfm_auth.newtoken },function(r){
		if (!r.error) {
			lfm_auth.sk = r.session.key;
			(l.addClass('lastfm-ready'));
			log(lfm_auth.sk);
			widget.setPreferenceForKey(lfm_auth.sk, 'lfmsk');	
		}
	});
	return false
	
})
$('#lastfm-scroble').click(function(){
	lfm('user.getRecommendedArtists',{sk: lfm_auth.sk })
	return false
})

}, false);