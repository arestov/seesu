testing = true;

var	seesu =  {
	  version: 0.25	
	},
	vk_logged_in,
	wait_for_vklogin = function(){},
	vkReferer = '',
	lfm_auth = {};
lfm_auth.sk = widget.preferenceForKey('lfmsk') || false;
lfm_auth.user_name = widget.preferenceForKey('lfm_user_name') || false;
lfm_auth.login = function(r){
	lfm_auth.sk = r.session.key;
	lfm_auth.user_name = r.session.name;
	widget.setPreferenceForKey(lfm_auth.user_name, 'lfm_user_name');
	widget.setPreferenceForKey(lfm_auth.sk, 'lfmsk');
	$(document.body).addClass('lfm-auth-done');
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
		}
	}
	log(cver);
	vkReferer = r.vk_referer;
	log(vkReferer);
}
if (!testing) $.ajax({
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




var parseStrToObj = function(onclickstring){
	var b = onclickstring,
		fname = '';
	b = b.substring(b.indexOf('(') + 1, b.indexOf(')'));
	var params 		= b.split(','),
		server 		= params[1],
		user 		= params[2],
		duration 	= params[4];
	while (user.length < 5) {user = '0' + user;}
	fname = params[3];
	fname = fname.substring(1, fname.length - 1);
	var obj ={'sever': server, 'user' : user , 'filename' : fname, 'link' : ('http://cs' + server + '.vkontakte.ru/u' + user + '/audio/' + fname + '.mp3'), 'duration' : duration};
	return obj;

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


var make_tracklist_playable = function(track_nodes){
	if (vk_logged_in) {
		var songNodes = [];
		for (var i=0, l =  track_nodes.length; i < l; i++) {
			var node = track_nodes[i],
				playlist_nodes_for = songNodes;
				
			// 2 threahs search: 1 hardcode and 3 api requests per second
			delay_vk_track_search(node,playlist_nodes_for, (i==0),get_vk_api_track, 400);
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
	var playable_node = $(node).attr({'class' : 'song', 'href' : http_link} ).data('duration', mp3_duration);
	playlist_nodes_for.push(playable_node);
	var mp3 = $("<a></a>").attr({ 'class': 'download-mp3', 'text': 'mp3', 'href': http_link });
	playable_node.parent().append(mp3);
	
	
	var playlist_length = playlist_nodes_for.length;
	if ((playlist_length == 1) || (playable_node.data('want_to_play') == seesu.player.want_to_play) ) {
		seesu.player.set_current_song(playable_node);
		seesu.player.current_playlist = playlist_nodes_for;
	}
	playable_node.data('number_in_playlist', playlist_length-1);
	playable_node.data('link_to_playlist', playlist_nodes_for);
};



var render_playlist = function(vk_music_list,container) { // if links present than do full rendering! yearh!
	var linkNodes = [];
	var songNodes = [];

	var mp3links = vk_music_list[0].link ? true : false;

	var ul = document.createElement("ul");
	
	var de_html_entity = document.createElement('div');
	
	for (var i=0, l = vk_music_list.length; i < l; i++) {
		var attr = {'class' : 'waiting-full-render', 'text' :  vk_music_list[i].artist + ' - ' + vk_music_list[i].track};
		var track = $("<a></a>").attr(attr).data('play_order', i),
			li = document.createElement('li');
		track.data('artist_name', vk_music_list[i].artist).data('track_title', vk_music_list[i].track );
		$(li).append(track).append(play_controls.clone());
		

		if (mp3links) {
			make_node_playable(track, vk_music_list[i].link ,songNodes, vk_music_list[i].duration);
		} else {
			linkNodes.push(track);
		}
		$(ul).append(li);		
	}
	if (container) {
		container.html('').append(ul);
	} else{
		$(searchres).html('').append(ul);
		
		if (mp3links) {
			(slider.className = 'screen-search')
		}
	}
	if (!mp3links){
		make_tracklist_playable(linkNodes);	//get mp3 for each prepaired node (do many many delayed requests to vkontakte)
	}
	return true
};
var vk_track_search = function(query){
	art_page_nav.innerHTML = query;

	slider.className = 'sreen-artist-page';
	seesu.player.player_holder  = artsplhld;
		
	getMusic(query);
	
}
var render_loved = function(user_name){
	lfm('user.getLovedTracks',{user: (user_name || lfm_auth.user_name), limit: 15},function(r){
		
		var tracks = r.lovedtracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
				track_list.push({'artist' : tracks[i].artist.name ,'track': tracks[i].name});
			}
			render_playlist(track_list,artsTracks);
		}
	});
	$(nav_artist_page).text('Loved Tracks');
	slider.className = 'sreen-artist-page';
	seesu.player.player_holder = artsplhld;
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
				for (var i=0, l = (artists.length < 15) ? artists.length : 15; i < l; i++) {
					var artist = $(artists[i]).text();
					artist_list.push(artist);
				};
				proxy_render_artists_tracks(artist_list);
			}
		  }
	})
	slider.className = 'sreen-artist-page';
	seesu.player.player_holder = artsplhld;
}
var render_recommendations = function(){
	lfm('user.getRecommendedArtists',{sk: lfm_auth.sk},function(r){
		var artists = r.recommendations.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 15) ? artists.length : 15; i < l; i++) {
				artist_list.push(artists[i].name)
			};
			proxy_render_artists_tracks(artist_list);
		}
	})
	$(nav_artist_page).text('Recommendations');
	slider.className = 'sreen-artist-page';
	seesu.player.player_holder = artsplhld;
}
var render_tracks_by_artists_of_tag = function(tag){
	get_artists_by_tag(tag,proxy_render_artists_tracks);
	$(nav_artist_page).text('Tag: ' + tag);
	slider.className = 'sreen-artist-page';
	seesu.player.player_holder = artsplhld;
}

var get_artists_by_tag = function(tag,callback){
	lfm('tag.getTopArtists',{'tag':tag},function(r){
		var artists = r.topartists.artist;
		if (artists && artists.length) {
			var artist_list = [];
			for (var i=0, l = (artists.length < 15) ? artists.length : 15; i < l; i++) {
				artist_list.push(artists[i].name)
			};
			if (callback) {callback(artist_list);}
		}
	})
	return true
}
var proxy_render_artists_tracks = function(artist_list){
	get_tracks_by_artists(artist_list,function(artists_track_list){
		render_playlist(artists_track_list,artsTracks);
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
			for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
				track_list.push({'artist' : artist ,'track': tracks[i].name});
			}
			if (callback) {callback(track_list,callback_params_obj);}
		}	
	});
};
var show_artist_info = function(r){
	artsBio.parent().addClass('background-changes');
	var info	 = r.artist,
		similars = info.similar.artist,
		artist	 = info.name,
		tags	 = info.tags.tag,
		bio		 = info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm"),
		image	 = info.image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
	artsImage.attr({'src': image ,'alt': artist});
	artsBio.html(bio || '');
	if (tags && tags.length) {
		var tags_p = $("<p></p>").attr({ 'class': 'artist-tags', 'text' : 'Tags: '});
		for (var i=0, l = tags.length; i < l; i++) {
			var tag = tags[i],
				arts_tag_node = $("<a></a>")
				  .attr({ 
					text: tag.name, 
					href: tag.url,
					'class': 'music-tag'
				  })
				  .data('music_tag', tag.name);
			tags_p.append(arts_tag_node);
		};
		artsBio.append(tags_p);
	}
	if (similars && similars.length) {
		var similars_p = $("<p></p>").attr({ 'class': 'artist-similar'}),
			artist_list = [],
			similars_a = $('<a></a>').attr({'text' : 'Similar artists', 'class': 'artist-list'}).data('artist_list',artist_list);;
		similars_p.append(similars_a);	
		similars_p.append(document.createTextNode(": "));
		for (var i=0, l = similars.length; i < l; i++) {
			var similar = similars[i],
				arts_similar_node = $("<a></a>")
				  .attr({ 
					text: similar.name, 
					href: similar.url, 
					'class' : 'artist' 
				  })
				  .data('artist', similar.name );
			artist_list.push(similar.name);
			similars_p.append(arts_similar_node);
		};
		artsBio.append(similars_p);
	}
	artsBio.parent().removeClass('background-changes');
}
var update_artist_info = function(artist,nav){
	if (testing ) {return;}
	if (seesu.player.current_artist == artist) {
		
	} else {
		artsName.text(seesu.player.current_artist = artist);
		artsBio.html('');
		lfm('artist.getInfo',{'artist': artist }, show_artist_info);
	}
}
var set_artist_page = function (artist,with_search_results) {
	if (with_search_results) {
		slider.className = 'sreen-artist-page-with-results';
	} else {
		slider.className = 'sreen-artist-page'
	}
	$(art_page_nav).text(artist);
	seesu.player.player_holder = artsplhld;
	getTopTracks(artist,function(track_list){
		render_playlist(track_list,artsTracks);
	});
	update_artist_info(artist);
	
	
};
var show_artists_results = function(r){
	var artists = r.results.artistmatches.artist || false; 
	if (artists){
		if (artists.length){
			searchres.innerHTML = '';
			var ul = $("<ul></ul>").attr({ 'class': 'results-artists'});
			$(searchres).append(ul);
			for (var i=0; i < artists.length; i++) {
				var artist = artists[i].name,
					image = artists[i].image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';

				if (i === 0) {set_artist_page(artist,true);}

				var li = $("<li></li>").data('artist',artist);
					li.data('img', image);
				$(li).click(function(){
					var artist = $(this).data('artist');
					var image = $(this).data('img');
					set_artist_page(artist,true);
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
			var artist = artists.name;
			set_artist_page(artist);
		}

	} else {
		searchres.innerHTML = '';
		var p = $("<p></p>").attr({ text: 'Nothing found'});
		$(searchres).append(p);
		slider.className = "screen-search";
	}
}
var artistsearch = function(artist_query) {
	lfm('artist.search',{artist: artist_query, limit: 10 },show_artists_results)
	
};

