var results_mouse_click_for_enter_press = function(e){
	var node_name = e.target.nodeName;
	if ((node_name != 'A') && (node_name != 'BUTTON')){return false;}
	var active_node = seesu.ui.search_form.data('node_for_enter_press');
	if (active_node) {active_node.removeClass('active');}
	
	set_node_for_enter_press($(e.target));
}
$(function(){
	seesu.ui.scrolling_viewport = $('#screens');
})
var set_node_for_enter_press = function(node, scroll_to_node){
	if (!node){return false}
	
	seesu.ui.search_form.data('node_for_enter_press', node.addClass('active'));
	seesu.ui.search_form.data('current_node_index', node.data('search_element_index'));
	
	if (scroll_to_node){
		var scroll_up = seesu.ui.scrolling_viewport.scrollTop();
		var scrolling_viewport_height = seesu.ui.scrolling_viewport.height()
		
		var container_postion = scroll_up + $(searchres).position().top;
		
		var node_position = node.parent().position().top + container_postion;
		
		
		var view_pos_down = node.parent().height() + node_position;
		var view_pos_up = node_position;

		var scroll_down = scroll_up + scrolling_viewport_height;

		if ( view_pos_down > scroll_down){
			
			var new_position =  view_pos_down - scrolling_viewport_height/2;
			seesu.ui.scrolling_viewport.scrollTop(new_position);
		} else if (view_pos_down < scroll_up){
			var new_position =  view_pos_down - scrolling_viewport_height/2;
			seesu.ui.scrolling_viewport.scrollTop(new_position);
		}
		
	}
}
seesu.ui.make_search_elements_index = function(remark_enter_press){
	seesu.ui.search_elements = $(searchres).find('a:not(.nothing-found), button');
	for (var i=0 , l = seesu.ui.search_elements.length; i < l; i++) {
		$(seesu.ui.search_elements[i]).data('search_element_index', i).data('search_elements_length', l)
	};
	
	
	if (remark_enter_press) {
		var active_node = seesu.ui.search_form.data('node_for_enter_press');
		if (active_node) {
			var active_index = seesu.ui.search_form.data('current_node_index');
			var new_active_node = $(seesu.ui.search_elements[active_index]);
			if (new_active_node) {
				active_node.removeClass('active');
				set_node_for_enter_press(new_active_node);
			}
			
		}
	}
	
	
}
var show_artists_results = function(r){
	if (!r) {return}
	
	var artists = r.results.artistmatches.artist || false; 
	if (artists){
		$('#search-nav').text('Suggestions & search');
		var ul = seesu.ui.arts_results_ul;
		
		if (artists.length){
			
			for (var i=0; i < artists.length; i++) {
				var artist = artists[i].name,
					image = artists[i].image && artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/') || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>").data('artist',artist)
					.click(function(e){
						var artist = $(this).data('artist');
						set_artist_page(artist,true);
					})
					.click(results_mouse_click_for_enter_press);
					
				var span = $("<span></span>").text(artist);
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(a).append(img);
				} 
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (artists.name) {
			var artist = artists.name,
				image = artists.image && artists.image[1]['#text'].replace('/serve/64/','/serve/64s/') || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			var li = $("<li></li>");
			var a = $("<a></a>").data('artist',artist)
				.click(function(e){
					var artist = $(this).data('artist');
					set_artist_page(artist,true);
				})
				.click(results_mouse_click_for_enter_press);
				
			var span = $("<span></span>").text(artist);
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(a).append(img);
			} 
			$(a).append(span);
			$(li).append(a);
			$(ul).append(li);
		}
		seesu.ui.make_search_elements_index(true)
	} else {
	
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(seesu.ui.arts_results_ul);

	}
}
var artistsearch = function(artist_query) {
	lfm('artist.search',{artist: artist_query, limit: 15 },show_artists_results)
	
};
var tag_search = function(tag_query){
	lfm('tag.search',{tag: tag_query, limit: 15 },show_tags_results)
}
var track_search = function(track_query){
	lfm('track.search',{track: track_query, limit: 15 },show_tracks_results)
}
var show_tags_results = function(r){
	
	if (!r) {return}
	var tags = r.results.tagmatches.tag || false; 
	if (tags){

		$('#search-nav').text('Suggestions & search')
		var ul = seesu.ui.tags_results_ul;
		
		if (tags.length){
			
			for (var i=0; i < tags.length; i++) {
				var tag = tags[i].name;

				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>")
					.data('tag',tag)
					.click(function(e){
						var tag = $(this).data('tag');
						render_tracks_by_artists_of_tag(tag)
					})
					.click(results_mouse_click_for_enter_press);
					
				var span = $("<span></span>").text(tag);
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tags.name) {
			var tag = tags.name
			var li = $("<li></li>");
			var a = $("<a></a>")
				.data('tag',tag)
				.click(function(e){
					var tag = $(this).data('tag');
					render_tracks_by_artists_of_tag(tag)
				})
				.click(results_mouse_click_for_enter_press);
				
			var span = $("<span></span>").text(tag);
			$(a).append(span);
			$(li).append(a);
			$(ul).append(li);
		}
		seesu.ui.make_search_elements_index(true)
		
	} else {
	
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(seesu.ui.tags_results_ul);

	}
}
var show_tracks_results = function(r){
	if (!r) {return}
	var tracks = r.results.trackmatches.track || false; 
	if (tracks){

		$('#search-nav').text('Suggestions & search')
		var ul = seesu.ui.tracks_results_ul;
		
		if (tracks.length){
			
			for (var i=0; i < tracks.length; i++) {
				var track = tracks[i].name,
					image = tracks[i].image && tracks[i].image[1]['#text'].replace('/serve/64/','/serve/64s/') || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png',
					artist = tracks[i].artist;
				
				
				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>")
					.data('track_title',track)
					.data('artist',artist)
					.click(function(e){
						var query = $(this).data('artist') + ' - '+ $(this).data('track_title');
						vk_track_search(query)
					})
					.click(results_mouse_click_for_enter_press);
					
				var span = $("<span></span>").text(artist + ' - ' + track);
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(a).append(img);
				}
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tracks.name) {
			var track = tracks.name,
				image = tracks.image && tracks.image[1]['#text'].replace('/serve/64/','/serve/64s/') || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png',
				artist = tracks.artist;
				
				
				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>")
					.data('track_title',track)
					.data('artist',artist)
					.click(function(e){
						var query = $(this).data('artist') + ' - '+ $(this).data('track_title');
						vk_track_search(query)
					})
					.click(results_mouse_click_for_enter_press);
					
				var span = $("<span></span>").text(artist + ' - ' + track);
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(a).append(img);
				}
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
		}
		seesu.ui.make_search_elements_index(true)
	} else{
		$("<li><a class='nothing-found'>Nothing found</a></li>").appendTo(seesu.ui.tracks_results_ul);
	}
}


seesu.ui.buttons = {
	"search_artists" : 
		$('<button type="submit" name="type" value="artist" id="search-artist"><span>Search in artists</span></button>')
			.click(function(e){
				$(this).parent().remove()
				var query = searchfield.value;
				if (query) {
					artistsearch(query);
				}
			}),
		
	"search_tags":  
		$('<button type="submit" name="type" value="tag" id="search-tag"><span>Search in tags</span></button>')
			.click(function(e){
				$(this).parent().remove()
				var query = searchfield.value;
				if (query) {
					tag_search(query)
				}
			}),
	"search_tracks": 
		$('<button type="submit" name="type" value="track" id="search-track"><span>Search in tracks</span></button>')
			.click(function(e){
				$(this).parent().remove()
				var query = searchfield.value;
				if (query) {
					track_search(query)
				}
			}),
	"search_vkontakte": 
		$('<button type="submit" name="type" value="vk_track" id="search-vk-track" class="search-button"><span>Use dirty search</span></button>')
			.click(function(e){
				var query = searchfield.value;
				if (query) {
					vk_track_search(query)
				}
			})
	
}
var fast_suggestion_ui = function(r){
	if (!r) {return false}
	
	var source_query = r.responseHeader.params.originalq;
	
	
	var sugg_arts = [];
	var sugg_tracks = [];
	var sugg_tags = [];
	
	for (var i=0, l = r.response.docs.length; i < l ; i++) {
		var response_modul = r.response.docs[i];
		if (response_modul.restype == 6){
			sugg_arts.push(response_modul);
		} else 
		if (response_modul.restype == 9){
			sugg_tracks.push(response_modul);
		} else
		if (response_modul.restype == 32){
			sugg_tags.push(response_modul);
		}
	};
	
	searchres.innerHTML = '';
	$('#search-nav').text('Suggestions')
	
	
	var fast_enter = null;
	
	var clone = null;
	
	$(searchres).append('<h4>Artists</h4>');
	clone = seesu.ui.buttons.search_artists.clone(true);
	
	
	var ul_arts = seesu.ui.arts_results_ul = $("<ul id='artist-results-ul'></ul>").attr({ 'class': 'results-artists'});
	if (sugg_arts && sugg_arts.length){
		for (var i=0, l = sugg_arts.length; i < l; i++) {
			var artist = sugg_arts[i].artist;
			var image =  sugg_arts[i].image ? 'http://userserve-ak.last.fm/serve/34s/' + sugg_arts[i].image : 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			var li = $("<li class='suggested'></li>");
			
			var a = $("<a></a>")
				.data('artist', artist)
				.click(function(e){
					var artist = $(this).data('artist');
					set_artist_page(artist,true);
				})
				.click(results_mouse_click_for_enter_press);
			var span = $("<span></span>").html(artist);
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(a).append(img);
			} 
			a.append(span);
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			
			ul_arts.append(li);
		};
		$('<li></li').append(clone.find('span').text('find more «' + source_query + '» artists').end()).appendTo(ul_arts);
	} else{
		$('<li></li').append(clone.find('span').text('Search «' +source_query + '» in artists').end().addClass("search-button")).appendTo(ul_arts);
	}
	if (!fast_enter) {fast_enter = clone;}
	$(searchres).append(ul_arts);
	
	
	
	
	$(searchres).append('<h4>Tracks</h4>');
	 clone = seesu.ui.buttons.search_tracks.clone(true);
	
	var ul_tracks = seesu.ui.tracks_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists'});
	if (sugg_tracks && sugg_tracks.length){
		
		
		for (var i=0, l = sugg_tracks.length; i < l; i++) {
			var artist = sugg_tracks[i].artist;
			var track = sugg_tracks[i].track;
			var image =  sugg_tracks[i].image ? 'http://userserve-ak.last.fm/serve/34s/' + sugg_tracks[i].image : 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			var li = $("<li class='suggested'></li>");
			var a = $("<a></a>")
				.data('artist', artist)
				.data('track_title', track)
				.click(function(e){
					var track_search_query = $(this).data('artist') + ' - ' +$(this).data('track_title');
					vk_track_search(track_search_query)
				})
				.click(results_mouse_click_for_enter_press);
			var span = $("<span></span>").html(artist + ' &mdash; ' + track);
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(a).append(img);
			} 
			if (sugg_tracks[i].duration){
				var track_dur = parseInt(sugg_tracks[i].duration);
				var digits = track_dur % 60
				track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits )
				$(a).append('<span class="sugg-track-dur">' + track_dur + '</span>');
			}
			a.append(span);
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			ul_tracks.append(li);
		};
		$('<li></li').append(clone.find('span').text('find more «' + source_query + '» tracks').end()).appendTo(ul_tracks);
	} else{
		$('<li></li').append(clone.find('span').text('Search «' +source_query + '» in tracks').end().addClass("search-button")).appendTo(ul_tracks);
	}
	if (!fast_enter) {fast_enter = clone;}
	$(searchres).append(ul_tracks);
	

	
	
	

	
	
	
	$(searchres).append('<h4>Tags</h4>');
	clone = seesu.ui.buttons.search_tags.clone(true);
	
	var ul_tags = seesu.ui.tags_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists recommend-tags'});
	if (sugg_tags && sugg_tags.length){
		for (var i=0, l = sugg_tags.length; i < l; i++) {
			
			var tag = sugg_tags[i].tag
			var li = $("<li class='suggested'></li>");
			
			var span = $("<span></span>").html(tag);
			
			var a = $("<a></a>")
				.data('tag',tag)
				.click(function(e){
					var tag = $(this).data('tag');
					render_tracks_by_artists_of_tag(tag)
				})
				.click(results_mouse_click_for_enter_press)
				.append(span);
			
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			ul_tags.append(li);
		};
		$('<li></li').append(clone.find('span').text('find more «' + source_query + '» tags').end()).appendTo(ul_tags);
	} else{
		$('<li></li').append(clone.find('span').text('Search «' +source_query + '» in tags').end().addClass("search-button")).appendTo(ul_tags);
	}
	if (!fast_enter) {fast_enter = clone;}
	$(searchres).append(ul_tags);
	

	
	
	$('<p></p').append(seesu.ui.buttons.search_vkontakte).appendTo(searchres);
	
	
	seesu.ui.make_search_elements_index();
	set_node_for_enter_press(fast_enter);
	
	

}
	
var input_change = function(e){
	var input_value = e.target.value;
	if (!input_value) {
		slider.className = "show-start";
	}
	if (!input_value || ($(e.target).data('lastvalue') == input_value.replace(/ /g, ''))){return}
	
	if(seesu.xhrs.fast_search_suggest) {seesu.xhrs.fast_search_suggest.abort()}
	seesu.xhrs.fast_search_suggest = $.ajax({
	  url: 'http://www.last.fm/search/autocomplete',
	  global: false,
	  type: "GET",
	  timeout: 10000,
	  dataType: "json",
	  data: {
	  	"q": input_value,
	  	"force" : 1
	  },
	  error: function(){
	  },
	  success: fast_suggestion_ui
	});
	slider.className = 'show-search  show-search-results';
	$(e.target).data('lastvalue', input_value.replace(/ /g, ''))
}
$(function(){
	$('#q').keyup($.debounce(input_change, 100)).mousemove($.debounce(input_change, 100)).change($.debounce(input_change, 100));
	
	seesu.ui.search_form = $('form#search');
	if (seesu.ui.search_form) {
		$(document).keypress(function(e){
			
			if (!slider.className.match(/show-search-results/)) {return}
			if (document.activeElement.nodeName == 'BUTTON'){return}
			var _key = e.keyCode;

			if (_key == '13'){
				e.preventDefault();
				var current_node = seesu.ui.search_form.data('node_for_enter_press');
				if (current_node) {current_node.click()}
			} else 
			if(_key == '40'){
				e.preventDefault();
				var current_node = seesu.ui.search_form.data('node_for_enter_press');
				if (current_node){
					var el_index = current_node.data('search_element_index');
					var els_length = current_node.data('search_elements_length');
					current_node.removeClass('active')
					
					if (el_index < (els_length -1)){
						var new_current = el_index+1;
						set_node_for_enter_press($(seesu.ui.search_elements[new_current]), true)
						
					} else {
						var new_current = 0;
						set_node_for_enter_press($(seesu.ui.search_elements[new_current]), true)
					}
				}
			} else 
			if(_key == '38'){
				e.preventDefault();
				var current_node = seesu.ui.search_form.data('node_for_enter_press');
				if (current_node){
					var el_index = current_node.data('search_element_index');
					var els_length = current_node.data('search_elements_length');
					current_node.removeClass('active')
					
					if (el_index > 0){
						var new_current = el_index-1;
						set_node_for_enter_press($(seesu.ui.search_elements[new_current]), true)
						
					} else {
						var new_current = els_length-1;
						set_node_for_enter_press($(seesu.ui.search_elements[new_current]), true)
					}
				}
			}
		})
	}
})