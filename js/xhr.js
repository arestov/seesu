// XHR example

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
	var r = JSON.parse(loginxhr.responseText)
	document.getElementById('auth').innerHTML = r.email + ' Выйти';
	log(getMusic('The Prodigy'))//запрос музыки
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");


var parseStrToObj = function(onclickstring){
	var b = onclickstring,
		fname = '';
	b = b.substring(b.indexOf('(') + 1, b.indexOf(')'));
	var params = b.split(','),
		server = params[1],
		user = params[2];
	while (user.length < 5) user = '0' + user;
	fname = params[3];
	fname = fname.substring(1, fname.length - 1);
	var obj ={'sever': server, 'user' : user , 'filename' : fname, 'link' : ('http://cs' + server + '.vkontakte.ru/u' + user + '/audio/' + fname + '.mp3')};
	return obj;

}


var getMusic = function(trackname){
	var musicList = [];
	var xhr = new XMLHttpRequest ();
	
	xhr.onreadystatechange = function () {
	  if ( this.readyState == 4 ) {
    document.getElementById('search_result').innerHTML = JSON.parse(xhr.responseText).rows;
		for (var i=0, l = rows.length; i < l; i++) {
			var row = rows[i],
				text = $('.audioText', row)[0],
				artist = $('b', text)[0].textContent,
				track = $('span', text)[0].textContent,
				playStr = $('img.playimg', row )[0].getAttribute('onclick'),
				obj = parseStrToObj(playStr);
			obj.artist = artist;
			obj.track = track;
			musicList.push(obj);
		};
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + '&c[q]=' + trackname;
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
	return musicList
}



window.addEventListener( 'load' , function(){
	//логин
  document.getElementById('auth').onsubmit = function(){
	loginxhr.xhrparams += '&email=' + encodeURIComponent($('#email')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
	loginxhr.send(loginxhr.xhrparams);
	return false;
  };
  
}, false);

