var results_mouse_click_for_enter_press = function(e){
	var node_name = e.target.nodeName;
	if ((node_name != 'A') && (node_name != 'BUTTON')){return false;}
	var active_node = seesu.ui.search_form.data('node_for_enter_press');
	if (active_node) {active_node.removeClass('active');}
	
	seesu.ui.search_form.data('node_for_enter_press', $(e.target).addClass('active'));
}
seesu.ui.make_search_elements_index = function(){
	seesu.ui.search_elements = $(searchres).find('a:not(.nothing-found), button');
	for (var i=0 , l = seesu.ui.search_elements.length; i < l; i++) {
		$(seesu.ui.search_elements[i]).data('search_element_index', i).data('search_elements_length', l)
	};
}
var show_artists_results = function(r){
	seesu.ui.buttons.search_artists.data('clone').remove()
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
					
				var span = $("<span></span>").attr({ text: artist});
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(a).append(img);
				} 
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (artists.name) {
			var artist = artists.name;
			set_artist_page(artist);
		}
		seesu.ui.make_search_elements_index()
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
	seesu.ui.buttons.search_tags.data('clone').remove();
	
	if (!r) {return}
	var tags = r.results.tagmatches.tag || false; 
	if (tags && tags.length){

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
					.mouseover(results_mouse_over_for_enter_press);
					
				var span = $("<span></span>").attr({ text: tag});
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tags.name) {
	
		}
		seesu.ui.make_search_elements_index()
		
	}
}
var show_tracks_results = function(r){
	seesu.ui.buttons.search_tracks.data('clone').remove();
	if (!r) {return}
	log(r)
	var tracks = r.results.trackmatches.track || false; 
	if (tracks && tracks.length){

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
					
				var span = $("<span></span>").attr({ text: artist + ' - ' + track});
				if(image){
					var img = $("<img/>").attr({ src: image , alt: artist });
					$(a).append(img);
				}
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tags.name) {
			
		}
		seesu.ui.make_search_elements_index()
	}
}




seesu.ui.buttons = {
	"search_artists" : 
		$('<button type="submit" name="type" value="artist" id="search-artist">Get artists</button>')
			.click(function(){
				var query = searchfield.value;
				if (query) {
					artistsearch(query);
				}
			})
			.click(results_mouse_click_for_enter_press),
		
	"search_tags":  
		$('<button type="submit" name="type" value="tag" id="search-tag">Get tags</button>')
			.click(function(){
				var _this = $(this);
				var query = searchfield.value;
				if (query) {
					tag_search(query)
				}
	
			})
			.click(results_mouse_click_for_enter_press),
	"search_tracks": $
		('<button type="submit" name="type" value="track" id="search-track">Get tracks</button>')
			.click(function(e){
				var _this = $(this);
				var query = searchfield.value;
				if (query) {
					track_search(query)
				}
			})
			.click(results_mouse_click_for_enter_press),
	"search_vkontakte": 
		$('<button type="submit" name="type" value="vk_track" id="search-vk-track">Use dirty search</button>')
			.click(function(e){
				var _this = $(this);
				var query = searchfield.value;
				if (query) {
					vk_track_search(query)
				}
			})
			.click(results_mouse_click_for_enter_press)
	
}
var fast_suggestion_ui = function(r){
	
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
	slider.className = 'show-search  show-search-results';
	searchres.innerHTML = '';
	$('#search-nav').text('Suggestions')
	
	
	var fast_enter = null;
	
	
	$(searchres).append('<h4>Artists</h4>');
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
			
			if (!fast_enter && (i == 0)) {fast_enter = a.addClass('active');}
			li.append(a);
			
			ul_arts.append(li);
		};
		
	}
	$(searchres).append(ul_arts);
	var clone = seesu.ui.buttons.search_artists.clone(true);
	seesu.ui.buttons.search_artists.data('clone', clone);
	$('<li></li').append(clone).appendTo(ul_arts);
	
	
	$(searchres).append('<h4>Tracks</h4>');
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
			if (!fast_enter && (i == 0)) {fast_enter = a.addClass('active');}
			li.append(a);
			ul_tracks.append(li);
		};
		
	}
	$(searchres).append(ul_tracks);
	

	
	var clone = seesu.ui.buttons.search_tracks.clone(true);
	seesu.ui.buttons.search_tracks.data('clone', clone);
	$('<li></li').append(clone).appendTo(ul_tracks);

	
	
	
	$(searchres).append('<h4>Tags</h4>');
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
			
			
			if (!fast_enter && (i == 0)) {fast_enter = a.addClass('active');}
			li.append(a);
			ul_tags.append(li);
		};
		
	}
	$(searchres).append(ul_tags);
	
	var clone = seesu.ui.buttons.search_tags.clone(true);
	seesu.ui.buttons.search_tags.data('clone', clone);
	$('<li></li').append(clone).appendTo(ul_tags);
	
	
	
	seesu.ui.search_form.data('node_for_enter_press', fast_enter )
	
	seesu.ui.make_search_elements_index();
	
	$('<p></p').append(seesu.ui.buttons.search_vkontakte).appendTo(searchres);

}
	
var input_change = function(e){
	var input_value = e.target.value;
	if (!input_value || ($(e.target).data('lastvalue') == input_value.replace(/ /g, ''))){return}
	$.ajax({
	  url: 'http://www.last.fm/search/autocomplete',
	  global: false,
	  type: "GET",
	  dataType: "json",
	  data: {
	  	"q": input_value,
	  	"force" : 1
	  },
	  error: function(){
	  },
	  success: fast_suggestion_ui
	});
	$(e.target).data('lastvalue', input_value.replace(/ /g, ''))
}
$(function(){
	$('#q').keyup($.debounce(input_change, 100)).mousemove($.debounce(input_change, 100)).change($.debounce(input_change, 100));
	
	seesu.ui.search_form = $('form#search');
	if (seesu.ui.search_form) {
		$(document).keyup(function(e){
			
			if (!slider.className.match(/show-search-results/)) {return}
			
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
						seesu.ui.search_form.data('node_for_enter_press', $(seesu.ui.search_elements[new_current]).addClass('active'))
						
					} else {
						var new_current = 0;
						seesu.ui.search_form.data('node_for_enter_press', $(seesu.ui.search_elements[new_current]).addClass('active'))
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
						seesu.ui.search_form.data('node_for_enter_press', $(seesu.ui.search_elements[new_current]).addClass('active'))
						
					} else {
						var new_current = els_length-1;
						seesu.ui.search_form.data('node_for_enter_press', $(seesu.ui.search_elements[new_current]).addClass('active'))
					}
				}
			}
		})
	}
})