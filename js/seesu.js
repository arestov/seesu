testing = false;
lfm_image_artist = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
seesu =  {
	  version: 1.7,
	  vk:{
		"id": widget.preferenceForKey('vkid'),
		"big_vk_cookie": widget.preferenceForKey('big_vk_cookie'),
		"set_xhr_headers": function(xhr){
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			if (seesu.vk.big_vk_cookie){
				xhr.setRequestHeader("Cookie", seesu.vk.big_vk_cookie);
			}
		}
	  },
	  ui: {},
	  xhrs: {},
	  delayed_search: {
		'available': [],
		"use":{
			"delay_mini": 2500,
			"delay_big": 5000,
			"big_delay_interval": 5,
			"search_one_track": get_audme_track,
			"search_many_tracks": get_all_audme_tracks
		},
		"audme":{
			"delay_mini": 2500,
			"delay_big": 5000,
			"big_delay_interval": 5,
			"search_one_track": get_audme_track,
			"search_many_tracks": get_all_audme_tracks
		},
		"vk":{
			"delay_mini": 1000,
			"delay_big": 8000,
			"big_delay_interval": 7,
			"search_one_track": get_vk_track,
			"search_many_tracks": get_all_vk_tracks
		},
		"waiting_for_mp3provider" : true,
		"we_need_mp3provider": function(callback){
			$(document.body).addClass('vk-needs-login');
			$('#tracks-search').addClass('want-to-select-mp3-search');

			seesu.delayed_search.start_for_mp3provider = function(){
				seesu.delayed_search.waiting_for_mp3provider = false;
				seesu.delayed_search.start_for_mp3provider = null;
				$(document.body).removeClass('vk-needs-login');
				$('#tracks-search').removeClass('want-to-select-mp3-search');
				if (callback) {callback();}
			};
		},
		"switch_to_audme": function(){
			seesu.delayed_search.use = seesu.delayed_search.audme;
			$(function(){
				
				setTimeout(function(){
					$('#mp3-search-switch').find('.mp3searchway').attr('checked', '').filter('#mp3-audme').attr('checked', 'checked');
					
				},10);
			});
			seesu.delayed_search.waiting_for_mp3provider = false;
			widget.setPreferenceForKey('audme', 'mp3-search-way');
			if (typeof seesu.delayed_search.start_for_mp3provider == 'function'){
				seesu.delayed_search.start_for_mp3provider();
			}
		},
		"switch_to_vk": function(){
			seesu.delayed_search.use = seesu.delayed_search.vk;
			$(function(){
				setTimeout(function(){
					$('#mp3-search-switch').find('.mp3searchway').attr('checked', '').filter('#mp3-vk').attr('checked', 'checked');					
				},10);
				
			});
			seesu.delayed_search.waiting_for_mp3provider = false;
			widget.setPreferenceForKey('vk', 'mp3-search-way');
			if (typeof seesu.delayed_search.start_for_mp3provider == 'function'){
				seesu.delayed_search.start_for_mp3provider();
			}
		}
	  }
	};
	
wait_for_vklogin = function(){};
vkReferer = '';
lfm_auth = {};
	

$(function(){
	searchfield = document.getElementById('q');
	if (document.activeElement.nodeName != 'INPUT') {
		searchfield.focus();
	}
	if (!location.protocol.match(/http/)){
		try_mp3_providers();
	}
	
});


lfm_auth.sk = widget.preferenceForKey('lfmsk') || false;
lfm_auth.user_name = widget.preferenceForKey('lfm_user_name') || false;
lfm_auth.ui_logged = function(){
	$(document.body).addClass('lfm-auth-done');
	$('.lfm-finish input[type=checkbox]').attr('checked', 'checked');
	$('#scrobbling-switches').find('input').attr('disabled', '');
};
lfm_auth.login = function(r){
	lfm_auth.sk = r.session.key;
	lfm_auth.user_name = r.session.name;
	widget.setPreferenceForKey(lfm_auth.user_name, 'lfm_user_name');
	widget.setPreferenceForKey(lfm_auth.sk, 'lfmsk');
	lfm_auth.ui_logged();
};
var updating_notify = function(r){
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
			$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"></a>');
		}
	}
	log(cver);
	vkReferer = r.vk_referer;
	log(vkReferer);
};
var check_seesu_updates = function(){
	$.ajax({
	  url: 'http://seesu.heroku.com/update',
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'hash': hex_md5(widget.identifier),
		'version': seesu.version,
		'demension_x': widget.preferenceForKey('width'),
		'demension_y': widget.preferenceForKey('height')
	  },
	  error: function(){
	  },
	  success: updating_notify
	});
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
		}
	}
};

var half_sync_making = function(track_nodes){
	var playlist_nodes_for = [];
	for (var i=0, l =  track_nodes.length; i < l; i++) {
		var node = track_nodes[i];
		delay_track_search(node,playlist_nodes_for, (i===0),seesu.delayed_search.use.search_one_track);

	}
}



var async_making = function(track_nodes){
	var playlist_nodes_for = [];
	var random_track_plable = function(track_list){
		var random_track_num = Math.floor(Math.random()*track_list.length);
		return track_list[random_track_num];
		
	}
	var start_random_nice_track_search = function(node, reset){
		getTopTracks(node.data('artist_name'), function(track_list){
			var some_track = random_track_plable(track_list);
			node.text(some_track.artist + ' - ' + some_track.track);
			node.data('track_title', some_track.track );
			delay_track_search(node,playlist_nodes_for, reset, seesu.delayed_search.use.search_one_track);
		} );
	}
	
	for (var i=0, l =  track_nodes.length; i < l; i++) {
		start_random_nice_track_search(track_nodes[i], (i===0))
	}
}
var make_tracklist_playable = function(track_nodes){
	var we_have_tracks = track_nodes[0].data('track_title') ? true : false;
	
	
	
	if (we_have_tracks) {
		if (seesu.delayed_search.waiting_for_mp3provider){
			seesu.delayed_search.we_need_mp3provider((function(track_nodes){
				return function(){
					half_sync_making(track_nodes)
				}
			})(track_nodes))
		} else {
			half_sync_making(track_nodes)
		}
	} else{
		if (seesu.delayed_search.waiting_for_mp3provider){
			seesu.delayed_search.we_need_mp3provider((function(track_nodes){
				return function(){
					async_making(track_nodes)
				}
			})(track_nodes))
		} else {
			async_making(track_nodes)
		}
		
	}
	
	
};
var make_node_playable = function(node, http_link, playlist_nodes_for, mp3_duration){
	var playable_node = $(node)
		.addClass('song js-serv')
		.removeClass('waiting-full-render')
		.data('mp3link', http_link)
		.data('duration', mp3_duration);
	playlist_nodes_for.push(playable_node);
	
	
	
	var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href': http_link });
	mp3.insertBefore(playable_node);
	
	if (mp3_duration) {
		var digits = mp3_duration % 60;
		var track_dur = (Math.round(mp3_duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
		playable_node.parent().append($('<div class="song-duration"></div>').text(track_dur + ' '));
	}
	var playlist_length = playlist_nodes_for.length;
	if ((playlist_length == 1) || (playable_node.data('want_to_play') == seesu.player.want_to_play) ) {
		(function(playable_node, playlist_nodes_for ){
			setTimeout(function(){
				seesu.player.set_current_song(playable_node);
				seesu.player.current_playlist = playlist_nodes_for;
			},100);
		})(playable_node,playlist_nodes_for );
		
	}
	playable_node.data('number_in_playlist', playlist_length-1);
	playable_node.data('link_to_playlist', playlist_nodes_for);
};



var render_playlist = function(vk_music_list) { // if links present than do full rendering! yearh!
	

	var ul = document.createElement("ul");
	
	
	if (artsTracks) {
		artsTracks.html('').append(ul);
	}
	if (!vk_music_list){
		$(ul).append('<li>Nothing found</li>');
	} else {
		var linkNodes = [];
		var songNodes = [];

		var we_have_tracks = vk_music_list[0].track ? true : false;
		var we_have_mp3links = vk_music_list[0].link ? true : false;
		
		
		for (var i=0, l = vk_music_list.length; i < l; i++) {
			var track = $("<a></a>")
				.addClass('track-node waiting-full-render')
				.data('play_order', i),
				li = document.createElement('li');

			track.data('artist_name', vk_music_list[i].artist);
			
			if (we_have_tracks){
				track.text(vk_music_list[i].artist + ' - ' + vk_music_list[i].track);
				track.data('track_title', vk_music_list[i].track );
			} else{
				track.text(vk_music_list[i].artist)
			}
			
			
			
			$(li)
				.append(track)
				.append(play_controls.clone(true))
				.append(track_zoom.clone())
				.append('<a class="track-zoomin js-serv">&rarr;</a>')
				.append('<a class="track-zoomout js-serv">&larr;</a>')
				.appendTo(ul);
			
			if (we_have_mp3links) {
				make_node_playable(track, vk_music_list[i].link ,songNodes, vk_music_list[i].duration);
			} else {
				linkNodes.push(track);
			}	
		}
	
		if (!we_have_mp3links){
			make_tracklist_playable(linkNodes);//get mp3 for each prepaired node (do many many delayed requests to mp3 provider)
	
		}
		return true;
	}
};
var vk_track_search = function(query){
	nav_artist_page.innerHTML = query;

	slider.className = 'show-full-nav show-player-page';
	if (seesu.delayed_search.waiting_for_mp3provider){
		$(document.body).addClass('vk-needs-login');
		$('#tracks-search').addClass('want-to-select-mp3-search');
	
		seesu.delayed_search.start_for_mp3provider = (function(query, render_playlist){
			
			return function(){
				seesu.delayed_search.waiting_for_mp3provider = false;
				seesu.delayed_search.start_for_mp3provider = null;
				seesu.delayed_search.use.search_many_tracks(query, render_playlist);
				$(document.body).removeClass('vk-needs-login');
				$('#tracks-search').removeClass('want-to-select-mp3-search');
				
			};
		})(query, render_playlist);
	} else{
		seesu.delayed_search.use.search_many_tracks(query, render_playlist);
	}
	
	
};
var getTopTracks = function(artist,callback) {
	lfm('artist.getTopTracks',{'artist': artist },function(r){
		if (typeof r != 'object') {return;}
		var tracks = r.toptracks.track || false;
		if (tracks) {
			var track_list = [];
			if (tracks.length){
				for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
					track_list.push({'artist' : artist ,'track': tracks[i].name});
				}
			} else{
				track_list.push({'artist' : artist ,'track': tracks.name});
			}
			
			if (callback) {callback(track_list);}
		}
	});
};

var proxy_render_artists_tracks = function(artist_list){
	var track_list_without_tracks = [];
	for (var i=0; i < artist_list.length; i++) {
		track_list_without_tracks.push({"artist" :artist_list[i]});
	};
	render_playlist(track_list_without_tracks);
};
var render_loved = function(user_name){
	lfm('user.getLovedTracks',{user: (user_name || lfm_auth.user_name), limit: 30},function(r){
		
		var tracks = r.lovedtracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 30) ? tracks.length : 30; i < l; i++) {
				track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
			}
			render_playlist(track_list);
		}
	});
	$(nav_artist_page).text('Loved Tracks');
	slider.className = 'show-player-page';
};
var render_recommendations_by_username = function(username){
	$.ajax({
		url: 'http://ws.audioscrobbler.com/1.0/user/' + username + '/systemrecs.rss',
		  global: false,
		  type: "GET",
		  dataType: "xml",
		  error: function(xml){
		  },
		  success: function(xml){
			var artists = $(xml).find('channel item title');
			if (artists && artists.length) {
				var artist_list = [];
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					var artist = $(artists[i]).text();
					artist_list.push(artist);
				}
				proxy_render_artists_tracks(artist_list);
			}
		  }
	});
	$(nav_artist_page).text('Recommendations for ' +  username);
	slider.className = 'show-player-page';
};
var render_recommendations = function(){
	lfm('user.getRecommendedArtists',{sk: lfm_auth.sk},function(r){
		var artists = r.recommendations.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			proxy_render_artists_tracks(artist_list);
		}
	});
	$(nav_artist_page).text('Recommendations for you');
	slider.className = 'show-player-page';
};


var get_artists_by_tag = function(tag,callback){
	lfm('tag.getTopArtists',{'tag':tag},function(r){
		var artists = r.topartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	});
	return true;
};
var render_tracks_by_artists_of_tag = function(tag){
	get_artists_by_tag(tag, proxy_render_artists_tracks);
	$(nav_artist_page).html('Tag: ' + tag);
	slider.className = 'show-full-nav show-player-page';
};


var get_similar_artists = function(original_artist, callback){
	lfm('artist.getSimilar',{'artist': original_artist},function(r){
		var artists = r.similarartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name);
			}
			if (callback) {callback(artist_list);}
		}
	});
	return true;
};

var render_tracks_by_similar_artists = function(original_artist){
	get_similar_artists(original_artist, proxy_render_artists_tracks);
	$(nav_artist_page).html('Similar to &laquo;' + original_artist + '&raquo; artists');
	slider.className = 'show-full-nav show-player-page';
};






var make_lastfm_playlist = function(r){
	var playlist = r.playlist.trackList.track;
	if  (playlist){
		var music_list = [];
		if (playlist.length){
			
			for (var i=0; i < playlist.length; i++) {
				music_list.push({track: playlist[i].title, artist: playlist[i].creator });
			}
		} else if (playlist.title){
			music_list.push({track: playlist.title, artist: playlist.creator });
		}
		if (music_list){
			render_playlist(music_list);
		} else {
			render_playlist();
		}
	} else{
		render_playlist();
	}
};
var get_artist_album_playlist = function(r){
	var album_id = r.album.id;
	if (album_id) {
		lfm('playlist.fetch',{'playlistURL': 'lastfm://playlist/album/' + album_id}, make_lastfm_playlist);
	}
};

var get_artist_album_info = function(artist, album, callback){
	$(nav_artist_page).text('(' + artist + ') ' + album );
	lfm('album.getInfo',{'artist': artist, album : album},function(r){
		if (callback) {callback(r);}
	});
	
};
seesu.toogle_art_alb_container = function(link){
	if (seesu.artist_albums_container.is('.collapse-albums')){
		seesu.artist_albums_container.removeClass('collapse-albums');
		link.text('hide them');
	} else{
		seesu.artist_albums_container.addClass('collapse-albums');
		link.text('show them');
	}
};
var artist_albums_renderer = function(r, container){
	var albums = r.topalbums.album;
	var albums_ul = $('<ul></ul>');
	if (albums){
		
		var create_album = function(al_name, al_url, al_image, al_artist){
			var li = $('<li></li>').appendTo(albums_ul);
			var a_href= $('<a></a>')
				.attr('href', al_url )
				.data('artist', al_artist)
				.data('album', al_name)
				.click(function(){
					seesu.toogle_art_alb_container(seesu.artist_albums_container.data('albums_link'));
					
					get_artist_album_info(al_artist, al_name, get_artist_album_playlist );
					return false;
				})
				.appendTo(li);
			$('<img/>').attr('src', al_image).appendTo(a_href);
			$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
		};
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				create_album(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name);
				
			}
		} else if (albums.name){
			create_album(albums.name, albums.url, (albums.image && albums.image[1]['#text']) || '', albums.artist.name );
		}
		
	} else {
		albums_ul.append('<li>No albums information</li>');
	}
	container.append(albums_ul);
};
var show_artist_info = function(r){
	artsBio.parent().addClass('background-changes');
	var info	 = r.artist || false;
	var similars, artist, tags, bio, image;
	if (info) {
		similars = info.similar && info.similar.artist;
		artist	 = info.name;
		tags	 = info.tags && info.tags.tag;
		bio		 = info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
		image	 = (info.image && info.image[1]['#text']) || lfm_image_artist;
	} 
		
	if (artist) {artsImage.attr({'src': image ,'alt': artist});}
	artsBio.html(bio || '');
	if (tags && tags.length) {
		var tags_p = $("<p></p>").text('Tags: ').attr({ 'class': 'artist-tags'});
		for (var i=0, l = tags.length; i < l; i++) {
			var tag = tags[i],
				arts_tag_node = $("<a></a>")
					.text(tag.name)
					.attr({ 
						href: tag.url,
						'class': 'music-tag js-serv'
					})
					.data('music_tag', tag.name);
			tags_p.append(arts_tag_node);
		}
		artsBio.append(tags_p);
	}
	if (similars && similars.length) {
		var similars_p = $("<p></p>").attr({ 'class': 'artist-similar'}),
			similars_a = $('<a></a>').text('Similar artists').attr({ 'class': 'similar-artists js-serv'}).data('artist', artist);
		similars_p.append(similars_a);	
		similars_p.append(document.createTextNode(": "));
		for (var i=0, l = similars.length; i < l; i++) {
			var similar = similars[i],
				arts_similar_node = $("<a class='js-serv'></a>")
				  .text(similar.name)
				  .attr({ 
					href: similar.url, 
					'class' : 'artist js-serv' 
				  })
				  .data('artist', similar.name );
			similars_p.append(arts_similar_node);
		}
		artsBio.append(similars_p);
	}
	var artist_albums_container = seesu.artist_albums_container = $('<div class="artist-albums"></div>').text('Albums: ').appendTo(artsBio);
	if (artist_albums_container){
		
		var albums_link = $('<a class="js-serv get-artist-albums">get albums</a>')
			.click(function(){
				var _this = $(this);
				if (!_this.data('albums-loaded')){
					artist_albums_container.addClass('albums-loading');
					
					lfm('artist.getTopAlbums',{'artist': artist },function(r){
						if (typeof r != 'object') {return;}
						artist_albums_renderer(r, artist_albums_container);
						_this.data('albums-loaded', true);
						artist_albums_container.removeClass('albums-loading');
					});
					_this.text('hide them');
					
				} else{
					seesu.toogle_art_alb_container(_this);
				}
			})
			.appendTo(artist_albums_container);
		artist_albums_container.data('albums_link', albums_link);
	}
	artsBio.parent().removeClass('background-changes');
};
var update_artist_info = function(artist, not_show_link_to_artist_page){
	if (testing ) {return;}
	if (seesu.player.current_artist == artist) {
		
	} else {
		artsName.text(seesu.player.current_artist = artist);
		if (!not_show_link_to_artist_page){
			artsName.append($('<a class="artist js-serv">top tracks</a>').data('artist', artist));
		}
		lfm('artist.getInfo',{'artist': artist }, show_artist_info);
	}
};
var set_artist_page = function (artist,with_search_results) {
	if (with_search_results) {
		slider.className = 'show-full-nav show-player-page';
	} else {
		slider.className = 'show-player-page';
	}
	$(nav_artist_page).text(artist);
	getTopTracks(artist,function(track_list){
		render_playlist(track_list);
	});
	update_artist_info(artist, true);
	
	
};
