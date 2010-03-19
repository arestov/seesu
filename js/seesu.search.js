var show_artists_results = function(r){
	seesu.ui.buttons.search_artists.remove()
	
	
	var artists = r.results.artistmatches.artist || false; 
	if (artists){
		$('#search-nav').text('Suggestions & search')
		var ul = seesu.ui.arts_results_ul;
		
		if (artists.length){
			
			for (var i=0; i < artists.length; i++) {
				var artist = artists[i].name,
					image = artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/') || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>").data('artist',artist);
					a.click(function(e){
						var artist = $(this).data('artist');
						set_artist_page(artist,true);
					});
					
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

	} else {

		$("<p></p>").attr({ text: 'Nothing found'}).appendTo(seesu.ui.arts_results_ul);

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
	seesu.ui.buttons.search_tags.remove();
	
	
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
				
				var a = $("<a></a>").data('tag',tag);
					a.click(function(e){
						var tag = $(this).data('tag');
						render_tracks_by_artists_of_tag(tag)
					});
					
				var span = $("<span></span>").attr({ text: tag});
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tags.name) {
	
		}
		
		
	}
}
var show_tracks_results = function(r){
	seesu.ui.buttons.search_tracks.remove();
	log(r)
	return
	var tracks = r.results.trackmatches.tag || false; 
	if (tracks && tracks.length){

		$('#search-nav').text('Suggestions & search')
		var ul = seesu.ui.tracks_results_ul;
		
		if (tags.length){
			
			for (var i=0; i < tracks.length; i++) {
				var track = tracks[i].name;

				var li = $("<li></li>");
				
				if( i == 0){
					li.addClass('searched-bordered')
				}
				
				var a = $("<a></a>").data('track_title',track);
					a.click(function(e){
						var track = $(this).data('track_title');
						render_tracks_by_artists_of_tag(tag)
					});
					
				var span = $("<span></span>").attr({ text: tag});
				$(a).append(span);
				$(li).append(a);
				$(ul).append(li);
			} 
		} else if (tags.name) {
			
		}
	}
}




seesu.ui.buttons = {
	"search_artists" : $('<button type="submit" name="type" value="artist" id="search-artist">Get artists</button>').click(function(){
			var query = searchfield.value;
			if (query) {
				artistsearch(query);
			}
		}),
		
	"search_tags":  $('<button type="submit" name="type" value="tag" id="search-tag">Get tags</button>').click(function(){
			var _this = $(this);
			var query = searchfield.value;
			if (query) {
				tag_search(query)
			}

		}),
	"search_tracks": $('<button type="submit" name="type" value="track" id="search-track">Get tracks</button>').click(function(e){
			var _this = $(this);
			var query = searchfield.value;
			if (query) {
				track_search(query)
			}
		}),
	"search_vkontakte": $('<button type="submit" name="type" value="vk_track" id="search-vk-track">Use dirty search</button>').click(function(e){
			var _this = $(this);
			var query = searchfield.value;
			if (query) {
				vk_track_search(query)
			}
		})
	
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
				});
			var span = $("<span></span>").html(artist);
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(a).append(img);
			} 
			$(a).append(span);
			
			
			$(li).append(a);
			$(ul_arts).append(li);
		};
		
	}
	$(searchres).append(ul_arts);
	$('<li></li').append(seesu.ui.buttons.search_artists.html('Get')).appendTo(ul_arts);
	
	
	
	$(searchres).append('<h4>Tracks</h4>');
	var ul_tracks = $("<ul></ul>").attr({ 'class': 'results-artists'});
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
				});
			var span = $("<span></span>").html(artist + ' &mdash; ' + track);
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(a).append(img);
			} 
			if (sugg_tracks[i].duration){
				var track_dur = parseInt(sugg_tracks[i].duration);
				track_dur = (Math.round(track_dur/60)) + ':' + (track_dur % 60)
				$(a).append('<span class="sugg-track-dur">' + track_dur + '</span>');
			}
			$(a).append(span);
			$(li).append(a);
			$(ul_tracks).append(li);
		};
		
	}
	$(searchres).append(ul_tracks);
	
	var bli_track = $('<li></li');
	seesu.ui.buttons.search_tracks.appendTo(bli_track);
	bli_track.appendTo(ul_tracks);
	
	
	
	$(searchres).append('<h4>Tags</h4>');
	var ul_tags = seesu.ui.tags_results_ul = $("<ul></ul>").attr({ 'class': 'results-artists recommend-tags'});
	if (sugg_tags && sugg_tags.length){
		for (var i=0, l = sugg_tags.length; i < l; i++) {
			var li = $("<li class='suggested'></li>");
			var a = $("<a></a>");
			var span = $("<span></span>").html(sugg_tags[i].tag);
			$(a).append(span);
			
			$(li).append(a);
			$(ul_tags).append(li);
		};
		
	}
	$(searchres).append(ul_tags);
	
	var bli_tag = $('<li></li');
	seesu.ui.buttons.search_tags.appendTo(bli_tag);
	bli_tag.appendTo(ul_tags);
	
	
	var bp_vk_track = $('<p></p');
	seesu.ui.buttons.search_vkontakte.appendTo(bp_vk_track);
	bp_vk_track.appendTo(searchres);
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
})