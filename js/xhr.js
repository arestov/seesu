var slider , searchfield ,srnav ,startlink, searchres, art_page_nav,
	artsHolder,artsImage,artsBio,artsTracks,artsName,artsplhld,
	tracksHolder,tracksTracks,tracksName,trksplhld, //крекс пекс фекс
	seesu =  {
		version: 0.1
		
	},
	vk_logged_in,
	wait_for_vklogin = {},
	//referers = ['http://vk.com/reg198193','http://vk.com/reg1114384','http://vk.com/reg37829378','http://vk.com/reg668467'],
	vkReferer = '';//referers[Math.floor(Math.random()*4)];

var updatex = new XMLHttpRequest ();
updatex.onreadystatechange = function(){
  if (this.readyState == 4) {
	var r = JSON.parse(updatex.responseText);
	var cver = r.latest_version.number;
	if (cver > seesu.version) {
		var message = 
		 'Suddenly, Seesu ' + cver + ' has come. ' + 
		 'You have version ' + seesu.version + '. ';
		widget.showNotification(message, function(){
			widget.openURL(r.latest_version.link);
		})
	}
	
	vkReferer = r.vk_referer;
	
	log(vkReferer);	
	log(updatex.responseText);
  }
};
updatex.open('POST', 'http://seesu.heroku.com/update');
updatex.xhrparams = 
  'hash=' + hex_md5(widget.identifier) + '&' +
  'version=' + seesu.version + '&' +
  'demension_x=' + widget.preferenceForKey('width') + '&' + 
  'demension_y=' + widget.preferenceForKey('height');
  
updatex.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
updatex.send(updatex.xhrparams);




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
			vk_logged_in = true;
			$(document.body).addClass('vk-logged-in');
			
			wait_for_vklogin && wait_for_vklogin();
			
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
	if (!vk_logged_in) return false
	
	var musicList = [];
	musicList.links = [];
	musicList.playlist = [];
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
				musicList.links.push(obj.link);
				musicList.playlist.push(artist + ' - ' + track);
				obj.artist = artist;
				obj.track = track;
				
				musicList.push(obj);
			};
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
		
	return musicList
}

var getObjectsByPlaylist = function(playlist,links) {
	if (vk_logged_in) {
		var objects = [];
		var songNodes = [];
		log(playlist);
		for (var i = 0, l = playlist.length; i < l; i++) {
			links[i].addClass('search-mp3');
			var searchingResults = getMusic(playlist[i]);
			if (searchingResults[0] && searchingResults[0].link) {
				objects.push(searchingResults[0]);
			
				if (links) {	//if links present than do live rendering
					var link = searchingResults[0].link;
					links[i].attr({'class' : 'song', 'href' : link} );
					songNodes.push(links[i]);
					if (songNodes.length == 1) {
						set_current_song(links[i]);
						current_playlist = songNodes;
					}
					links[i].data('number_in_playlist', songNodes.length -1)
					links[i].data('link_to_playlist', songNodes );
					var mp3 = $("<a></a>").attr({ 'class': 'download-mp3', 'text': 'mp3', 'href': link });
					links[i].parent().append(mp3);
					
				}
				log(objects[objects.length - 1].artist + " — " + objects[objects.length - 1].track);
			} else  links[i].attr('class' , 'search-mp3-failed');
		}
	
		if (objects.length)
			return objects;
	
 		log("Can’t get objects from playlist... :’—(");
		return false;
	} else {
		log('wait for vklogin');
		wait_for_vklogin = function(){
			getObjectsByPlaylist(playlist,links);
		} 
		
	}	
}
var prerenderPlaylist = function(playlist,container,mp3links) { // if links present than do full rendering! yearh!
	var linkNodes = [];
	var songNodes = [];

	var ul = document.createElement("ul");
	
	for (var i=0, l = playlist.length; i < l; i++) {
		var attrs = {'text': playlist[i]};
		if (mp3links) {
			attrs.class = 'song';
			attrs.href = mp3links[i];
		}
		var track = $("<a></a>").attr(attrs),
		li = document.createElement('li');
		if (mp3links) {
			songNodes.push(track);
			track.data('number_in_playlist', songNodes.length -1);
			track.data('link_to_playlist', songNodes );
			if (songNodes.length == 1) {
				set_current_song(track);
				current_playlist = songNodes;
			}
		};
		$(li).append(track);
		$(ul).append(li);		
		linkNodes.push(track);
	};
	(container && container.html('').append(ul)) || ($(searchres).html('').append(ul) && mp3links && (slider.className = 'screen-search'));
	return linkNodes
	
}
var getTopTracks = function(artist) {
	var tracks = lastfm('artist.getTopTracks',{'artist': artist }).toptracks.track || false;
	if (tracks) {
		var playlist = [];
		for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
			playlist.push(artist + ' - ' + tracks[i].name);
		};
		return playlist
		
	} else return false
}

var setArtistPage = function (artist,image) {
	slider.className = 'sreen-artist-page';
	player_holder = artsplhld;
	if (nav_artist_page.textContent == artist) return true;
	nav_artist_page.innerHTML = artist;
	var bio = lastfm('artist.getInfo',{'artist': artist }).artist.bio.summary;
	artsName.text(artist);
	image && artsImage.attr('src',image);
	artsBio.html(bio || '');
	var traaaks = getTopTracks(artist);
	if (traaaks) {
		var links = prerenderPlaylist(traaaks,artsTracks);
		var trackobj = getObjectsByPlaylist(traaaks,links);
	}
	
	
	
}
var artistsearch = function(artist) {
	
	var artists = lastfm('artist.search',{artist: artist, limit: 10 }).results.artistmatches.artist || false; 
	if (artists){

		var image = artists[0].image[1]['#text'];
		setArtistPage(artists[0].name,image);
		
		
		searchres.innerHTML = '';
		var ul = $("<ul></ul>").attr({ class: 'results-artists'});
		$(searchres).append(ul);
		for (var i=0; i < artists.length; i++) {
			var artist = artists[i].name;
			var image = artists[i].image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			var li = $("<li></li>").data('artist',artist);
			li.data('img', image)
			$(li).click(function(){
				var artist = $(this).data('artist');
				var image = $(this).data('img');
				setArtistPage(artist,image);

			
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
		slider.className = "screen-search";
	}
}


window.addEventListener( 'load' , function(){
	$('#close-widget').click(function(){
		window.close();
	})
  	
	//see var at top
  slider = document.getElementById('slider'),
  searchfield = document.getElementById('q'),
  srnav = document.getElementById('search_result_nav'),
  startlink = document.getElementById('start_search'),
  searchres = document.getElementById('search_result'),
  art_page_nav = document.getElementById('nav_artist_page');
  trk_page_nav = document.getElementById('nav_tracks_page')
  startlink.onclick = function(){
  	slider.className = "screen-start";
  };
  srnav.onclick = function(){
  	slider.className = "screen-search";
  };

	artsHolder	= $('#artist-holder'),
	artsImage	= $('img.artist-image',artsHolder),
	artsBio		= $('p.artist-bio',artsHolder),
	artsTracks	= $('.tracks-for-play',artsHolder),
	artsplhld	= $('.player-holder',artsHolder),
	artsName	= $('#artist-name');
	
	tracksHolder = $('#tracks-holder'),
	tracksTracks = $('.tracks-for-play', tracksHolder),
	tracksName	 = $('#tracks-name');
	trksplhld 	 = $('.player-holder',tracksHolder),


$('.vk-auth').submit(function(){
	var _this = $(this);
	var email = $('input.vk-email',_this).val();
	var pass = $('input.vk-pass',_this).val();
	loginxhr.send(loginxhr.xhrparams + '&email=' + encodeURIComponent(email) + '&pass=' + encodeURIComponent(pass));	
	return false;
})


 /* document.getElementById('auth').onsubmit = function(){
	loginxhr.xhrparams += '&email=' + encodeURIComponent($('#email')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
	loginxhr.send(loginxhr.xhrparams);	//логин
	return false;
  };*/
  if (widget.preferenceForKey('vkid')) {
  	$(document.body).addClass('vk-logged-in');
  	vk_logged_in = true;
  } else{
	log('not loggin in')
}



	$('#search-artist').click(function(){
		var query = searchfield.value;
		if (query) {
			artistsearch(query)
		}
		
		
	});
	$('#search-tag').click(function(){
		
	});
	$('#search-track').click(function(e){
		var _this = $(this);
		var query = searchfield.value;
		if (query) {
			var musicObj = getMusic(query);
			if (musicObj) {
				trk_page_nav.innerHTML = query;
				tracksName.text(query)
				slider.className = 'sreen-tracks-page';
				player_holder  = trksplhld;
				prerenderPlaylist(musicObj.playlist,tracksTracks,musicObj.links);
			} else {
				wait_for_vklogin = function(){
					_this.click()
				}
			};
		}
		
	});

}, false);

