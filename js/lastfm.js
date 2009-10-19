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
		if (paramobj) {
			for (var a in paramobj) {
				(link += ('&'+a+'=' + paramobj[a])) && apisig && paramsList.push(a + paramobj[a])
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
			xhr.onreadystatechange = function () {
			  if ( this.readyState == 4 ) {
				log(xhr.responseText)
			  }
			};
			xhr.open( 'GET', api + link, false );
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send();
		}
		
		return xhr.responseXML
		
	} else return false

}
window.addEventListener( 'load' , function(){
//var lastfm = {};

var newtoken = lastfm('auth.getToken',false,true).getElementsByTagName('token')[0].textContent;
var sk
log(newtoken)
var l = $('#lastfm');
$('#login-lastfm-button').click(function(){
	widget.openURL('http://www.last.fm/api/auth/?api_key=' + apikey + '&token='+newtoken);
	l.addClass('lastfm-auth-finish');
	return false
})
$('#login-lastfm-finish').click(function(){
	var key = lastfm('auth.getSession',{'token':newtoken }).getElementsByTagName('key')[0];
	key && (sk = key.textContent) && (l.addClass('lastfm-ready')) && log(sk) ;
	
})
$('#lastfm-scroble').click(function(){
	lastfm('album.getTags',{'artist':'Психея', 'album':'Психея', 'sk': sk}); 
})

}, false);