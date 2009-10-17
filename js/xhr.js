// XHR example

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4){
  	document.body.style.background = 'red';
  	opera.postError('XHR logging in');
  	opera.postError(xhr.responseText);
  	xhr.send(param);//запрос музыки
  }
}
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");



var xhr = new XMLHttpRequest ();
xhr.onreadystatechange = function () {
  if ( this.readyState == 4 ) {
    document.body.style.background = '#CEC';
    opera.postError('XHR music!');
    opera.postError(xhr.responseText);
  }
}
xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
var param = 'c[q]=The Prodigy&c[section]=audio';
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

window.onload = function(){
  //логин
  $('#enter-vk').click(function(){
  	loginxhr.xhrparams += '&email=' + encodeURIComponent($('#login-vk')[0].value) + '&pass=' + encodeURIComponent($('#pass-vk')[0].value);
  	loginxhr.send(loginxhr.xhrparams); 
  })  


}

