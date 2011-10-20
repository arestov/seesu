if (app_env.needs_url_history) {
	if ('onhashchange' in window){
		(function(){
			var hash = location.hash;
			window.onhashchange = function(e){
				var newhash = location.hash;
				if (newhash != hash){
					if (typeof hashchangeHandler == 'function'){
						var hnew = decodeURI(e.newURL || newhash);
						var hold = decodeURI(e.oldURL || hash);
						var have_new_hash = hnew.indexOf('#')+1;
						var have_old_hash = hold.indexOf('#')+1;
						hashchangeHandler({
							newURL: have_new_hash ? hnew.slice(have_new_hash) : '',
							oldURL: have_old_hash ? hold.slice(have_old_hash) : ''
						})
					}
					hash = newhash;
				}
			}
		})()
		
	} else{
		(function(){
			var hash = decodeURI(location.hash);
			setInterval(function(){
				var newhash = decodeURI(location.hash);
				if (newhash != hash){
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash.replace('#',''),
							oldURL: hash.replace('#','')
						});
					}
					
					hash = newhash;
				}
				
			},150)
		})()
	}
}


(function() {
	var getURLBase = function(){
		var cbase;
		if (location.href.indexOf('#') > -1){
			cbase = location.href.slice(0, location.href.indexOf('#'));
		} else{
			cbase = location.href;
		}	
		return cbase;
	};
	var zerofy = function(str, digits){
		str = "" + str;
		if (digits){
			while (str.length < digits){
				str = 0 + str;
			}
		}
		return str;
	};
	var tag_regexp = /\ ?\$...$/;
	navi = {
		counter: Math.round((Math.random() * parseInt('zzz', 36))),
		states_index: {},
		fake_current_url:'',
		setFakeURL: function(url){
			if (this.fake_current_url != url){
				this.fake_current_url = url;
			}
		},
		getFakeURL: function(){
			return 	this.fake_current_url;
		},
		getURLData: function(url){
			var tag 	= (tag = url.match(tag_regexp)) && tag[0],
				uniq_tag = (uniq_tag = (this.counter++).toString(36)) && zerofy(uniq_tag.substring(uniq_tag.length-3, uniq_tag.length), 3),
				uniq_url= tag ? url : url + ' $' + uniq_tag;

			return {
				clear_url: url.replace(tag_regexp, ''),
				tag: tag,
				uniq_tag: uniq_tag,
				uniq_url: uniq_url
			};
		},
		_saveHistory: function(url, data, old_url){
			if (url){
				if (old_url){
					var fud = this.getURLData(this.fake_current_url),
						oud = this.getURLData(old_url),
						replace = fud.clear_url == oud.clear_url;
				}
				
				var ud = this.getURLData(url);
				if (!this.states_index[ud.uniq_url]){
					this.setFakeURL(ud.uniq_url);
					this.states_index[ud.uniq_url] = {
						date: new Date(),
						url: ud.clear_url,
						data: data
					};
					if (!replace){
						location.assign(getURLBase() + '#' + ud.uniq_url);
					} else{
						location.replace(getURLBase() + '#' + ud.uniq_url);
					}
					
				}
			}	
		},
		set: function(url, data){
			this._saveHistory(url, data);
		}, 
		replace: function(oldurl, url, data){
			this._saveHistory(url, data, oldurl);
		},
		findHistory: function(url){
			return this.states_index[url];
		}
		
	};
})();


function getPuppetPlaylistOfViewState(stt){
	if (!stt){
		return false;
	}
	var puppet_playlist ={};
	if (stt.type == 'catalog'){
		if (!stt.subtype){
			if (!stt.album_name){
				puppet_playlist.key = stt.artist_name;
				puppet_playlist.playlist_type = 'artist';
			} else{
				puppet_playlist.key = stt.album_name;
				puppet_playlist.playlist_type = 'album';
			}
		} else if (stt.subtype =='similar'){
			puppet_playlist.key = stt.artist_name;
			puppet_playlist.playlist_type = 'similar artists';
		} else if (stt.subtype =='tracks'){
			puppet_playlist.playlist_type = 'tracks';
		}
	} else if (stt.type == 'tags'){
		puppet_playlist.key = stt.tag_name;
		puppet_playlist.playlist_type = 'artists by tag';
	} else if (stt.type == 'recommendations'){
		
		puppet_playlist.playlist_type = 'artists by recommendations';
	} else if (stt.type == 'loved'){
		
		puppet_playlist.playlist_type = 'artists by loved';
	} else if (stt.type == 'playlist'){
		puppet_playlist.key = stt.current_playlist;
		puppet_playlist.playlist_type = 'cplaylist';
	}
	return puppet_playlist;
};

var getTrackAtristAndName = function(first, second) {
	var ob = {};
	if (second && second.indexOf('+') != 0){
		ob.current_artist = first;
		ob.current_track  = second;
	} else if (first){
		ob.current_track = first;
	}
	return ob;
};
var checkPlstateArtistAndTrack = function(pvstate, splevels, first, second){
	cloneObj(pvstate, getTrackAtristAndName(first, second));
	splevels.addTrackPart(pvstate.current_track, pvstate.current_artist);
};


var statesSkeleton = function(){};
statesSkeleton.prototype = [];
cloneObj(statesSkeleton.prototype, {
	push: function(type){
		var path_parts = Array.prototype.slice.call(arguments, 1);
		this.oldpush({
			type: type,
			p: [''].concat(path_parts).join('/'),
			s: {}
		});
	},
	addTrackPart: function(track, artist){
		if (artist){
			this.push('track', artist, track);
		} else if (track){
			this.push('track', track);
		}
	},
	oldpush: statesSkeleton.prototype.push
});

function getPlayViewStateFromString(n){
	/*
	#/catalog/The+Killers/_/Try me
	#?q=be/tags/beautiful
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Phone+Call
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
	#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
	#/recommendations/Beastie+boys/Phone+Call
	#/loved/Beastie+boys/Phone+Call
	#/radio/artist/The+Killers/similarartist/Bestie+Boys/Intergalactic
	#?q=be/directsearch/vk/345345
	'artists by loved'
	#/ds/vk/25325_2344446
	http://www.lastfm.ru/music/65daysofstatic/+similar
	
	'artists by loved' //no key
	'artists by recommendations' //no key
	'artists by tag' //key is tag
	'similar artists' //key is artist
	'cplaylist' //key is name
	'tracks' //key is q{artist:'', track:''}
	'artist' //key is artist
	'album' //key is album
	*/
	if (!n){return false}
	var splevels = new statesSkeleton();
	
	
	var pvstate = {
		skeleton: splevels
	};
	var path_levels = n.replace(/^\//,'').split('/');
	if (path_levels[0]){
		pvstate.type = path_levels[0];
	}
	if (pvstate.type == 'catalog'){
		if (path_levels[1] && path_levels[1] != '_'){
			pvstate.artist_name = path_levels[1];
		}
		if (path_levels[2]){
			if (path_levels[2].indexOf('+') == 0 && path_levels[2] == '+similar'){
				splevels.push('pl', path_levels[0], path_levels[1], path_levels[2]);
				
				//#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
				pvstate.subtype = 'similar';
				
				//current_artist and current_track
				
				checkPlstateArtistAndTrack(pvstate, splevels, path_levels[3], path_levels[4]);
				
			} else{
				if (path_levels[2] != '_'){
					//#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
					splevels.push('pl', path_levels[0], path_levels[1], path_levels[2]);
					pvstate.album_name = path_levels[2];

				} else if (path_levels[2] == '_'){
					splevels.push('pl', path_levels[0], path_levels[1]);
					//#/catalog/KiEw/_/Doc.Div.
				}
			
				checkPlstateArtistAndTrack(pvstate, splevels, path_levels[3], path_levels[4]);
				
				if (!pvstate.current_artist && pvstate.current_track){
					pvstate.current_artist = pvstate.artist_name;
				}
			}
		}
	} else if (pvstate.type == 'tags'){
		//#/tag/experimental/The+Mars+Volta/Tetragrammaton
		if (path_levels[1]){
			splevels.push('pl', path_levels[0], path_levels[1]);
			pvstate.tag_name = path_levels[1];
			checkPlstateArtistAndTrack(pvstate, splevels, path_levels[2], path_levels[3]);
		} else{
			pvstate.type="";
		}
		
	} else if (pvstate.type == 'recommendations'){
		splevels.push('pl', path_levels[0]);
		//#/recommendations/Austra/Beat+And+The+Pulse+-+Extended+Version
		checkPlstateArtistAndTrack(pvstate, splevels, path_levels[1], path_levels[2]);
	} else if (pvstate.type == 'loved'){
		splevels.push('pl', path_levels[0]);
		checkPlstateArtistAndTrack(pvstate, splevels, path_levels[1], path_levels[2]);
	} else if (pvstate.type == 'playlist'){
		splevels.push('pl', path_levels[0], path_levels[1]);
		if (path_levels[1]){
			pvstate.current_playlist = path_levels[1];
			checkPlstateArtistAndTrack(pvstate, splevels, path_levels[2], path_levels[3]);
		} else{
			pvstate.type="";
		}
		
	} else if (pvstate.type == 'ds'){
		splevels.push('pl', path_levels[0]);
		if (path_levels[1]){
			pvstate.search_type = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.search_id = path_levels[2];
		}
		checkPlstateArtistAndTrack(pvstate, splevels, path_levels[3], path_levels[4]);
	}
	pvstate.plp = getPuppetPlaylistOfViewState(pvstate);
	
	return pvstate;
}
var handleHistoryState =function(e, jo, jn, oldstate, newstate, state_from_history){
	if (newstate.current_artist || newstate.current_track){
		var tk =  {
			artist: newstate.current_artist,
			track: newstate.current_track
		}
	}
	
};
var handleExternalState = function(e, jo, jn, oldstate, newstate){
	if (newstate){
		if (newstate.current_artist || newstate.current_track){
			var tk =  {
				artist: newstate.current_artist,
				track: newstate.current_track
			}
		}
		
			
		

		/*
		'artists by loved' //no key
		'artists by recommendations' //no key
		'artists by tag' //key is tag
		'similar artists' //key is artist
		'cplaylist' //key is name
		'tracks' //key is q{artist:'', track:''}
		'artist' //key is artist
		'album' //key is album
		*/
		
		
		if (newstate.plp.playlist_type){
			if (newstate.plp.playlist_type == 'artist'){
				su.ui.show_artist(newstate.artist_name, false, true, tk);
			} else if (newstate.plp.playlist_type == 'similar artists'){
				render_tracks_by_similar_artists(newstate.artist_name, true, tk) // showSimilarArtists
			} else if (newstate.plp.playlist_type == 'artists by tag'){
				su.ui.show_tag(newstate.tag_name, false, true, tk)
			} else if (newstate.plp.playlist_type == 'cplaylist'){
				if (newstate.current_artist){
					su.ui.show_artist(newstate.current_artist, false, true, tk);
				}
			} else if (newstate.plp.playlist_type == 'artists by recommendations'){
				if (newstate.current_artist){
					su.ui.show_artist(newstate.current_artist, false, true, tk);
				}
			} else if (newstate.plp.playlist_type == 'artists by loved'){
				if (newstate.current_artist){
					su.ui.show_artist(newstate.current_artist, false, true, tk);
				}
				
			} else if (newstate.plp.playlist_type == 'album'){
				//findAlbum(newstate.album_name, newstate.artist_name, true, tk); DEPRICATED
			}
		} else if (newstate.type == 'ds' && newstate.search_type && newstate.search_id){
			getMusicById({type: newstate.search_type, id: newstate.search_id}, tk);			
		} else{
			console.log('can\'t do anything');
		}
		
		console.log('realy fresh  neewwwww state');
		
	}
	
	
	navi.pushState(e.oldURL, e.newURL);
};
var gunm = function(lev){
	var levs = [].concat(lev, lev.parent_levels),
		live_levs = [],
		dead_levs = [];
		
	levs.reverse();
		
	var live_levs = []
	
	for (var i=0; i < levs.length; i++) {
		var cur = levs[i]; 
		if (cur && !dead_levs.length){
			if (cur.canUse()){
				live_levs.push(cur);
			} else{
				var liveclone = cur.getResurrectedClone();
				if (liveclone){
					live_levs.push(liveclone);
				} else{
					dead_levs.push(cur);
				}
				
			}
			
		} else{
			dead_levs.push(cur);
		}
	};
	return {
		live: live_levs,
		dead: dead_levs
	};
	// есть живые предки то восстанавливаем их


};
var hashChangeQueue = new funcs_queue(0);
 

var hashChangeRecover = function(e, jn, newstate, state_from_history){
	console.log(state_from_history)
	if (state_from_history){
		var dl = gunm(state_from_history.data);
		console.log(dl);
	//	dizi = dl;
		if (dl.live.length){
			var deepest = dl.live[dl.live.length -1];
			if (!deepest.isOpened()){
				su.ui.views.restoreFreezed();
			}
			deepest.sliceTillMe();
		} else{
			su.ui.views.showStartPage(true);
		}
		
		if (dl.dead.length){
			for (var i=0; i < dl.dead.length; i++) {
				su.ui.views.m.resurrectLevel(dl.dead[i], i == dl.dead.length - 1);
			};
		}	
	} else{
		console.log(e);
		if (!jn.supported_path.length){
			su.ui.views.showStartPage(true)
		} else{
			
		}
	}
}


var hashChangeReciever = function(e){
	hashChangeQueue.add(function(){
		hashchangeHandler(e);
	});
};

var hashchangeHandler=  function(e, force){
	if (e.newURL != navi.getFakeURL()){
		navi.setFakeURL(e.newURL)
		if (e.oldURL != e.newURL){
			
			var jn = getFakeURLParameters(e.newURL.replace(/([^\/])\+/g, '$1 '));
			
			console.log('newURL: ' + e.newURL);
			var newstate = getPlayViewStateFromString(jn.path);
			var state_from_history = navi.findHistory(e.newURL);
			
			hashChangeRecover(e, jn, newstate, state_from_history);
			
		}
	}
	
	
};

function getMusicById(sub_raw, tk){
	var pl_r = prepare_playlist('Track' , 'tracks', {time: + new Date()});
	su.ui.views.show_playlist_page(pl_r, false, true);
	
	if (sub_raw.type && sub_raw.id){
		su.mp3_search.getById(sub_raw, function(song, want_auth){
			
			if (pl_r.ui){
				if (!song){
					if (want_auth){
						if (sub_raw.type == 'vk'){
							pl_r.ui.ready();
							pl_r.ui.tracks_container.prepend($('<li></li>').append(su.ui.samples.vk_login.clone()));
						} else{
							su.ui.render_playlist(pl_r, true);							
						}
					} else {
						su.ui.render_playlist(pl_r, true);

					}
				} else{
					if (tk){
						if (!song.artist && tk.artist){
							song.artist == tk.artist;
						};
						
						if (!song.track && tk.track){
							song.track == tk.track;
						}
					}
					pl_r.push(song);
					su.ui.render_playlist(pl_r, true);
					viewSong(song, true)
				}
				if (want_auth){
					return true;
				}
				console.log(song)
			} 
			
			
			
	
			
		}, function(){
			return !!pl_r.ui;
		}, function(){
			if (pl_r.ui){
				pl_r.ui.wait();
			}
			
		})
	} else{
		
	}
};



function findAlbum(album_name, artist_name, no_navi, start_song){
	//DEPRICATED
	var pl_r = prepare_playlist((artist_name ? '(' + artist_name + ') ' : '') + album_name ,'album', {original_artist: artist_name, album: album_name}, start_song);
	seesu.ui.views.show_playlist_page(pl_r, false, no_navi || !!start_song );
	lfm('Album.search', {album: album_name}, function(r) {
		if (!r || r.error){
			create_playlist(false, pl_r);
			return
		}
		var res_matches = [];
		var ralbums = [];
		if (r.results.albummatches.album && r.results.albummatches.album.length){
			for (var i=0; i < r.results.albummatches.album.length; i++) {
				ralbums.push(r.results.albummatches.album[i])
			};
		} else if (r.results.albummatches.album){
			ralbums.push(r.results.albummatches.album)
		}
		for (var i=0; i < ralbums.length; i++) {
			var ral = ralbums[i];
			if (album_name.toLowerCase() == ral.name.toLowerCase()  && (!artist_name || ral.artist == artist_name)){
				res_matches.push(ral)
			}
			
		};
		if (res_matches.length){
			get_artist_album_playlist(res_matches[0].id, pl_r)
		} else{
			create_playlist(false, pl_r);
		}
		
		
	});
};