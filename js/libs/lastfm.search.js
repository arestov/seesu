
var parseArtistsResults = function(r, sectionItem){
	var artists_results = [];
	
	var artists = r.results.artistmatches.artist || false; 
	artists = artists && toRealArray(artists, 'name');
	for (var i=0; i < artists.length; i++) {
		artists_results.push(    new sectionItem(artists[i].name, artists[i].image && artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'))    );
	};
	return artists_results;
};


var parseTracksResults = function(r, sectionItem){
	var tracks_results = [];
	var tracks = r.results.trackmatches.track || false; 
	tracks = tracks && toRealArray(tracks, 'name');
	for (var i=0; i < tracks.length; i++) {
		tracks_results.push(    new sectionItem(tracks[i].artist, tracks[i].name, tracks[i].image && tracks[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'))   );
	};
	return tracks_results;
};


var parseTagsResults = function(r, sectionItem){
	var tags_results = [];
	
	var tags = r.results.tagmatches.tag || false; 
	tags = tags && toRealArray(tags, 'name');
	for (var i=0; i < tags.length; i++) {
		tags_results.push(new sectionItem(tags[i].name));
	};
	return tags_results;
};
var parseAlbumsResults = function(r, sectionItem){
	var pdr= [];
	var albums =  r.results.albummatches.album || false;
	albums = albums && toRealArray(albums, 'name');
	for (var i=0; i < albums.length; i++) {
		pdr.push(     new sectionItem(albums[i].artist, albums[i].name, albums[i].image && albums[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'))   );
	};
	return pdr;
};

var getLastfmSuggests = function(method, lfmquery, q, section, parser, no_preview){
	section.loading();
	section.addRequest(
		lfm
			.get(method, cloneObj({limit: 15 }, lfmquery))
				.done(function(r){
					if (!section.doesNeed(q)){return}
					section.loaded();
					r = r && parser(r, section.resItem);
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

var parseFastSuggests = function(r, artistSuggest, trackSuggest, tagSuggest, albumSuggest){
	
	
	
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

var fast_suggestion = function(r, q, invstg){
	if (invstg.doesNeed(q)){
		var artists = invstg.g('artists'),
			tracks = invstg.g('tracks'),
			tags = invstg.g('tags'),
			albums = invstg.g('albums');

		r = parseFastSuggests(r, artists.resItem, tracks.resItem, tags.resItem, albums.resItem);

			artists.r.append(r.artists);
			artists.renderSuggests();
	
			tracks.r.append(r.tracks);
			tracks.renderSuggests();
	
			tags.r.append(r.tags);
			tags.renderSuggests();
		
			albums.r.append(r.albums);
			albums.renderSuggests();
	}
};

var get_fast_suggests = debounce(function(q, callback, hash, invstg){
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



