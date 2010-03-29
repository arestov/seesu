testing = false;

var	seesu =  {
	  version: 1.2,
	  ui: {},
	  xhrs: {},
	  search_one_track: get_audme_track,
	  search_many_tracks: get_all_audme_tracks
	}, 
	vk_logged_in,
	wait_for_vklogin = function(){},
	vkReferer = '',
	lfm_auth = {};
lfm_auth.sk = widget.preferenceForKey('lfmsk') || false;
lfm_auth.user_name = widget.preferenceForKey('lfm_user_name') || false;
lfm_auth.ui_logged = function(){
	$(document.body).addClass('lfm-auth-done');
	$('.lfm-finish input[type=checkbox]').attr('checked', 'checked');
	$('#scrobbling-switches').find('input').attr('disabled', '');
}
lfm_auth.login = function(r){
	lfm_auth.sk = r.session.key;
	lfm_auth.user_name = r.session.name;
	widget.setPreferenceForKey(lfm_auth.user_name, 'lfm_user_name');
	widget.setPreferenceForKey(lfm_auth.sk, 'lfmsk');
	lfm_auth.ui_logged();
}
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
			$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"></a>')
		}
	}
	log(cver);
	vkReferer = r.vk_referer;
	log(vkReferer);
}
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
}








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


var make_tracklist_playable = function(track_nodes){
	if (vk_logged_in) {
		var songNodes = [];
		for (var i=0, l =  track_nodes.length; i < l; i++) {
			var node = track_nodes[i],
				playlist_nodes_for = songNodes;
				
			// 2 threahs search: 1 hardcode and 3 api requests per second
			delay_vk_track_search(node,playlist_nodes_for, (i==0),get_audme_track);
			/*
			if ( (i+1 == 1) || ((i % 4) == 0)) {
				//delay_vk_track_search(node,playlist_nodes_for, ,get_vk_track);
			} else {
				
			}*/
			
		}
	} else {
		wait_for_vklogin = function(){
			make_tracklist_playable(track_nodes);
		};
	}
};
var make_node_playable = function(node, http_link, playlist_nodes_for, mp3_duration){
	var playable_node = $(node).attr({'class' : 'song js-serv', 'href' : http_link} ).data('duration', mp3_duration);
	playlist_nodes_for.push(playable_node);
	var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href': http_link });
	playable_node.parent().append(mp3);
	
	
	var playlist_length = playlist_nodes_for.length;
	if ((playlist_length == 1) || (playable_node.data('want_to_play') == seesu.player.want_to_play) ) {
		(function(playable_node, playlist_nodes_for ){
			setTimeout(function(){
				seesu.player.set_current_song(playable_node);
				seesu.player.current_playlist = playlist_nodes_for;
			},100)
		})(playable_node,playlist_nodes_for )
		
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
		$(ul).append('<li>Nothing found</li>')
	} else {
		var linkNodes = [];
		var songNodes = [];

		var mp3links = vk_music_list[0].link ? true : false;
		
		
		for (var i=0, l = vk_music_list.length; i < l; i++) {
			var attr = {'class' : 'waiting-full-render' };
			var track = $("<a></a>")
				.text(vk_music_list[i].artist + ' - ' + vk_music_list[i].track)
				.attr(attr).data('play_order', i),
				li = document.createElement('li');
			track.data('artist_name', vk_music_list[i].artist).data('track_title', vk_music_list[i].track );
			$(li).append(track);
			
	
			if (mp3links) {
				make_node_playable(track, vk_music_list[i].link ,songNodes, vk_music_list[i].duration);
			} else {
				linkNodes.push(track);
			}
			$(li)
				.append(play_controls.clone(true))
				.append(track_zoom.clone())
				.append('<a class="track-zoomin js-serv">&rarr;</a>')
				.append('<a class="track-zoomout js-serv">&larr;</a>');
			$(ul).append(li);		
		}
	
		if (!mp3links){
			make_tracklist_playable(linkNodes);	//get mp3 for each prepaired node (do many many delayed requests to vkontakte)
		}
		return true
	}
};
var vk_track_search = function(query){
	art_page_nav.innerHTML = query;

	slider.className = 'show-full-nav show-player-page';
		
	seesu.search_many_tracks(query, render_playlist);
	
}
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
}
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
				};
				proxy_render_artists_tracks(artist_list);
			}
		  }
	})
	$(nav_artist_page).text('Recommendations for ' +  username);
	slider.className = 'show-player-page';
}
var render_recommendations = function(){
	lfm('user.getRecommendedArtists',{sk: lfm_auth.sk},function(r){
		var artists = r.recommendations.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name)
			};
			proxy_render_artists_tracks(artist_list);
		}
	})
	$(nav_artist_page).text('Recommendations for you');
	slider.className = 'show-player-page';
}
var render_tracks_by_artists_of_tag = function(tag){
	get_artists_by_tag(tag, proxy_render_artists_tracks);
	$(nav_artist_page).html('Tag: ' + tag);
	slider.className = 'show-full-nav show-player-page';
}

var get_artists_by_tag = function(tag,callback){
	lfm('tag.getTopArtists',{'tag':tag},function(r){
		var artists = r.topartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name)
			};
			if (callback) {callback(artist_list);}
		}
	})
	return true
}
var render_tracks_by_similar_artists = function(original_artist){
	get_similar_artists(original_artist, proxy_render_artists_tracks);
	$(nav_artist_page).html('Similar to &laquo;' + original_artist + '&raquo; artists');
	slider.className = 'show-full-nav show-player-page';
}
var get_similar_artists = function(original_artist, callback){
	lfm('artist.getSimilar',{'artist': original_artist},function(r){
		var artists = r.similarartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
				artist_list.push(artists[i].name)
			};
			if (callback) {callback(artist_list);}
		}
	})
	return true
}
var proxy_render_artists_tracks = function(artist_list){
	get_tracks_by_artists(artist_list,function(artists_track_list){
		render_playlist(artists_track_list);
	})
}

var get_tracks_by_artists = function(artists,callback){
	var artists_track_list = [];
	for (var i=0, l = artists.length; i < l; i++) {
		getTopTracks(artists[i], function(track_list, params_obj){
			var random_track_num = Math.floor(Math.random()*track_list.length);
			params_obj.artists_track_list.push(track_list[random_track_num]);
		
			if (params_obj.finish) {
				if (callback) {callback(params_obj.artists_track_list);}
			}
			
		}, {artists_track_list: artists_track_list, finish: (i+1 == l)} );
	};
	
}

var getTopTracks = function(artist,callback,callback_params_obj) {
	lfm('artist.getTopTracks',{'artist': artist },function(r){
		if (typeof r != 'object') {return}
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
			
			if (callback) {callback(track_list,callback_params_obj);}
		}
	});
};
var show_artist_info = function(r){
	artsBio.parent().addClass('background-changes');
	var info	 = r.artist || false,
		similars = info && info.similar && info.similar.artist,
		artist	 = info && info.name,
		tags	 = info && info.tags && info.tags.tag,
		bio		 = info && info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm"),
		image	 = (info && info.image && info.image[1]['#text']) || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
	if (artist) {artsImage.attr({'src': image ,'alt': artist})};
	artsBio.html(bio || '');
	if (tags && tags.length) {
		var tags_p = $("<p></p>").text('Tags: ').attr({ 'class': 'artist-tags'});
		for (var i=0, l = tags.length; i < l; i++) {
			var tag = tags[i],
				arts_tag_node = $("<a></a>")
				  .attr({ 
					text: tag.name, 
					href: tag.url,
					'class': 'music-tag js-serv'
				  })
				  .data('music_tag', tag.name);
			tags_p.append(arts_tag_node);
		};
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
				  .attr({ 
					text: similar.name, 
					href: similar.url, 
					'class' : 'artist js-serv' 
				  })
				  .data('artist', similar.name );
			similars_p.append(arts_similar_node);
		};
		artsBio.append(similars_p);
	}
	artsBio.parent().removeClass('background-changes');
}
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
}
var set_artist_page = function (artist,with_search_results) {
	if (with_search_results) {
		slider.className = 'show-full-nav show-player-page';
	} else {
		slider.className = 'show-player-page'
	}
	$(art_page_nav).text(artist);
	getTopTracks(artist,function(track_list){
		render_playlist(track_list);
	});
	update_artist_info(artist, true);
	
	
};
