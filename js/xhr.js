var slider , searchfield ,srnav ,startlink, searchres, art_page_nav,
	artsHolder,artsImage,artsBio,artsTracks,artsName,artsplhld,art_tracks_w_counter,
	tracksHolder,tracksTracks,tracksName,trksplhld, //крекс пекс фекс
	seesu =  {
		version: 0.15
		
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
		var link = r.latest_version.link;
		if (link.indexOf('http') != -1) {
			widget.showNotification(message, function(){
				widget.openURL(link);
			});
		}

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
  
log(updatex.xhrparams);

updatex.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
updatex.send(updatex.xhrparams);

var vk_logg_in = function(id,email){
	widget.setPreferenceForKey(id, 'vkid');
	widget.setPreferenceForKey(email, 'vkemail');
	vk_logged_in = true;
	$(document.body).addClass('vk-logged-in');
	log('вошли в контакте и скрыли форму логина');
};
var vk_logged_out = function(){
	widget.setPreferenceForKey(null, 'vkid');
	widget.setPreferenceForKey(null, 'vkemail');
	vk_logged_in = false;
	$(document.body).removeClass('vk-logged-in');
	log('отображаем форму логина где нужно');
	
};

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
	log(loginxhr.responseText);
	if ((loginxhr.responseText.indexOf('id') != -1) && 
		(loginxhr.responseText.indexOf('email') != -1) && 
		(loginxhr.responseText.indexOf('sid') != -1) && 
		(loginxhr.responseText.indexOf('pass') != -1)  ) {
		var r = JSON.parse(loginxhr.responseText);
		if (r.id) {
			log(vk_logged_in);
			vk_logg_in(r.id, r.email);
			wait_for_vklogin && wait_for_vklogin();
		}	
	} else {log('не получается войти');}
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");

var vk_login = function(login,pass) {
	loginxhr.send(loginxhr.xhrparams + '&email=' + encodeURIComponent(login) + '&pass=' + encodeURIComponent(pass));
}
var vk_login_check = function(){
	$.ajax({
	  url: "http://vkontakte.ru/feed2.php",
	  global: false,
	  type: "GET",
	  dataType: "json",
	  error: function(){
		log('vignali!');
		vk_logged_out();
	  },
	  success: function(r){
	  }
	});
};

var parseStrToObj = function(onclickstring){
	var b = onclickstring,
		fname = '';
	b = b.substring(b.indexOf('(') + 1, b.indexOf(')'));
	var params = b.split(','),
		server = params[1],
		user = params[2];
	while (user.length < 5) {user = '0' + user;}
	fname = params[3];
	fname = fname.substring(1, fname.length - 1);
	var obj ={'sever': server, 'user' : user , 'filename' : fname, 'link' : ('http://cs' + server + '.vkontakte.ru/u' + user + '/audio/' + fname + '.mp3')};
	return obj;

};


var getMusic = function(trackname){
	if (!vk_logged_in) {return false;}
	
	var musicList = [];
	musicList.links = [];
	musicList.playlist = [];
	var xhr = new XMLHttpRequest ();
	
	xhr.onreadystatechange = function () {
	  if ( this.readyState == 4 ) {
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
				musicList.playlist.push({'artist_name' : artist ,'track_title': track});
				obj.artist = artist;
				obj.track = track;
				
				musicList.push(obj);
			}
		} else {
			log('Поиск не удался... :’—(');
			log(xhr.responseText);
			if ((xhr.responseText.indexOf('http://vkontakte.ru/login.php?op=logout') != -1) && xhr.responseText.indexOf('http://vkontakte.ru/images/progress.gif' != -1)) {
				vk_logged_out();
				log('квантакте изгнал вас из рая');
			}
			return false;
		}
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + '&c[q]=' + encodeURIComponent(trackname);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
		
	return musicList;
};
var sort_by_play_order = function(g,f){
	if (g && f) {
		if (g.data('play_order') > f.data('play_order'))
			{return 1;}
		else if (g.data('play_order') < f.data('play_order'))
			{return -1;}
		else
		{return 0;}
	} else {return 0;}
	
};
var resort_playlist = function(playlist_nodes_for){
	playlist_nodes_for.sort(sort_by_play_order);
	if (playlist_nodes_for.length > 1) {
		for (var i=0, l = playlist_nodes_for.length; i < l ; i++) {
			playlist_nodes_for[i].data('number_in_playlist',i);
		};
	}
}
var get_vk_track = function(tracknode,playlist_nodes_for) {
	if (!vk_logged_in) {
		return false;
	} else {
		var now = (new Date()).getTime(),
			timeout;
		var this_func = arguments.callee;
		art_tracks_w_counter.text(this_func.tracks_waiting_for_search = (this_func.tracks_waiting_for_search + 1) || 1);
		
		this_func.call_at = this_func.call_at || now;
		if ( this_func.call_at && (this_func.call_at > now)) {
			timeout = this_func.call_at - now;
		} else {
			timeout = 0;
			this_func.call_at = now;
		}
		
		setTimeout(function(){
			$.ajax({
			  url: "http://vkontakte.ru/gsearch.php",
			  global: false,
			  type: "POST",
			  data: ({'c[section]' : 'audio', 'c[q]' : tracknode.data('artist_name') + ' - ' + tracknode.data('track_title')}),
			  dataType: "json",
			  beforeSend: function(){
				tracknode.addClass('search-mp3');
			  },
			  error: function(r){
				tracknode.attr('class' , 'search-mp3-failed');
				art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
				
				log('Вконтакте молвит: ' + r.responseText);
				if (r.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
					this_func.call_at += (1000*60*5);
				} else {
					vk_login_check();
				}
				
			  },
			  success: function(r){
				log('Квантакте говорит: ' + r.summary);
				var srd = document.createElement('div');
					srd.innerHTML = r.rows;
				var rows = $(".audioRow ", srd);
				if (rows.length) {
					var row = rows[0],
						playStr = $('img.playimg', row )[0].getAttribute('onclick'),
						link = parseStrToObj(playStr).link;
					make_node_playable(tracknode,link,playlist_nodes_for);
					resort_playlist(playlist_nodes_for);
				
				} else {
					tracknode.attr('class' , 'search-mp3-failed');
				}
				art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
			  }
			});
		},timeout);
		
		this_func.call_at += ((this_func.tracks_waiting_for_search % 16) == 0) ? 5000 : 900;
	}
	
	
	return false;
};

var make_tracklist_playable = function(track_nodes){
	if (vk_logged_in) {
		var songNodes = [];
		for (var i=0, l =  track_nodes.length; i < l; i++) {
			var node = track_nodes[i],
				playlist_nodes_for = songNodes;
			get_vk_track(node,playlist_nodes_for);
		}
	} else {
		wait_for_vklogin = function(){
			make_tracklist_playable(track_nodes);
		};
	}
};
var make_node_playable = function(node,http_link,playlist_nodes_for){
	var playable_node = $(node).attr({'class' : 'song', 'href' : http_link} );
	playlist_nodes_for.push(playable_node);

	var playlist_length = playlist_nodes_for.length;
	if ((playlist_length == 1) || (playable_node.data('want_to_play') == want_to_play) ) {
		set_current_song(playable_node);
		current_playlist = playlist_nodes_for;
	}
	
	playable_node.data('number_in_playlist', playlist_length-1);
	playable_node.data('link_to_playlist', playlist_nodes_for);
	

	var mp3 = $("<a></a>").attr({ 'class': 'download-mp3', 'text': 'mp3', 'href': http_link });
	playable_node.parent().append(mp3);
};

var prerenderPlaylist = function(playlist,container,mp3links) { // if links present than do full rendering! yearh!
	var linkNodes = [];
	var songNodes = [];

	var ul = document.createElement("ul");
	
	for (var i=0, l = playlist.length; i < l; i++) {
		var attr = {'class' : 'waiting-full-render', 'text' :  playlist[i].artist_name + ' - ' + playlist[i].track_title};
		var track = $("<a></a>").attr(attr).data('play_order', i),
			li = document.createElement('li');
		track.data('artist_name',playlist[i].artist_name ).data('track_title', playlist[i].track_title )
		$(li).append(track);
		
		
		if (mp3links) {
			var link = mp3links[i];
			make_node_playable(track,link,songNodes);
		}
		
		$(ul).append(li);		
		linkNodes.push(track);
	}
	(container && container.html('').append(ul)) || ($(searchres).html('').append(ul) && mp3links && (slider.className = 'screen-search'));
	return linkNodes;
	
};
var vk_track_search = function(query){
	trk_page_nav.innerHTML = query;
	tracksName.text(query);
	slider.className = 'sreen-tracks-page';
	player_holder  = trksplhld;
		
	var musicObj = getMusic(query);
	if (musicObj) {
		
		prerenderPlaylist(musicObj.playlist,tracksTracks,musicObj.links);
	} else {
		wait_for_vklogin = function(){
			_this.click();
		}
	}
}

var getTopTracks = function(artist) {
	var tracks = lastfm('artist.getTopTracks',{'artist': artist }).toptracks.track || false;
	if (tracks) {
		var playlist = [];
		for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
			playlist.push({'artist_name' : artist ,'track_title': tracks[i].name});
		}
		return playlist;
		
	} else {return false;}
};

var setArtistPage = function (artist,image) {
	slider.className = 'sreen-artist-page';
	player_holder = artsplhld;
	if (nav_artist_page.textContent == artist) {return true;}
	nav_artist_page.innerHTML = artist;
	var info	 = lastfm('artist.getInfo',{'artist': artist }).artist,
		similars = info.similar.artist,
		tags	 = info.tags.tag,
		bio		 = info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm"),
		image	 = image || info.image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
	artsName.text(artist);
	artsImage.attr({'src': image ,'alt': artist});
	artsBio.html(bio || '');
	if (tags && tags.length) {
		var tags_p = $("<p></p>").attr({ 'class': 'artist-tags', 'text' : 'Tags: '});
		for (var i=0, l = tags.length; i < l; i++) {
			var tag = tags[i],
				arts_tag_node = $("<a></a>").attr({ text: tag.name, href: tag.url });
			tags_p.append(arts_tag_node);
		};
		artsBio.append(tags_p);
	}
	if (similars && similars.length) {
		var similars_p = $("<p></p>").attr({ 'class': 'artist-similar', 'text' : 'Similar artists: '});
		for (var i=0, l = similars.length; i < l; i++) {
			var similar = similars[i],
				arts_similar_node = $("<a></a>").attr({ text: similar.name, href: similar.url, 'class' : 'artist' }).data('artist', similar.name );
			similars_p.append(arts_similar_node);
		};
		artsBio.append(similars_p);
	}
	var traaaks = getTopTracks(artist);
	if (traaaks) {
		var music_nodes = prerenderPlaylist(traaaks,artsTracks);
		make_tracklist_playable(music_nodes);
	}
	
	
	
};
var artistsearch = function(artist_query) {
	
	var artists = lastfm('artist.search',{artist: artist_query, limit: 10 }).results.artistmatches.artist || false; 
	if (artists){
		if (artists.length){
			searchres.innerHTML = '';
			var ul = $("<ul></ul>").attr({ 'class': 'results-artists'});
			$(searchres).append(ul);
			for (var i=0; i < artists.length; i++) {
				var artist = artists[i].name,
					image = artists[i].image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
				
				if (i === 0) {setArtistPage(artist,image);}
				
				var li = $("<li></li>").data('artist',artist);
					li.data('img', image);
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
			} 
		} else if (artists.name) {
			var artist = artists.name,
				image = artists.image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			setArtistPage(artist,image);
		}
		
	} else {
		searchres.innerHTML = '';
		var p = $("<p></p>").attr({ text: 'Ничё нет'});
		$(searchres).append(p);
		slider.className = "screen-search";
	}
};


window.addEventListener( 'load' , function(){
	$('#close-widget').click(function(){
		window.close();
	});
	//see var at top
  slider = document.getElementById('slider');
  searchfield = document.getElementById('q');
  srnav = document.getElementById('search_result_nav');
  startlink = document.getElementById('start_search');
  searchres = document.getElementById('search_result');
  art_page_nav = document.getElementById('nav_artist_page');
  trk_page_nav = document.getElementById('nav_tracks_page');
  startlink.onclick = function(){
	slider.className = "screen-start";
  };
  srnav.onclick = function(){
	slider.className = "screen-search";
  };

	artsHolder	= $('#artist-holder');
	artsImage	= $('img.artist-image',artsHolder);
	artsBio		= $('.artist-bio',artsHolder);
	artsTracks	= $('.tracks-for-play',artsHolder);
	artsplhld	= $('.player-holder',artsHolder);
	art_tracks_w_counter = $('.tracks-waiting-for-search',artsHolder)
	artsName	= $('#artist-name');
	
	tracksHolder = $('#tracks-holder');
	tracksTracks = $('.tracks-for-play', tracksHolder);
	tracksName	 = $('#tracks-name');
	trksplhld	 = $('.player-holder',tracksHolder);
	
var flash_settings = $('.internet-flash-settings input');
	
flash_settings.change(function(){
	if($(this).attr('checked')) {
		widget.setPreferenceForKey('true', 'flash_internet');
		$(document.body).addClass('flash-internet');
	} else {
		widget.setPreferenceForKey(null, 'flash_internet');
		$(document.body).removeClass('flash-internet');
	}
});

if (widget.preferenceForKey('flash_internet')) {
	$(document.body).addClass('flash-internet');
	flash_settings.attr('checked', 'checked');
}



$('.vk-auth').submit(function(){
	var _this = $(this);
	var email = $('input.vk-email',_this).val();
	var pass = $('input.vk-pass',_this).val();
	vk_login(email,pass);
	return false;
});

  if (widget.preferenceForKey('vkid')) {
	$(document.body).addClass('vk-logged-in');
	vk_logged_in = true;
  } else{
	log('not loggin in');
  }



	$('#search-artist').click(function(){
		var query = searchfield.value;
		if (query) {
			artistsearch(query);
		}
		
		
	});
	$('#search-tag').click(function(){
		
	});
	$('#search-track').click(function(e){
		var _this = $(this);
		var query = searchfield.value;
		if (query) {
			vk_track_search(query)
		}
		
	});

}, false);

