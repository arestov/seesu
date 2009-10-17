// XHR example

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
    document.body.style.background = 'red';
    document.getElementById('auth').innerHTML += loginxhr.responseText;
    xhr.send(param);//запрос музыки
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");


var xhr = new XMLHttpRequest ();
xhr.onreadystatechange = function () {
  if ( this.readyState == 4 ) {
    document.body.style.background = '#CEC';
    opera.postError('XHR music!');
    document.getElementById('search_result').innerHTML = xhr.responseText;
  }
};
xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
var param = 'c[q]=The Prodigy&c[section]=audio';
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

window.onload = function(){
  //логин
  document.getElementById('auth').onsubmit = function(){
    loginxhr.xhrparams += '&email=' + encodeURIComponent($('#login')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
    loginxhr.send(loginxhr.xhrparams);
    return false;
  };

};

