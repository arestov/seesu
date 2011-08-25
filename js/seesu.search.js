function arrows_keys_nav(e){
	var srca = seesu.ui.views.getCurrentSearchResultsContainer();
	var srui = srca.ui;
	if (!srui){
		return false;
	}
	var _key = e.keyCode;
	if (_key == '13'){
		e.preventDefault();
		var current_node = srui.data('node_for_enter_press');
		if (current_node) {current_node.click()}
	} else 
	if((_key == '40') || (_key == '63233')){
		e.preventDefault();
		var current_node = srui.data('node_for_enter_press');
		if (current_node){
			var _elements = srui.data('search_elements');
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
		var current_node = srui.data('node_for_enter_press');
		if (current_node){
			var _elements = srui.data('search_elements');
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
	var srca = seesu.ui.views.getCurrentSearchResultsContainer();
	var srui = srca.ui;
	if (!srui){
		return false;
	}
	var node_name = e.target.nodeName;
	if ((node_name != 'A') && (node_name != 'BUTTON')){return false;}
	var active_node = srui.data('node_for_enter_press');
	if (active_node) {active_node.removeClass('active');}
	
	set_node_for_enter_press($(e.target));
};
var set_node_for_enter_press = function(node, scroll_to_node, not_by_user){
	var srca = seesu.ui.views.getCurrentSearchResultsContainer();
	var srui = srca.ui;
	if (!srui){
		return false;
	}
	if (!node){return false;}
	if (not_by_user){
		seesu.ui.els.search_form.data('current_node_index', false);
	} else{
		seesu.ui.els.search_form.data('current_node_index', node.data('search_element_index'));
	}
	srui.data('node_for_enter_press', node.addClass('active'));
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
};
(function(){
	searchResults = function(query, prepared, valueOf){
		this.query = query;
		if (prepared){
			this.append(prepared, valueOf);
		};
	};
	searchResults.prototype = new Array();
	var methods = {
		doesContain: doesContain,
		add: function(target, valueOf){
			if (this.doesContain(target, valueOf) == -1){
				return this.push(target);
			} else{
				return false;
			}
		},
		append: function(array, valueOf){
			for (var i=0; i < array.length; i++) {
				this.add(array[i], valueOf);
				
			};
		}
	};
	
	cloneObj(searchResults.prototype, methods);

	
})();

(function(){
	artistSuggest = function(artist, image){
		this.artist = artist;
		this.image = image;
	};
	artistSuggest.prototype = {
		valueOf: function(){
			return this.artist;
		}
	};
	
})();


(function(){
	trackSuggest = function(artist, track, image, duration){
		this.artist = artist;
		this.track = track;
		this.image = image;
		if (duration){
			this.duration = duration;
		}
	};
	trackSuggest.prototype = {
		valueOf: function(){
			return this.artist + ' - ' + this.track;
		}
	};
	
})();
(function(){
	tagSuggest = function(tag, image){
		this.tag = tag;
		if (image){
			this.image = image;
		}
		
	};
	tagSuggest.prototype = {
		valueOf: function(){
			return this.tag;
		}
	};
	
})();



var create_artist_suggest_item = function(artist, image, source_query){
	var a = $("<a></a>")
		.data('artist', artist)
		.click(function(e){
			var artist = $(this).data('artist');
			seesu.ui.show_artist(artist, source_query);
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "artist: " + artist );
		})
		.click(results_mouse_click_for_enter_press);
	
	$("<img/>").attr({ src: (image || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png'), alt: artist }).appendTo(a);
	$("<span></span>").text(artist).appendTo(a);
	return a
};
var create_track_suggest_item = function(artist, track, image, duration){
	var a = $("<a></a>")
		.data('track_title',track)
		.data('artist',artist)
		.click(function(e){
			seesu.ui.show_artist(artist, {
				artist: artist,
				track: track
			}, false, {
				artist: artist,
				track: track
			});

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
};
var create_tag_suggest_item = function(tag, source_query){
	return $("<a></a>")
		.data('tag',tag)
		.click(function(e){
			var tag = $(this).data('tag');
			su.ui.show_tag(tag, source_query);
			seesu.track_event('Music search', seesu.ui.els.search_input.val(), "tag: " + tag );
		})
		.click(results_mouse_click_for_enter_press)
		.append("<span>" + tag + "</span>");
};
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
				
				li.append(create_artist_suggest_item(artist, image, source_query));
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
			li.append(create_artist_suggest_item(artist, image, source_query))
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
	console.log('almost rend')
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
		rend_vk_suggets(pl && pl[0] && pl[0].t, ui);
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
				li.append(create_tag_suggest_item(tag, source_query));
				
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
			
			li.append(create_tag_suggest_item(tag, source_query));
			
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
};


var fast_suggestion = function(r, source_query, ui){
	var srca = seesu.ui.views.getCurrentSearchResultsContainer();
	var srui = srca.ui;
	if (!srui || srca.freezed){
		return false;
	}
	
	if (!r) {return false;}
	
	var fast_enter = null;
	var clone = null;
	
	

	
	
	
	
	var ul_arts = seesu.ui.arts_results_ul;
	
	if (r.artists.length){
		for (var i=0, l = r.artists.length; i < l; i++) {
			var cur = r.artists[i];
			
			var li = $("<li class='suggested'></li>");
			
			var a =  create_artist_suggest_item(cur.artist, cur.image, source_query)
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			
			seesu.ui.buttons_li.search_artists.before(li);
		};
		var b_text = localize('fine-more', 'find more') + ' «' + source_query + '» ' + localize('artists', 'artists');
		
		$('<li></li>',seesu.ui.d)
			.append(
				ui.arts.button
					.find('span')
						.text(b_text)
					.end()
					.addClass("search-button"))
			.appendTo(ul_arts);
			
	} else{
		var b_text = localize('to-search', 'Search ') + '«' +source_query + '» ' + localize('in-artists','in artists');
		
		$('<li></li>',seesu.ui.d)
			.append(
				ui.arts.button
					.find('span')
						.text(b_text)
					.end()
					.addClass("search-button"))
			.appendTo(ul_arts);
	}
	
	
	
	if (!fast_enter) {fast_enter = ui.arts.button;}
	
	var ul_tracks = seesu.ui.tracks_results_ul;
	if (r.tracks.length){
		
		
		for (var i=0, l =  r.tracks.length; i < l; i++) {
			var cur = r.tracks[i];
			var li = $("<li class='suggested'></li>");
			var a = create_track_suggest_item(cur.artist, cur.track, cur.image, cur.duration)
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			seesu.ui.buttons_li.search_tracks.before(li);
		};
		var b_text = localize('fine-more', 'find more') + ' «' + source_query + '» '+ localize('tracks', 'tracks');
		
		$('<li></li>',seesu.ui.d).append(ui.track.button.find('span').text(b_text).end()).appendTo(ul_tracks);
		
	} else{
		var b_text = localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tracks','in tracks');
		
		$('<li></li>',seesu.ui.d).append(ui.track.button.find('span').text(b_text).end().addClass("search-button")).appendTo(ul_tracks);
	}
	if (!fast_enter) {fast_enter = ui.track.button;}
	

	
	var ul_tags = seesu.ui.tags_results_ul;
	if (r.tags.length){
		for (var i=0, l = r.tags.length; i < l; i++) {
			var cur = r.tags[i];
			
			var li = $("<li class='suggested'></li>");
			
			var a = create_tag_suggest_item(cur.tag, source_query)
			
			if ((i == 0) && ( !fast_enter || fast_enter.is('button') )) {fast_enter = a;}
			li.append(a);
			seesu.ui.buttons_li.search_tags.before(li);
		};
		var b_text = localize('fine-more', 'find more') + ' «' + source_query + '» '+ localize('tags', 'tags');
		
		
		$('<li></li>',seesu.ui.d).append(ui.tag.button.find('span').text(b_text).end()).appendTo(ul_tags);
	} else{
		var b_text = localize('to-search', 'Search ') + '«' +source_query + '» ' +localize('in-tags' , 'in tags');
		
		
		$('<li></li>',seesu.ui.d).append(ui.tag.button.find('span').text(b_text).end(b_text).addClass("search-button")).appendTo(ul_tags);
	}
	if (!fast_enter) {fast_enter = ui.tag.button;}
	
	seesu.ui.make_search_elements_index();
		
	var active_node = srui.data('node_for_enter_press');
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
	  	r = parseFastSuggests(r, q);
		cache_ajax.set('lfm_fs', hash, r);
		if (callback){callback(r);}
	  }	,
	  complete: function(xhr){
	  	if (su.ui.els.search_input.val() != q){return}
	  	su.ui.els.search_label.removeClass('loading');
	  }
	});
	
	
	
},400);

var renderSuggest

var parseFastSuggests = function(r, q){
	
	
	
	var sugg_arts = $filter(r.response.docs, 'restype', 6);
	$.each(sugg_arts, function(i, el){
		sugg_arts[i] = new artistSuggest(
			el.artist, 
			el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false);
	});
	sugg_arts = new searchResults(q, sugg_arts);

	var sugg_tracks = $filter(r.response.docs, 'restype', 9);
	$.each(sugg_tracks, function(i, el){
		sugg_tracks[i] = new trackSuggest(
			el.artist, 
			el.track,
			el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false,
			el.duration
		);
	});

	var sugg_tags = $filter(r.response.docs, 'restype', 32);
	$.each(sugg_tags, function(i, el){
		sugg_tags[i] = new tagSuggest(el.tag);
	});

	
	//var sugg_albums = $filter(r.response.docs, 'restype', 8);
	
	
	
	return {
		artists: sugg_arts,
		tracks: sugg_tracks,
		tags: sugg_tags
	};
};


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

var suggestions_prerender = function(search_view, input_value, crossdomain){
	var multy = !crossdomain;
	var source_query = input_value;

	
	
	var results_container = search_view.ui.empty();
	
	var create_plr_entity = function(pl){
		pl.with_search_results_link = input_value;
		var li  = $('<li></li>');
		var _b = $('<a></a>')
			.text(pl.playlist_title)
			.click(function(){
				
				var plist = su.ui.views.findViewOfURL(getUrlOfPlaylist(pl));
				if (plist){
					if (plist.freezed){
						su.ui.views.restoreFreezed();
					}
				} else{
					su.ui.views.show_playlist_page(pl, source_query ? 0 : false);
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


var input_change = function(e, no_navi){
	var input = (e && e.target) || e; //e can be EVENT or INPUT  
	
	var search_view = seesu.ui.views.getSearchResultsContainer();
	
	
	var input_value = input.value;
	if (search_view.context.q == input_value){
		return false
	} else{
		search_view.context.q= input_value;
		search_view.setURL('?q=' + input_value);
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
	
	suggestions_prerender(search_view, input_value, seesu.env.cross_domain_allowed);
	
	seesu.ui.views.show_search_results_page(false, no_navi);
	
	
	
};
