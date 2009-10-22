var  slider ,
  searchfield ,
  srnav ,
  startlink,
  searchres;

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
	if ((loginxhr.responseText.indexOf('id') != -1) && 
		(loginxhr.responseText.indexOf('email') != -1) && 
		(loginxhr.responseText.indexOf('sid') != -1) && 
		(loginxhr.responseText.indexOf('pass') != -1)  ) {
		var r = JSON.parse(loginxhr.responseText);
		if (r.id) {
			widget.setPreferenceForKey(r.id, 'vkid');
			widget.setPreferenceForKey(r.email, 'vkemail');
			document.getElementById('auth').innerHTML = r.email + ' Выйти';
			searchfield.value = 'The Prodigy';
			slider.className = "screen-start";
			getMusic('The Prodigy');//запрос музыки	
		}	
	} else log('не получается войти')
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
	  	//log(xhr.responseText);
		if (xhr.responseText.indexOf('rows') != -1) {
			var srd = document.createElement('div');
			srd.innerHTML = JSON.parse(xhr.responseText).rows;
			var rows = $(".audioRow ", srd);

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
			slider.className = "screen-search";
		} else {
			log('Поиск не удался... :’—(');
			return false
		}
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + '&c[q]=' + encodeURIComponent(trackname);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
	srnav.innerHTML = trackname;
		
	return musicList
}

var getObjectsByPlaylist = function(playList,links) {
		var objects = new Array();
		log(playList);
		for (var i = 0, l = playList.length; i < l; i++) {
			var searchingResults = getMusic(playList[i])
			if (searchingResults[0] && searchingResults[0].link) {
				objects.push(searchingResults[0]);
				links && $(links[i]).attr({'class' : 'song', 'href' : searchingResults[0].link} );//if links present than do live rendering
				log(objects[objects.length - 1].artist + " — " + objects[objects.length - 1].track);
			}
		}
	
		if (objects.length)
			return objects;
	
 		log("Can’t get objects from playlist... :’—(");
		return false;
	}
var prepairPlaylist = function(playlist) {
	var links = [];
	searchres.innerHTML = "";
	var ul = document.createElement("ul");
	
	for (var i=0, l = playlist.length; i < l; i++) {
		var track = $("<a></a>").attr({ text: playlist[i] }),
		li = document.createElement('li');	
		$(li).append(track);
		$(ul).append(li);		
		links.push(track);
	};
	searchres.appendChild(ul);
	return links
	
}

var showPlaylist = function(objects) {
		if (objects) {
			searchres.innerHTML = "";
			
			var ul = document.createElement("ul");
			for (var i = 0, l = objects.length; i < l; i++) {
				var track = $("<a></a>").attr({ 
						href : objects[i].link, 
						class : "song",
						text: objects[i].artist + ' — ' + objects[i].track
					}),
					li = document.createElement('li');
					
				$(li).append(track);
				$(ul).append(li);
			}
			searchres.appendChild(ul);
		}
		
		return false
	}

window.addEventListener( 'load' , function(){
	$('#close-widget').click(function(){
		window.close();
	})
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
  srnav = document.getElementById('search_result_nav'),
  startlink = document.getElementById('start_search'),
  searchres = document.getElementById('search_result');
  startlink.onclick = function(){
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
			var ul = $("<ul></ul>").attr({ class: 'results-artists'});
			$(searchres).append(ul);
			for (var i=0; i < artists.length; i++) {
				var artist = artists[i].name
				var image = artists[i].image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
				var li = $("<li></li>").data('artist',artist);
				$(li).click(function(){
					var artist = $(this).data('artist');
					var tracks = lastfm('artist.getTopTracks',{artist: artist }).toptracks.track || false;
					if (tracks) {
						var playlist = [];
						for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
							playlist.push(artist + ' - ' + tracks[i].name);
						};
						var links = prepairPlaylist(playlist);
						var trackobj = getObjectsByPlaylist(playlist,links);
						//showPlaylist(trackobj);
					}
				
				});
				var p = $("<p></p>").attr({ text: artist});
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(li).append(img);
				} 
				
				$(li).append(p);
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
		slider.className = "screen-search";
		
	});
	$('#search-tag').click(function(){
		
	});
	$('#search-track').click(function(e){
		showPlaylist(getMusic(searchfield.value));
	});

}, false);

