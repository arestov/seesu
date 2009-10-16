// XHR example
var xhr = new XMLHttpRequest ();
xhr.onreadystatechange = function () {
  if ( this.readyState == 4 ) {
    document.body.style.background = '#CEC';
    opera.postError('XHR working!');
    opera.postError(xhr.responseText);
  }
}
xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
var param = 'c[q]=The Prodigy&c[section]=audio';
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

window.onload = function(){
  xhr.send(param);
}