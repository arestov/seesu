var	seesu =  {
	  version: 0.25	
	},
	vk_logged_in,
	wait_for_vklogin = {},
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


var getMusic = function(trackname){
	if (!vk_logged_in) {
		return false;
	} else {
		var musicList = [];
			musicList.links = [];
			musicList.playlist = [];
			musicList.duration_list = [];
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
					musicList.duration_list.push(obj.duration);
					musicList.links.push(obj.link);
					musicList.playlist.push({'artist_name' : artist ,'track_title': track});
					obj.artist = artist;
					obj.track = track;

					musicList.push(obj);
				}
				render_playlist(musicList.playlist,artsTracks,musicList.links,musicList.duration_list);
			} else {
				log('Поиск не удался... :’—(');
				log(xhr.responseText);
				if ((xhr.responseText.indexOf('http://vkontakte.ru/login.php?op=logout') != -1) && xhr.responseText.indexOf('http://vkontakte.ru/images/progress.gif' != -1)) {
					vk_logged_out();
					log('квантакте изгнал вас из рая');
					wait_for_vklogin = function(){
						render_playlist(musicList.playlist,artsTracks,musicList.links,musicList.duration_list);
					}
				}
			}
		  }
		};
		xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
		var param = 'c[section]=audio' + '&c[q]=' + encodeURIComponent(trackname);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(param);

	}
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
var get_vk_track = function(tracknode,playlist_nodes_for,reset_queue) {
	if (!vk_logged_in) {
		return false;
	} else {
		var now = (new Date()).getTime(),
			timeout;
		var this_func = arguments.callee;
		
		if (reset_queue) {
			if (this_func.queue && this_func.queue.length) {
				
				//if we are loading new playlist than we don't need old queue
				for (var i = this_func.queue.length -1; i >= 0; i--) { //removing queue in reverse order
					if (!this_func.queue[i].done) {
						clearTimeout(this_func.queue[i].queue_item);
						this_func.call_at -= this_func.queue[i].timeout;
						art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
					}
				}
			}
			this_func.queue = [];
		}
		this_func.queue = this_func.queue || [];
		
		
		art_tracks_w_counter.text(this_func.tracks_waiting_for_search = (this_func.tracks_waiting_for_search + 1) || 1);
		
		this_func.call_at = this_func.call_at || now;
		if ( this_func.call_at && (this_func.call_at > now)) {
			timeout = this_func.call_at - now;
		} else {
			timeout = 0;
			this_func.call_at = now;
		}
		
		var queue_element = {'timeout': timeout };
		var delayed_ajax = function(queue_element,timeout) {
			 queue_element.queue_item = setTimeout(function(){
				
				if (vk_logged_in) {
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
								ms_obj = parseStrToObj(playStr);
							make_node_playable(tracknode, ms_obj.link, playlist_nodes_for, ms_obj.duration);
							resort_playlist(playlist_nodes_for);
						
						} else {
							tracknode.attr('class' , 'search-mp3-failed');
						}
						art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
					  }
					});
				} else {
					art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
				}
				queue_element.done = true;
			},timeout);
			
		}
		delayed_ajax(queue_element,timeout);
		this_func.queue.push(queue_element);
		this_func.call_at += ((this_func.tracks_waiting_for_search % 8) == 0) ? 5000 : 900;
	}
	
	
	return false;
};

var make_tracklist_playable = function(track_nodes){
	if (vk_logged_in) {
		var songNodes = [];
		for (var i=0, l =  track_nodes.length; i < l; i++) {
			var node = track_nodes[i],
				playlist_nodes_for = songNodes;
			get_vk_track(node,playlist_nodes_for, (i==0));
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

	var playlist_length = playlist_nodes_for.length;
	if ((playlist_length == 1) || (playable_node.data('want_to_play') == seesu.player.want_to_play) ) {
		seesu.player.set_current_song(playable_node);
		seesu.player.current_playlist = playlist_nodes_for;
	}
	
	playable_node.data('number_in_playlist', playlist_length-1);
	playable_node.data('link_to_playlist', playlist_nodes_for);
	

	var mp3 = $("<a></a>").attr({ 'class': 'download-mp3', 'text': 'mp3', 'href': http_link });
	playable_node.parent().append(mp3);
};

var render_playlist = function(playlist,container,mp3links,duration_list) { // if links present than do full rendering! yearh!
	var linkNodes = [];
	var songNodes = [];

	var ul = document.createElement("ul");
	
	for (var i=0, l = playlist.length; i < l; i++) {
		var attr = {'class' : 'waiting-full-render', 'text' :  playlist[i].artist_name + ' - ' + playlist[i].track_title};
		var track = $("<a></a>").attr(attr).data('play_order', i),
			li = document.createElement('li');
		track.data('artist_name',playlist[i].artist_name ).data('track_title', playlist[i].track_title );
		$(li).append(track);
		

		if (mp3links) {
			make_node_playable(track,mp3links[i],songNodes,duration_list[i]);
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
				track_list.push({'artist_name' : tracks[i].artist.name ,'track_title': tracks[i].name});
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
				log(JSON.stringify(params_obj.artists_track_list));
				if (callback) {callback(params_obj.artists_track_list);}
			}
			
		}, {artists_track_list: artists_track_list, finish: (i+1 == l)} );
	};
	
}

var getTopTracks = function(artist,callback,callback_params_obj) {
	lfm('artist.getTopTracks',{'artist': artist },function(r){
		var tracks = r.toptracks.track || false;
		if (tracks) {
			var track_list = [];
			for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
				track_list.push({'artist_name' : artist ,'track_title': tracks[i].name});
			}
			if (callback) {callback(track_list,callback_params_obj);}
		}	
	});
};
var show_artist_info = function(r){
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
}
var update_artist_info = function(artist,nav){
	if (seesu.player.current_artist == artist) {
		return true;
	} else {
		artsName.text(seesu.player.current_artist = artist);
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

