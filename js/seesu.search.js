window.arrows_keys_nav = function(e){
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
}

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
			var query = $(this).data('artist') + ' - ' + $(this).data('track_title');
			su.ui.show_track(query, true);
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "track: " + query );
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
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(ul);

	}
}
var artist_search = su.fs.artist_search = function(artist_query, start) {
	lfm('artist.search',{artist: artist_query, limit: 15 },function(r){
		show_artists_results(r, start)
	})
	
};
var tag_search  = su.fs.tag_search = function(tag_query, start){
	lfm('tag.search',{tag: tag_query, limit: 15 },function(r){
		show_tags_results(r, start)
	})
}
var track_search = su.fs.track_search = function(track_query, start){
	lfm('track.search',{track: track_query, limit: 15 },function(r){
		show_tracks_results(r, start)
	})
}
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
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(seesu.ui.tags_results_ul);

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
		
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(seesu.ui.tracks_results_ul);
	}
}


var fast_suggestion = function(r, source_query, arts_clone, track_clone ,tags_clone){
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
		li.append(arts_clone.find('span').text('find more «' + source_query + '» artists').end()).appendTo(ul_arts);
	} else{
		$('<li></li>',seesu.ui.d).append(arts_clone.find('span').text('Search «' +source_query + '» in artists').end().addClass("search-button")).appendTo(ul_arts);
	}
	if (!fast_enter) {fast_enter = arts_clone;}
	
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
		$('<li></li>',seesu.ui.d).append(track_clone.find('span').text('find more «' + source_query + '» tracks').end()).appendTo(ul_tracks);
	} else{
		$('<li></li>',seesu.ui.d).append(track_clone.find('span').text('Search «' +source_query + '» in tracks').end().addClass("search-button")).appendTo(ul_tracks);
	}
	if (!fast_enter) {fast_enter = track_clone;}
	

	
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
		$('<li></li>',seesu.ui.d).append(tags_clone.find('span').text('find more «' + source_query + '» tags').end()).appendTo(ul_tags);
	} else{
		$('<li></li>',seesu.ui.d).append(tags_clone.find('span').text('Search «' +source_query + '» in tags').end().addClass("search-button")).appendTo(ul_tags);
	}
	if (!fast_enter) {fast_enter = tags_clone;}
	
	seesu.ui.make_search_elements_index();
	
	var active_node = seesu.ui.views.current_rc.data('node_for_enter_press');
	if (active_node) {
		active_node.removeClass('active');
	}
	
	set_node_for_enter_press(fast_enter, false, true);
}
var get_fast_suggests = function(q, callback, hash){
	return $.ajax({
	  url: 'http://www.last.fm/search/autocomplete',
	  global: false,
	  type: "GET",
	  timeout: 10000,
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
	  }	
	})
};


var suggestions_search = seesu.env.cross_domain_allowed ? function(q, arts_clone, track_clone ,tags_clone){
		
		var hash = hex_md5(q);
		var cache_used = cache_ajax.get('lfm_fs', hash, function(r){
			fast_suggestion(r, q, arts_clone, track_clone ,tags_clone)
		});
		if (!cache_used) {
			seesu.xhrs.fast_search_suggest = get_fast_suggests(q, function(r){	
				fast_suggestion(r, q, arts_clone, track_clone ,tags_clone)
			}, hash)
			
		}
	} :
	function(q, arts_clone, track_clone ,tags_clone){
		seesu.xhrs.multiply_suggestions = [];
		seesu.xhrs.multiply_suggestions.push(lfm('artist.search',{artist: q, limit: 15 },function(r){
			show_artists_results(r, false, 5);
			arts_clone.find('span').text('find more «' + q + '» artists');
		}));
		seesu.xhrs.multiply_suggestions.push(lfm('tag.search',{tag: q, limit: 15 },function(r){
			show_tags_results(r, false, 5);
			tags_clone.find('span').text('find more «' + q + '» tags');
			
		}));
		seesu.xhrs.multiply_suggestions.push(lfm('track.search',{track: q, limit: 15 },function(r){
			show_tracks_results(r, false, 5);
			track_clone.find('span').text('find more «' + q + '» tracks');
		}));
	};

var suggestions_prerender = function(input_value, crossdomain){
	var multy = !crossdomain;
	var source_query = input_value;

	var results_container = seesu.ui.views.get_search_rc().empty();


	results_container.append('<h4>Artists</h4>');
	var arts_clone = seesu.ui.buttons.search_artists.clone(true)
		.data('finishing_results', multy ? 5 : 0)
		.addClass("search-button")
		.find('span').text('Search «' +source_query + '» in artists').end();
	var ul_arts = seesu.ui.arts_results_ul = $("<ul id='artist-results-ul'></ul>").attr({ 'class': 'results-artists'});
	seesu.ui.buttons_li.search_artists = $('<li></li>',seesu.ui.d).append(arts_clone).appendTo(ul_arts);
	results_container.append(ul_arts);
	
	

	results_container.append('<h4>Tracks</h4>');
	var track_clone = seesu.ui.buttons.search_tracks.clone(true)
		.data('finishing_results', multy ? 5 : 0)
		.addClass("search-button")
		.find('span').text('Search «' +source_query + '» in tracks').end();
	var ul_tracks = seesu.ui.tracks_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists'});
	seesu.ui.buttons_li.search_tracks = $('<li></li>',seesu.ui.d).append(track_clone).appendTo(ul_tracks);
	results_container.append(ul_tracks);
	


	results_container.append('<h4>Tags</h4>');
	var tags_clone = seesu.ui.buttons.search_tags.clone(true)
		.data('finishing_results', multy ? 5 : 0)
		.addClass("search-button")
		.find('span').text('Search «' +source_query + '» in tags').end();
	var ul_tags = seesu.ui.tags_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists recommend-tags'});
	seesu.ui.buttons_li.search_tags = $('<li></li>',seesu.ui.d).append(tags_clone).appendTo(ul_tags);
	results_container.append(ul_tags);
	

	$('<p></p>',seesu.ui.d).append(seesu.ui.buttons.search_vkontakte.clone(true)).appendTo(results_container);
	
	seesu.ui.buttons_li.inject_before_buttons = true;
	seesu.ui.make_search_elements_index();
	set_node_for_enter_press(arts_clone, false, true);
	
	suggestions_search(source_query, arts_clone, track_clone ,tags_clone);
}


var input_change = $.debounce(function(e){
	var input = (e && e.target) || e; //e can be EVENT or INPUT  
	var input_value = input.value;
	if ($(input).data('lastvalue') == input_value){
		return false
	} else{
		$(input).data('lastvalue', input_value)
	}
	if (!input_value) {
		seesu.ui.views.show_start_page();
		return;
	}
	
	
	if (seesu.xhrs.fast_search_suggest) {seesu.xhrs.fast_search_suggest.abort()}
	if (seesu.xhrs.multiply_suggestions){
		for (var i=0; i < seesu.xhrs.multiply_suggestions.length; i++) {
			if (seesu.xhrs.multiply_suggestions[i]) {seesu.xhrs.multiply_suggestions[i].abort();}
		};
	}
	
	seesu.ui.els.search_form.data('current_node_index' , false);
	
	suggestions_prerender(input_value, seesu.env.cross_domain_allowed);
	seesu.ui.views.show_search_results_page();
	
	
	
},100);
