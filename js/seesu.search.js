function arrows_keys_nav(e){
	var _key = e.keyCode;
	if (_key == '13'){
		e.preventDefault();
		var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
		if (current_node) {current_node.click()}
	} else 
	if((_key == '40') || (_key == '63233')){
		e.preventDefault();
		var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
		if (current_node){
			var _elements = seesu.ui.views.current_rc.data('search_elements');
			var el_index = current_node.data('search_element_index');
			var els_length = _elements.length;
			current_node.removeClass('active')
			
			if (el_index < (els_length -1)){
				var new_current = el_index+1;
				set_node_for_enter_press($(_elements[new_current]), true)
				
			} else {
				var new_current = 0;
				set_node_for_enter_press($(_elements[new_current]), true)
			}
		}
	} else 
	if((_key == '38') || (_key == '63232')){
		e.preventDefault();
		var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
		if (current_node){
			var _elements = seesu.ui.views.current_rc.data('search_elements');
			var el_index = current_node.data('search_element_index');
			var els_length = _elements.length;
			current_node.removeClass('active')
			
			if (el_index > 0){
				var new_current = el_index-1;
				set_node_for_enter_press($(_elements[new_current]), true)
				
			} else {
				var new_current = els_length-1;
				set_node_for_enter_press($(_elements[new_current]), true)
			}
		}
	}
};

var results_mouse_click_for_enter_press = function(e){
	var node_name = e.target.nodeName;
	if ((node_name != 'A') && (node_name != 'BUTTON')){return false;}
	var active_node = seesu.ui.views.current_rc.data('node_for_enter_press');
	if (active_node) {active_node.removeClass('active');}
	
	set_node_for_enter_press($(e.target));
};
var set_node_for_enter_press = function(node, scroll_to_node, not_by_user){
	if (!node){return false;}
	if (not_by_user){
		seesu.ui.els.search_form.data('current_node_index', false);
	} else{
		seesu.ui.els.search_form.data('current_node_index', node.data('search_element_index'));
	}
	seesu.ui.views.current_rc.data('node_for_enter_press', node.addClass('active'));
	if (scroll_to_node){
		var scroll_up = seesu.ui.els.scrolling_viewport.scrollTop();
		var scrolling_viewport_height = seesu.ui.els.scrolling_viewport.height();
		
		var container_postion = scroll_up + seesu.ui.els.searchres.position().top;
		
		var node_position = node.parent().position().top + container_postion;
		
		
		var view_pos_down = node.parent().height() + node_position;
		var view_pos_up = node_position;

		var scroll_down = scroll_up + scrolling_viewport_height;

		if ( view_pos_down > scroll_down){
			
			var new_position =  view_pos_down - scrolling_viewport_height/2;
			seesu.ui.els.scrolling_viewport.scrollTop(new_position);
		} else if (view_pos_down < scroll_up){
			var new_position =  view_pos_down - scrolling_viewport_height/2;
			seesu.ui.els.scrolling_viewport.scrollTop(new_position);
		}
	}
}
var create_artist_suggest_item = function(artist, image){
	var a = $("<a></a>")
		.data('artist', artist)
		.click(function(e){
			var artist = $(this).data('artist');
			seesu.ui.show_artist(artist,true);
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "artist: " + artist );
		})
		.click(results_mouse_click_for_enter_press);
	
	$("<img/>").attr({ src: (image || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png'), alt: artist }).appendTo(a);
	$("<span></span>").text(artist).appendTo(a);
	return a
}
var create_track_suggest_item = function(artist, track, image, duration){
	var a = $("<a></a>")
		.data('track_title',track)
		.data('artist',artist)
		.click(function(e){
			su.ui.show_track({
				artist: artist,
				track: track
			}, true);
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "track: " + artist + ' - ' + track );
		})
		.click(results_mouse_click_for_enter_press);
	
	$("<img/>").attr({ src: (image || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png') , alt: artist }).appendTo(a);
	if (duration){
		var track_dur = parseInt(duration);
		var digits = track_dur % 60
		track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits )
		a.append('<span class="sugg-track-dur">' + track_dur + '</span>');
	}
	$("<span></span>").text(artist + ' - ' + track).appendTo(a);
	return a
}
var create_tag_suggest_item = function(tag){
	return $("<a></a>")
		.data('tag',tag)
		.click(function(e){
			var tag = $(this).data('tag');
			show_tag(tag, true)
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "tag: " + tag );
		})
		.click(results_mouse_click_for_enter_press)
		.append("<span>" + tag + "</span>");
}
var show_artists_results = function(r, start, end){
	if (!r) {return}
	
	var ul = seesu.ui.arts_results_ul;
	
	var source_query = r.results['@attr']['for'];
	if (seesu.ui.els.search_input.val() != source_query ){
		return
	}
	
	var artists = r.results.artistmatches.artist || false; 
	if (artists && (start ? (artists.length && (artists.length > start)) : true)){

		
		
		
	
		if (artists.length){
			
			for (var i = start || 0, l = (end ? ((artists.length < end) ? artists.length : end) : artists.length); i < l; i++) {
				
				var li = $("<li></li>");
				
				var artist = artists[i].name,
					image = artists[i].image && artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/');
				
				
				if( i == (start ? start : 0) && !end){
					li.addClass('searched-bordered');
				}
				
				li.append(create_artist_suggest_item(artist, image));
				if (end && seesu.ui.buttons_li.inject_before_buttons){
					seesu.ui.buttons_li.search_artists.before(li);
				} else{
					li.appendTo(ul);
				}
			} 
		} else if (artists.name) {
			var li = $("<li></li>");
			
			var artist = artists.name,
				image = artists.image && artists.image[1]['#text'].replace('/serve/64/','/serve/64s/');
			li.append(create_artist_suggest_item(artist, image))
			if(!end){
				li.addClass('searched-bordered');
			}
			if (end && seesu.ui.buttons_li.inject_before_buttons){
				seesu.ui.buttons_li.search_artists.before(li);
			} else{
				li.appendTo(ul);
			}
			
		}
		
		
		seesu.ui.make_search_elements_index(true, start && true);
	} else {
		if (seesu.ui.buttons_li.inject_before_buttons){
			seesu.ui.buttons_li.search_artists.remove();
		}
		$("<li><a class='nothing-found'>" + localize('nothing-found','Nothing found') + "</a></li>").appendTo(ul);

	}
};
var artist_search = su.fs.artist_search = function(artist_query, start) {
	seesu.ui.results_label_arts.addClass('loading');
	lfm('artist.search',{artist: artist_query, limit: 15 },function(r){
		seesu.ui.results_label_arts.removeClass('loading');
		show_artists_results(r, start);
	}, function(){
		seesu.ui.results_label_arts.removeClass('loading');
	})
	
};
var tag_search  = su.fs.tag_search = function(tag_query, start){
	seesu.ui.results_label_tags.addClass('loading');
	lfm('tag.search',{tag: tag_query, limit: 15 },function(r){
		seesu.ui.results_label_tags.removeClass('loading');
		show_tags_results(r, start);
	},function(){
		seesu.ui.results_label_tags.removeClass('loading');
	})
}
var track_search = su.fs.track_search = function(track_query, start){
	seesu.ui.results_label_tracks.addClass('loading');
	lfm('track.search',{track: track_query, limit: 15 },function(r){
		show_tracks_results(r, start)
		seesu.ui.results_label_tracks.removeClass('loading');
	},function(){
		seesu.ui.results_label_tracks.removeClass('loading');
	})
}

var rend_vk_suggets = function(pl, ui){
	if (pl && pl.length){
			var k = $();
		for (var i=0, l = (pl.length < 3 && pl.length) || 3; i < l; i++) {
			k = k.add(
				$('<span class="vk-track-suggest"></span>')
					.text(pl[i].artist + ' - ' + pl[i].track)
					.css({
						display:'block',
						'font-size': '10px',
						border:0
					})
			
			);
			
		};
		
		ui.vk_tracks.button.prepend(k);
	}

}

var vk_suggests = $.debounce(function(query, ui){
	
	//function(trackname, callback, nocache, hypnotoad, only_cache){
	su.mp3_search.find_files({q: query}, 'vk', function(err, pl, c){
		c.done = true;
		ui.vk_tracks.label.removeClass('loading');
		rend_vk_suggets(pl && pl[0], ui);
	}, false);
	
	
	
	
},300);
var show_tags_results = function(r, start, end){
	
	if (!r) {return}
	
	var source_query = r.results['@attr']['for'];
	if (seesu.ui.els.search_input.val() != source_query ){
		return
	}
	
	
	var tags = r.results.tagmatches.tag || false; 
	if (tags  && (start ? (tags.length && (tags.length > start)) : true)){


		var ul = seesu.ui.tags_results_ul;

		if (tags.length){
			
			for (var i = start || 0, l = (end ? ((tags.length < end) ? tags.length : end) : tags.length) ; i < l; i++) {
				var li = $("<li></li>");
				
				var tag = tags[i].name;
				if( i == (start ? start : 0) && !end){
					li.addClass('searched-bordered');
				}
				li.append(create_tag_suggest_item(tag));
				
				if (end && seesu.ui.buttons_li.inject_before_buttons){
					seesu.ui.buttons_li.search_tags.before(li);
				} else{
					li.appendTo(ul);
				}
			} 
		} else if (tags.name) {
			var li = $("<li></li>");
			
			var tag = tags.name
			if (!end){
				li.addClass('searched-bordered');
			}
			
			li.append(create_tag_suggest_item(tag));
			
			if (end && seesu.ui.buttons_li.inject_before_buttons){
				seesu.ui.buttons_li.search_tags.before(li);
			} else{
				li.appendTo(ul);
			}
		}
		

		seesu.ui.make_search_elements_index(true, start && true);
		
	} else {
		if(seesu.ui.buttons_li.inject_before_buttons){
			seesu.ui.buttons_li.search_tags.remove();
		}
		$("<li><a class='nothing-found'>" + localize('nothing-found','Nothing found') + "</a></li>").appendTo(seesu.ui.tags_results_ul);

	}
}
var show_tracks_results = function(r, start, end){
	if (!r) {return}
	
	
	var source_query = r.results['@attr']['for'];
	if (seesu.ui.els.search_input.val() != source_query ){
		return
	}
	
	
	var tracks = r.results.trackmatches.track || false; 
	if (tracks && (start ? (tracks.length && (tracks.length > start)) : true)){


		var ul = seesu.ui.tracks_results_ul;
		
		if (tracks.length){
			
			for (var i = start || 0, l = (end ? ((tracks.length < end) ? tracks.length : end) : tracks.length); i < l; i++) {
				var li = $("<li></li>")
				
				var track = tracks[i].name,
					image = tracks[i].image && tracks[i].image[1]['#text'].replace('/serve/64/','/serve/64s/') ,
					artist = tracks[i].artist;
	
				li.append(create_track_suggest_item(artist, track, image));
				
				if( i == (start ? start : 0) && !end){
					li.addClass('searched-bordered')
				}
				
				if (end && seesu.ui.buttons_li.inject_before_buttons){
					seesu.ui.buttons_li.search_tracks.before(li);
				} else{
					li.appendTo(ul);
				}
			} 
		} else if (tracks.name) {
			var li = $("<li></li>")
			
			var track = tracks.name,
				image = tracks.image && tracks.image[1]['#text'].replace('/serve/64/','/serve/64s/'),
				artist = tracks.artist;
				
				li.append(create_track_suggest_item(artist, track, image));
				if (!end){
					li.addClass('searched-bordered')
				}
				
			if (end && seesu.ui.buttons_li.inject_before_buttons){
				seesu.ui.buttons_li.search_tracks.before(li);
			} else{
				li.appendTo(ul);
			}
					
		}
		
	
		
		
		seesu.ui.make_search_elements_index(true, start && true)
	} else{
		if (seesu.ui.buttons_li.inject_before_buttons){
			seesu.ui.buttons_li.search_tracks.remove()
		}
		
		$("<li><a class='nothing-found'>" + localize('nothing-found','Nothing found') + "</a></li>").appendTo(seesu.ui.tracks_results_ul);
	}
}


var fast_suggestion = function(r, source_query, ui){
	if (!r) {return false;}
	
	var fast_enter = null;
	var clone = null;
	
	
	var sugg_arts = [];
	var sugg_tracks = [];
	var sugg_tags = [];
	var sugg_albums = [];
	
	for (var i=0, l = r.response.docs.length; i < l ; i++) {
		var response_modul = r.response.docs[i];
		if (response_modul.restype == 6){
			sugg_arts.push(response_modul);
		} else 
		if (response_modul.restype == 8){
			sugg_albums.push(response_modul);
		} else 
		if (response_modul.restype == 9){
			sugg_tracks.push(response_modul);
		} else
		if (response_modul.restype == 32){
			sugg_tags.push(response_modul);
		} 
	};
	
	
	
	var ul_arts = seesu.ui.arts_results_ul;
	
	if (sugg_arts && sugg_arts.length){
		for (var i=0, l = sugg_arts.length; i < l; i++) {
			var artist = sugg_arts[i].artist;
			var image =  sugg_arts[i].image ? ('http://userserve-ak.last.fm/serve/34s/' + sugg_arts[i].image) : false;
			var li = $("<li class='suggested'></li>");
			
			var a =  create_artist_suggest_item(artist, image)
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			
			seesu.ui.buttons_li.search_artists.before(li);
		};
		var li = $('<li></li>',seesu.ui.d); 
		li.append(ui.arts.button.find('span').text(localize('fine-more', 'find more') + ' «' + source_query + '» ' + localize('artists', 'artists')).end()).appendTo(ul_arts);
	} else{
		$('<li></li>',seesu.ui.d).append(ui.arts.button.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' + localize('in-artists','in artists')).end().addClass("search-button")).appendTo(ul_arts);
	}
	if (!fast_enter) {fast_enter = ui.arts.button;}
	
	var ul_tracks = seesu.ui.tracks_results_ul;
	if (sugg_tracks && sugg_tracks.length){
		
		
		for (var i=0, l = sugg_tracks.length; i < l; i++) {
			var track = sugg_tracks[i].track,
				artist = sugg_tracks[i].artist,
				image =  sugg_tracks[i].image ? 'http://userserve-ak.last.fm/serve/34s/' + sugg_tracks[i].image : false,
				duration = sugg_tracks[i].duration
			
			var li = $("<li class='suggested'></li>");
			
			var a = create_track_suggest_item(artist, track, image, duration)



			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			seesu.ui.buttons_li.search_tracks.before(li);
		};
		$('<li></li>',seesu.ui.d).append(ui.track.button.find('span').text(localize('fine-more', 'find more') + ' «' + source_query + '» '+ localize('tracks', 'tracks')).end()).appendTo(ul_tracks);
	} else{
		$('<li></li>',seesu.ui.d).append(ui.track.button.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tracks','in tracks')).end().addClass("search-button")).appendTo(ul_tracks);
	}
	if (!fast_enter) {fast_enter = ui.track.button;}
	

	
	var ul_tags = seesu.ui.tags_results_ul;
	if (sugg_tags && sugg_tags.length){
		for (var i=0, l = sugg_tags.length; i < l; i++) {
			
			var tag = sugg_tags[i].tag
			var li = $("<li class='suggested'></li>");
			
			var a = create_tag_suggest_item(tag)
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			seesu.ui.buttons_li.search_tags.before(li);
		};
		$('<li></li>',seesu.ui.d).append(ui.tag.button.find('span').text(localize('fine-more', 'find more') + ' «' + source_query + '» '+ localize('tags', 'tags')).end()).appendTo(ul_tags);
	} else{
		$('<li></li>',seesu.ui.d).append(ui.tag.button.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tags' , 'in tags')).end().addClass("search-button")).appendTo(ul_tags);
	}
	if (!fast_enter) {fast_enter = ui.tag.button;}
	
	seesu.ui.make_search_elements_index();
	
	var active_node = seesu.ui.views.current_rc.data('node_for_enter_press');
	if (active_node) {
		active_node.removeClass('active');
	}
	
	set_node_for_enter_press(fast_enter, false, true);
}
var get_fast_suggests = $.debounce(function(q, callback, hash){
	var xhr = $.ajax({
	  url: 'http://www.last.fm/search/autocomplete',
	  global: false,
	  type: "GET",
	  timeout: 15000,
	  dataType: "json",
	  data: {
	  	"q": q,
	  	"force" : 1
	  },
	  error: function(){
	  },
	  success: function(r){
		cache_ajax.set('lfm_fs', hash, r);
		if (callback){callback(r);}
	  }	,
	  complete: function(xhr){
	  	if (su.ui.els.search_input.val() != q){return}
	  	su.ui.els.search_label.removeClass('loading');
	  }
	});
	
	
	
},400);


var suggestions_search =  seesu.env.cross_domain_allowed ? function(q, ui){
		su.ui.els.search_label.addClass('loading');
		var hash = hex_md5(q);
		var cache_used = cache_ajax.get('lfm_fs', hash, function(r){
			if (su.ui.els.search_input.val() != q){return}
			su.ui.els.search_label.removeClass('loading');
			fast_suggestion(r, q, ui)
		});
		if (!cache_used) {
			seesu.xhrs.multiply_suggestions.push(get_fast_suggests(q, function(r){	
				if (su.ui.els.search_input.val() != q){return}
				fast_suggestion(r, q, ui)
			}, hash));
			
		}
	} :
	$.debounce(function(q, ui){
	//	arts_clone, track_clone ,tags_clone
		ui.arts.label.addClass('loading');
		ui.track.label.addClass('loading');
		ui.tag.label.addClass('loading');
		
		seesu.xhrs.multiply_suggestions.push(lfm('artist.search',{artist: q, limit: 15 },function(r){
			if (su.ui.els.search_input.val() != q){return}
			show_artists_results(r, false, 5);
			ui.arts.button.find('span').text(localize('fine-more', 'find more') + ' «' + q + '» '+ localize('artists', 'artists'));
			ui.arts.label.removeClass('loading');
		},function(){
			if (su.ui.els.search_input.val() != q){return}
			ui.arts.label.removeClass('loading');
		}));
		
		seesu.xhrs.multiply_suggestions.push(lfm('track.search',{track: q, limit: 15 },function(r){
			if (su.ui.els.search_input.val() != q){return}
			show_tracks_results(r, false, 5);
			ui.track.button.find('span').text(localize('fine-more', 'find more') + ' «' + q + '» ' + localize('tracks','tracks'));
			ui.track.label.removeClass('loading');
		},function(){
			if (su.ui.els.search_input.val() != q){return}
			ui.track.label.removeClass('loading');
		}));
		
		seesu.xhrs.multiply_suggestions.push(lfm('tag.search',{tag: q, limit: 15 },function(r){
			if (su.ui.els.search_input.val() != q){return}
			show_tags_results(r, false, 5);
			ui.tag.button.find('span').text(localize('fine-more', 'find more') + ' «' + q + '» ' + localize('tags','tags'));
			ui.tag.label.removeClass('loading');
		},function(){
			if (su.ui.els.search_input.val() != q){return}
			ui.tag.label.removeClass('loading');
		}));
		
		
	}, 400);
	
	/*
	arts: {
				button: arts_clone,
				label: seesu.ui.results_label_arts
			},
			track: {
				button: track_clone,
				label: seesu.ui.results_label_tracks
			},
			tag: {
				button: tags_clone,
				label: seesu.ui.results_label_tags
			}
			
			*/

var suggestions_prerender = function(input_value, crossdomain){
	var multy = !crossdomain;
	var source_query = input_value;

	var results_container = seesu.ui.views.get_search_rc().empty();
	
	var create_plr_entity = function(pl){
		pl.with_search_results_link = true;
		var li  = $('<li></li>');
		var _b = $('<a></a>')
			.text(pl.playlist_title)
			.click(function(){
				
				
				if (su.ui.views.playlist_title == pl.playlist_title && su.ui.views.playlist_type == pl.playlist_type) {
					seesu.ui.views.restore_view();
					
				}else{
					su.ui.views.show_playlist_page(pl);
				}
				
			}).appendTo(li)
		return li;
	}
	
	if (':playlists'.match(new RegExp('\^' + input_value , 'i'))){
		results_container.append('<h4>'+ localize('playlists') +'</h4>');
		var pl_r = $('<ul class="playlist-results"></ul>');
		
		var playlists = seesu.gena.playlists;
		if (!playlists.length){
			pl_r.append('<li><a class="nothing-found">none playlists found</a></li>').appendTo(results_container);
		} else{
			var pl_results = $();
			for (var i=0; i < playlists.length; i++) {
				pl_results = pl_results.add(create_plr_entity(playlists[i]));
			};
			pl_r.append(pl_results).appendTo(results_container);
		}
	} 
	
	if (!input_value.match(/^:/)){
		//playlist search
		var playlists = seesu.gena.playlists;
		var matches = [];
		for (var i=0; i < playlists.length; i++) {
			if (playlists[i].playlist_title == input_value){
				matches.unshift(i);
				matches.full_match = true;
			} else if (playlists[i].playlist_title.match(new  RegExp('\\b' + input_value))){
				 matches.push(i);
			}

		};
		if (matches.length){
			results_container.append('<h4>'+localize('playlists')+'</h4>');
			var pl_r = $('<ul class="playlist-results"></ul>');
			
			
			var pl_results = $();
					
			for (var i=0; i < matches.length; i++) {
				pl_results = pl_results.add(create_plr_entity(playlists[matches[i]]));
			};
			if (pl_results.length > 0){
				pl_r.append(pl_results).appendTo(results_container);
			}
		
		}
		
		//===playlists search



		seesu.ui.results_label_arts = $('<h4>'+ localize('Artists','Artists') +'</h4>').appendTo(results_container);
		var arts_clone = seesu.ui.buttons.search_artists.clone(true)
			.data('finishing_results', multy ? 5 : 0)
			.addClass("search-button")
			.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' + localize('in-artists','in artists')).end();
		var ul_arts = seesu.ui.arts_results_ul = $("<ul id='artist-results-ul'></ul>").attr({ 'class': 'results-artists'});
		seesu.ui.buttons_li.search_artists = $('<li></li>',seesu.ui.d).append(arts_clone).appendTo(ul_arts);
		results_container.append(ul_arts);
		
		
		seesu.ui.results_label_tracks = $('<h4>'+ localize('Tracks','Tracks') +'</h4>').appendTo(results_container);
		var track_clone = seesu.ui.buttons.search_tracks.clone(true)
			.data('finishing_results', multy ? 5 : 0)
			.addClass("search-button")
			.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tracks','in tracks')).end();
		var ul_tracks = seesu.ui.tracks_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists'});
		seesu.ui.buttons_li.search_tracks = $('<li></li>',seesu.ui.d).append(track_clone).appendTo(ul_tracks);
		results_container.append(ul_tracks);
		
	
		seesu.ui.results_label_tags = $('<h4>'+localize('Tags')+'</h4>').appendTo(results_container);
		var tags_clone = seesu.ui.buttons.search_tags.clone(true)
			.data('finishing_results', multy ? 5 : 0)
			.addClass("search-button")
			.find('span').text(localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tags', 'in tags')).end();
		var ul_tags = seesu.ui.tags_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists recommend-tags'});
		seesu.ui.buttons_li.search_tags = $('<li></li>',seesu.ui.d).append(tags_clone).appendTo(ul_tags);
		results_container.append(ul_tags);
		
		seesu.ui.results_label_vk = $('<h4>Vkontakte</h4>').appendTo(results_container);
		var vk_clone = seesu.ui.buttons.search_vkontakte.clone(true);
		$('<div></div>',seesu.ui.d).append(vk_clone).appendTo(results_container);
		
		seesu.ui.buttons_li.inject_before_buttons = true;
		seesu.ui.make_search_elements_index();
		set_node_for_enter_press(arts_clone, false, true);
		
		suggestions_search(source_query, {
			arts: {
				button: arts_clone,
				label: seesu.ui.results_label_arts
			},
			track: {
				button: track_clone,
				label: seesu.ui.results_label_tracks
			},
			tag: {
				button: tags_clone,
				label: seesu.ui.results_label_tags
			}
		});
		vk_suggests(source_query, {
			vk_tracks:{
				button: vk_clone,
				label: seesu.ui.results_label_vk
			}
		});
	}
};


var input_change = function(e){
	var input = (e && e.target) || e; //e can be EVENT or INPUT  
	var input_value = input.value;
	if ($(input).data('lastvalue') == input_value){
		return false
	} else{
		$(input).data('lastvalue', input_value);
	}
	if (!input_value) {
		seesu.ui.views.show_start_page();
		return;
	}
	
	
	if (seesu.xhrs.multiply_suggestions && seesu.xhrs.multiply_suggestions.length){
		for (var i=0; i < seesu.xhrs.multiply_suggestions.length; i++) {
			if (seesu.xhrs.multiply_suggestions[i] && seesu.xhrs.multiply_suggestions[i].abort) {seesu.xhrs.multiply_suggestions[i].abort();}
		};
		
	}
	seesu.xhrs.multiply_suggestions =[]
	seesu.ui.els.search_form.data('current_node_index' , false);
	
	suggestions_prerender(input_value, seesu.env.cross_domain_allowed);
	seesu.ui.views.show_search_results_page();
	
	
	
};
