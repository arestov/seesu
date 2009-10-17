// XHR example

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
    document.body.style.background = 'red';
    document.getElementById('auth').innerHTML = JSON.parse(loginxhr.responseText).email + ' Выйти';
    getMusic('The Prodigy')//запрос музыки
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");


var getMusic = function(trackname){
	var xhr = new XMLHttpRequest ();
	xhr.onreadystatechange = function () {
	  if ( this.readyState == 4 ) {
	    document.body.style.background = '#CEC';
	    opera.postError('XHR music!');
	    var srd = document.createElement('div');
	    srd.innerHTML = JSON.parse(xhr.responseText).rows;
	    document.getElementById('search_result').appendChild(srd);
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + 'c[q]=' + trackname;
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
}



window.addEventListener( 'load' , function(){
	//логин
  document.getElementById('auth').onsubmit = function(){
    loginxhr.xhrparams += '&email=' + encodeURIComponent($('#email')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
    loginxhr.send(loginxhr.xhrparams);
    return false;
  };
  
}, false);

