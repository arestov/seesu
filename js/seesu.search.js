(function() {
var default_sugg_artimage = 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';

var artistSuggest = function(artist, image){
		this.artist = artist;
		this.image = image;
	};
	artistSuggest.prototype = new baseSuggest();
	cloneObj(artistSuggest.prototype, {
		valueOf: function(){
			return this.artist;
		},
		click: function(){
			su.ui.views.showArtcardPage(this.artist, true)
			su.track_event('Music search', this.q, "artist: " + this.artist );
		},
		createItem: function(q){
			var _this = this;
			this.q = q;
			var a = $("<a></a>")
				.click(function(e){_this.click();})
				.click(function(){
					setEnterItemAfterClick(_this);
				});
			$("<img/>").attr({ src: (this.image || default_sugg_artimage), alt: this.artist }).appendTo(a);
			$("<span></span>").text(this.valueOf()).appendTo(a);
			return a;
		}
	});




var playlistSuggest = function(pl){
		this.pl = pl;
	};
	playlistSuggest.prototype = new baseSuggest();
	cloneObj(playlistSuggest.prototype, {
		valueOf: function(){
			return this.pl.playlist_title;
		},
		click: function(){
			su.ui.views.show_playlist_page(this.pl, true);
				
		},
		createItem: function(q){
			var _this = this;
			return $('<a></a>')
				.text(this.valueOf())
				.click(function(){_this.click();});
		}
	})


var trackSuggest = function(artist, track, image, duration){
		this.artist = artist;
		this.track = track;
		this.image = image;
		if (duration){
			this.duration = duration;
		}
	};
	trackSuggest.prototype = new baseSuggest();
	cloneObj(trackSuggest.prototype, {
		valueOf: function(){
			return this.artist + ' - ' + this.track;
		},
		click: function(){
			su.ui.showTopTacks(this.artist, {save_parents: true}, {
				artist: this.artist,
				track: this.track
			});

			seesu.track_event('Music search', this.q, "track: " + this.artist + ' - ' + this.track );	
		},
		createItem: function(q){
			this.q = q;
			var _this = this;
			var a = $("<a></a>")
				.click(function(e){_this.click();})
				.click(function(){
					setEnterItemAfterClick(_this);
				});
			
			$("<img/>").attr({ src: (this.image || default_sugg_artimage) , alt: this.artist }).appendTo(a);
			if (this.duration){
				var track_dur = parseInt(this.duration);
				var digits = track_dur % 60
				track_dur = (Math.round(track_dur/60)) + ':' + (digits < 10 ? '0'+digits : digits )
				a.append('<span class="sugg-track-dur">' + track_dur + '</span>');
			}
			$("<span></span>").text(this.valueOf()).appendTo(a);
			return a;
		}
	});

	


var tagSuggest = function(tag, image){
		this.tag = tag;
		if (image){
			this.image = image;
		}
		
	};
	tagSuggest.prototype = new baseSuggest();
	cloneObj(tagSuggest.prototype, {
		valueOf: function(){
			return this.tag;
		},
		click: function(){
			su.ui.show_tag(this.tag, {save_parents: true});
			seesu.track_event('Music search', this.q, "tag: " + this.tag );
		},
		createItem: function(q) {
			this.q = q;
			var _this = this;
			return $("<a></a>")
				.click(function(e){_this.click();})
				.click(function(){
					setEnterItemAfterClick(_this);
				})
				.append("<span>" + this.valueOf() + "</span>");
		}
	});
	

var albumSuggest = function(artist, name, image, id){
		this.artist = artist;
		this.name = name;
		
		if (image){
			this.image = image;
		}
		if (id){
			this.aid = id;
		}
	};
	albumSuggest.prototype = new baseSuggest();
	cloneObj(albumSuggest.prototype, {
		valueOf: function(){
			return '( ' + this.artist + ' ) ' + this.name;
		},
		click: function(){
			su.ui.showAlbum({
				artist: this.artist,
				album_name: this.name,
				album_id: this.aid
			}, {save_parents: true});
			seesu.track_event('Music search', this.q, "album: " + this.valueOf());
		},
		createItem: function(q) {
			var _this = this;
			this.q = q;
			var a = $("<a></a>")
				.click(function(e){_this.click();})
				.click(function(){
					setEnterItemAfterClick(_this);
				});
			$("<img/>").attr({ src: (this.image || default_sugg_artimage), alt: this.valueOf() }).appendTo(a);
			$("<span></span>").text(this.valueOf()).appendTo(a);
			return a;
		}
	});



var playlist_secti = {
	head: localize('playlists'),
	cclass: 'playlist-results'
}
var artists_secti = {
	head: localize('Artists','Artists'),
	button: function(){
		return $('<button type="submit" name="type" value="artist"><span>Search in artists</span></button>');
	},
	cclass: 'results-suggests',
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» ' + localize('oartists', 'artists');
		} else{
			return localize('to-search', 'Search ') + '«' + q + '» ' + localize('in-artists','in artists');
		}
	},
	buttonClick: function(e, section){
		section.hideButton();
		var q = section.r.query;
		if (q) {
			getLastfmSuggests('artist.search', {artist: q}, q, section, parseArtistsResults, true);

		}
	}
};
var tracks_secti = {
	head: localize('Tracks','Tracks'),
	button: function(){
		return $('<button type="submit" name="type" value="track"><span>Search in tracks</span></button>');
	},
	cclass: 'results-suggests',
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('otracks', 'tracks');
		} else{
			return localize('to-search', 'Search ') + '«' + q + '» ' +localize('in-tracks','in tracks');
		}
	},
	buttonClick: function(e, section){
		section.hideButton();
		var q = section.r.query;
		if (q) {
			getLastfmSuggests('track.search', {track: q}, q, section, parseTracksResults, true);
		}
	}
};

var tags_secti = {
	head: localize('Tags'),
	button: function(){
		return $('<button type="submit" name="type" value="tag"><span>Search in tags</span></button>');
	},
	cclass: 'results-suggests recommend-tags',
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('otags', 'tags');
		} else{
			return localize('to-search', 'Search ') + '«' +q + '» ' +localize('in-tags' , 'in tags');
		}
	},
	buttonClick: function(e, section){
		section.hideButton();
		var q = section.r.query;
		if (q) {
			getLastfmSuggests('tag.search', {tag: q}, q, section, parseTagsResults, true);	
		}
	}
};
var albs_secti = {
	head: localize('Albums', 'Albums'),
	button: function(){
		return $('<button type="submit" name="type" value="album"><span>Search in albums</span></button>');
	},
	cclass: 'results-suggests recommend-albums',
	getButtonText: function(have_results, q){
		if (have_results){
			return localize('fine-more', 'find more') + ' «' + q + '» '+ localize('oalbums', 'albums');
		} else{
			return localize('to-search', 'Search ') + '«' +q + '» ' +localize('in-albums' , 'in albums');
		}
	},
	buttonClick: function(e, section){
		section.hideButton();
		var q = section.r.query;
		if (q) {
			getLastfmSuggests('album.search', {'album': q}, q, section, parseAlbumsResults, true);
		}
	}
};

arrows_keys_nav = function(e){
	
	var invstg = su.ui.search_el && su.ui.search_el.D('invstg');
	
	if (invstg){
		var _key = e.keyCode;
		if (_key == '13'){
			e.preventDefault();
			invstg.pressEnter();
		} else 
		if((_key == '40') || (_key == '63233')){
			e.preventDefault();
			invstg.selectEnterItemAbove();
		} else 
		if((_key == '38') || (_key == '63232')){
			e.preventDefault();
			invstg.selectEnterItemBelow();
		}
	}
	
};

var setEnterItemAfterClick = function(item){

	var invstg = su.ui.search_el && su.ui.search_el.D('invstg');
	
	if (invstg){
		invstg.setItemForEnter(item);
	}
	
	//set_node_for_enter_press($(e.target));
};


var parseArtistsResults = function(r){
	var artists_results = [];
	
	var artists = r.results.artistmatches.artist || false; 
	artists = artists && toRealArray(artists, 'name');
	for (var i=0; i < artists.length; i++) {
		artists_results.push(new artistSuggest(artists[i].name, artists[i].image && artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/')));
	};
	return artists_results;
};


var parseTracksResults = function(r){
	var tracks_results = [];
	var tracks = r.results.trackmatches.track || false; 
	tracks = tracks && toRealArray(tracks, 'name');
	for (var i=0; i < tracks.length; i++) {
		tracks_results.push(    new trackSuggest(tracks[i].artist, tracks[i].name, tracks[i].image && tracks[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'))   );
	};
	return tracks_results;
};


var parseTagsResults = function(r){
	var tags_results = [];
	
	var tags = r.results.tagmatches.tag || false; 
	tags = tags && toRealArray(tags, 'name');
	for (var i=0; i < tags.length; i++) {
		tags_results.push(new tagSuggest(tags[i].name));
	};
	return tags_results;
};
var parseAlbumsResults = function(r){
	var pdr= [];
	var albums =  r.results.albummatches.album || false;
	albums = albums && toRealArray(albums, 'name');
	for (var i=0; i < albums.length; i++) {
		pdr.push(     new albumSuggest(albums[i].artist, albums[i].name, albums[i].image && albums[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'))   );
	};
	return pdr;
}




var fast_suggestion = function(r, q, invstg){
	if (invstg.doesNeed(q)){
		r = parseFastSuggests(r);

		var artists = invstg.g('artists');
			artists.r.append(r.artists);
			artists.renderSuggests();
	
		var tracks = invstg.g('tracks');
			tracks.r.append(r.tracks);
			tracks.renderSuggests();
	
		var tags = invstg.g('tags');
			tags.r.append(r.tags);
			tags.renderSuggests();
			
		var albums = invstg.g('albums');
			albums.r.append(r.albums);
			albums.renderSuggests();
	}
};

var get_fast_suggests = $.debounce(function(q, callback, hash, invstg){
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
	  	invstg.loaded();
	  }
	});
	
	
	
},400);



var parseFastSuggests = function(r){
	
	
	
	var sugg_arts = $filter(r.response.docs, 'restype', 6);
	$.each(sugg_arts, function(i, el){
		sugg_arts[i] = new artistSuggest(
			el.artist, 
			el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false);
	});

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

	
	var sugg_albums = $filter(r.response.docs, 'restype', 8);
	$.each(sugg_albums, function(i, el){
		sugg_albums[i] = new albumSuggest(
			el.artist, 
			el.album, 
			el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false,
			el.resid
		);
	});
	
	
	return {
		artists: sugg_arts,
		tracks: sugg_tracks,
		tags: sugg_tags,
		albums: sugg_albums
	};
};
var getLastfmSuggests = function(method, lfmquery, q, section, parser, no_preview){
	section.loading();
	section.addRequest(
		lfm
			.get(method, cloneObj({limit: 15 }, lfmquery))
				.done(function(r){
					if (!section.doesNeed(q)){return}
					section.loaded();
					r = r && parser(r);
					if (r.length){
						section.r.append(r);
						section.renderSuggests(true, !no_preview);
					} else{
						section.renderSuggests(true, !no_preview);
					}
					
				})
				.fail(function(){
					if (!section.doesNeed(q)){return}
					section.loaded();
				})
			
	);
};

var network_search = seesu.env.cross_domain_allowed ? function(q, invstg){
		invstg.loading();
		var hash = hex_md5(q);
		var cache_used = cache_ajax.get('lfm_fs', hash, function(r){
			if (su.ui.els.search_input.val() != q){return}
			invstg.loaded()
			fast_suggestion(r, q, invstg)
		});
		if (!cache_used) {
			invstg.addRequest(get_fast_suggests(q, function(r){	
				if (su.ui.els.search_input.val() != q){return}
				fast_suggestion(r, q, invstg)
			}, hash, invstg));
			
		}
	} :
	$.debounce(function(q, invstg){
		getLastfmSuggests('artist.search', {artist: q}, q, invstg.g('artists'), parseArtistsResults);
		getLastfmSuggests('track.search', {track: q}, q, invstg.g('tracks'), parseTracksResults);
		getLastfmSuggests('tag.search', {tag: q}, q, invstg.g('tags'), parseTagsResults);	
		getLastfmSuggests('album.search', {album: q}, q, invstg.g('albums'), parseAlbumsResults);
	}, 400);
	
var searchTags = function(q){
	var tags_results = [];
	
	var tags = searchInArray(lastfm_toptags, q);
	for (var i=0; i < tags.length; i++) {
		tags_results.push(new tagSuggest(tags[i]));
	};
	return tags_results;
};
	
var offlineSearch = $.debounce(function(q, invstg){
	var tags = invstg.g('tags');
		tags.r.append(searchTags(q));
		tags.renderSuggests();
},150);



var vkSuggest = function(artist, track, pl){
	this.artist = artist;
	this.track = track;
	this.pl = pl;
}
vkSuggest.prototype = {
	valueOf: function(){
		return this.artist + ' - ' +  this.track;
	}, 
	render: function(){
		if (!this.ui){
			this.ui = {
				c: $('<span class="vk-track-suggest"></span>')
					.text(this.valueOf())
					
			}
			return this.ui.c;
		}
	}
}

var createSeHead = function(){
	return $('<h4></h4>');
};
var createSeRsCon = function(){
	return $('<ul></ul>')
};
var createSeItemCon = function(){
	return $('<li></li>');
};

var vk_suggests = $.debounce(function(query, invstg){
	
	//function(trackname, callback, nocache, hypnotoad, only_cache){
	su.mp3_search.find_files({q: query}, 'vk', function(err, pl, c){
		c.done = true;
		pl = pl && pl[0] && pl[0].t;
		if (pl && pl.length){
			pl = pl.slice(0, 3);
			for (var i=0; i < pl.length; i++) {
				pl[i] = new vkSuggest(pl[i].artist, pl[i].track);
			};
			var vk_tracks = invstg.g('vk')
				vk_tracks.r.append(pl);
				vk_tracks.renderSuggests();
		}
	}, false);
	
	
	
	
},300);

createSuInvestigation = function(c){
	return new investigation(c, function(){
		this.setSectionsSamplesCreators({
			createHead: createSeHead,
			createRsCon: createSeRsCon,
			createItemCon: createSeItemCon
		});
		this.addSection('playlists', playlist_secti);
		this.addSection('artists', artists_secti);
		this.addSection('albums', albs_secti);
		this.addSection('tags', tags_secti);
		this.addSection('tracks', tracks_secti);
		this.addSection('vk', {
			head: 'Vkontakte',
			buttonClick: function(e, section){
				var query = section.r.query;
				if (query) {
					su.ui.show_track({q: query});
				}
			},
			button: function(){
				return $('<button type="submit" name="type" value="vk_track"><span>' + localize('direct-vk-search','Search mp3  directly in vkontakte') +'</span></button>')
			},
			nos: true
		});
	}, function(q){
		if (':playlists'.match(new RegExp('\^' + this.q , 'i'))){
			this.setInactiveAll('playlists');
			var pl_sec = this.g('playlists');
				pl_sec.setActive();
				pl_sec.scratchResults(this.q);
				
			
			var playlists = seesu.gena.playlists;
			var pl_results = [];
			for (var i=0; i < playlists.length; i++) {
				pl_results.push(new playlistSuggest(playlists[i]));
			};
			pl_sec.r.append(pl_results)
			pl_sec.renderSuggests(true);
		} else if (!this.q.match(/^:/)){
			this.setActiveAll('playlists');
			//playlist search
			var playlists = seesu.gena.playlists;
			var pl_results = [];
			for (var i=0; i < playlists.length; i++) {
				var ple = new playlistSuggest(playlists[i]);
				if (playlists[i].playlist_title == this.q){
					pl_results.unshift(ple);
				} else if (playlists[i].playlist_title.match(new  RegExp('\\b' + this.q))){
					 pl_results.push(ple);
				}

			};

			
			if (pl_results.length){
				var pl_sec =  this.g('playlists'); 
				
				pl_sec.setActive();
				pl_sec.r.append(pl_results)
				pl_sec.renderSuggests();
			}
			
			//===playlists search
			offlineSearch(this.q, this)
			network_search(this.q, this);
			vk_suggests(this.q, this);
		}
	}, function(state){
		if (state == 'complete'){
			su.ui.els.search_label.removeClass('loading');
		} else if (state == 'loading'){
			su.ui.els.search_label.addClass('loading');
		}

	}, seesu.ui.els.scrolling_viewport);
};


input_change = function(e, no_navi){
	su.ui.els.search_label.removeClass('loading');
	
	var input = (e && e.target) || e; //e can be EVENT or INPUT  

	var input_value = input.value;
	if (!input_value) {
		su.ui.views.showStartPage();
		return;
	}
	
	su.ui.views.showResultsPage(input_value, no_navi);
};


})();
