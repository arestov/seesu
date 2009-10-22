var  slider ,
  searchfield ,
  srhead,
  srnav ,
  searchlink,
  searchres;

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
	log(loginxhr.responseText);
	var r = JSON.parse(loginxhr.responseText);
	widget.setPreferenceForKey(r.id, 'vkid');
	widget.setPreferenceForKey(r.email, 'vkemail');
	document.getElementById('auth').innerHTML = r.email + ' Выйти';
	searchfield.value = 'The Prodigy';
	slider.className = "screen-start";
	getMusic('The Prodigy');//запрос музыки
	
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
	  	log(xhr.responseText);
		var srd = document.createElement('div');
		srd.innerHTML = JSON.parse(xhr.responseText).rows;
		var rows = $(".audioRow ", srd);
		
		searchres.innerHTML = '';
		var ul = document.createElement('ul');
		searchres.appendChild(ul);
		
		
		for (var i=0, l = rows.length; i < l; i++) {
			var row = rows[i],
				text = $('.audioText', row)[0],
				artist = $('b', text)[0].textContent,
				track = $('span', text)[0].textContent,
				playStr = $('img.playimg', row )[0].getAttribute('onclick'),
				obj = parseStrToObj(playStr);
			obj.artist = artist;
			obj.track = track;
			var сссс = $("<a></a>")
				.attr({ 
					href : obj.link, 
					class : "song",
					text: artist + ' - ' + track
				});
			var li = document.createElement('li');
			$(li).append(сссс);
			$(ul).append(li);
			musicList.push(obj);
		};
		
		
		
		slider.className = "screen-artist";
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + '&c[q]=' + trackname;
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
	srhead.innerHTML = trackname;
	srnav.innerHTML = trackname;
	return musicList
}



window.addEventListener( 'load' , function(){
  	var updatex = new XMLHttpRequest ();
	updatex.onreadystatechange = function(){
	  if (this.readyState == 4) {
		log(updatex.responseText);
	  }
	};
	updatex.open('POST', 'http://seesu.heroku.com/update');
	updatex.xhrparams = 'noredirect=1';
	updatex.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	updatex.send(updatex.xhrparams);
	//see var at top
  slider = document.getElementById('slider'),
  searchfield = document.getElementById('q'),
  srhead = document.getElementById('search_result_head'),
  srnav = document.getElementById('search_result_nav'),
  searchlink = document.getElementById('start_search'),
  searchres = document.getElementById('search_result');
  searchlink.onclick = function(){
  	slider.className = "screen-start"
  }
  document.getElementById('auth').onsubmit = function(){
	loginxhr.xhrparams += '&email=' + encodeURIComponent($('#email')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
	loginxhr.send(loginxhr.xhrparams);	//логин
	return false;
  };
  if (widget.preferenceForKey('vkid')) {
	slider.className = "screen-start";
  } else{
	log('not loggin in')
}

	$('#search-artist').click(function(){
		var artists = lastfm('artist.search',{artist: searchfield.value, limit: 10 }).results.artistmatches.artist || false; 
		if (artists){
			searchres.innerHTML = '';
			var ul = document.createElement('ul');
			searchres.appendChild(ul);
			for (var i=0; i < artists.length; i++) {
				var li = $("<li></li>")
					.attr({ 
						text: artists[i].name
					});
				$(ul).append(li);
			};
			
		} else {
			searchres.innerHTML = '';
			var p = $("<p></p>")
				.attr({ 
					text: 'Ничё нет'
				});
			$(searchres).append(p);
		}
		slider.className = "screen-artist";
		
	});
	$('#search-tag').click(function(){
		
	});
	$('#search-track').click(function(e){
		getMusic(searchfield.value);
	});

}, false);

