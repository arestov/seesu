var apikey = '2803b2bcbc53f132b4d4117ec1509d65';
var	s = '77fd498ed8592022e61863244b53077d';
var api='http://ws.audioscrobbler.com/2.0/';

var lastfm = function(method,paramobj,signature){
	var paramsList = [],
		link = '',
		apisig = ((paramobj && (paramobj.sk || paramobj.token)) || signature) ? true : false; // yes, we need signature
	if (method) {
		(link += ('method=' + encodeURIComponent(method))) && apisig && paramsList.push('method' + encodeURIComponent(method));
		(link += ('&api_key=' + apikey)) && apisig && paramsList.push('api_key' + apikey);
		if (paramobj) {
			for (var a in paramobj) {
				(link += ('&'+a+'=' + encodeURIComponent(paramobj[a]))) && apisig && paramsList.push(encodeURIComponent(a + paramobj[a]))
			}
		}
		if (apisig) {
			paramsList.sort();
			var paramsstr = '';
			for (var i=0, l = paramsList.length; i < l; i++) {
				paramsstr += paramsList[i];
			};
			link += ('&api_sig=' + hex_md5(paramsstr += s));
		}
		
		var xhr = new XMLHttpRequest ();
		if (xhr) {
			xhr.onreadystatechange = function () {
			  if ( this.readyState == 4 ) {
				log(xhr.responseText)
			  }
			};
			xhr.open( 'GET', api + '?' + link, false );
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send();
		}
		
		return xhr.responseText
		
	} else return false

}
window.addEventListener( 'load' , function(){
log(lastfm('auth.getToken',false,true));
}, false);