var apikey = '2803b2bcbc53f132b4d4117ec1509d65';
var	s = '77fd498ed8592022e61863244b53077d';
var api='http://ws.audioscrobbler.com/2.0/';

var lastfm = function(method,paramobj,signature){
	var paramsList = [], // arrya of <param><value>
		link = '',
		apisig = ((paramobj && (paramobj.sk || paramobj.token)) || signature) ? true : false; // yes, we need signature
	if (method) {
		(link += ('?method=' + method)) && apisig && paramsList.push('method' + method);
		(link += ('&api_key=' + apikey)) && apisig && paramsList.push('api_key' + apikey);
		link += ('&format=' + 'json');
		if (paramobj) {
			for (var a in paramobj) {
				(link += ('&'+a+'=' + paramobj[a])) && !(a == 'format') && !(a == 'callback') && apisig && paramsList.push(a + paramobj[a]);
				
				
			}
		}
		if (apisig) {
			paramsList.sort();
			var paramsstr = '';
			for (var i=0, l = paramsList.length; i < l; i++) {
				paramsstr += paramsList[i];
			};
			log(paramsstr + s);
			link += ('&api_sig=' + hex_md5(paramsstr += s));
		}
		
		var xhr = new XMLHttpRequest ();
		if (xhr) {
			var b;
			xhr.onreadystatechange = function () {
			  if ( this.readyState == 4 ) {
				b = JSON.parse(xhr.responseText);
				b.log = xhr.responseText;
			  }
			};
			xhr.open( 'GET', api + link, false );
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send();
			return b 
		}
		

		
	} else return false

}
window.addEventListener( 'load' , function(){
var l = $('#lastfm');
var sk = widget.preferenceForKey('lfmsk') || false;
sk && (l.addClass('lastfm-ready'));
var newtoken = !sk ? lastfm('auth.getToken',false,true).token : false;

log(newtoken);

$('#login-lastfm-button').click(function(){
	newtoken = newtoken || lastfm('auth.getToken',false,true).token;
	widget.openURL('http://www.last.fm/api/auth/?api_key=' + apikey + '&token='+newtoken);
	l.addClass('lastfm-auth-finish');
	return false
})
$('#login-lastfm-finish').click(function(){
	sk = lastfm('auth.getSession',{'token':newtoken }).session.key;
	sk && (l.addClass('lastfm-ready')) && log(sk) ;
	widget.setPreferenceForKey(sk, 'lfmsk');
	return false
	
})
$('#lastfm-scroble').click(function(){
	lastfm('user.getRecommendedArtists',{sk: sk }); 
	return false
})

}, false);