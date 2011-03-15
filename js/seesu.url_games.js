if ('onhashchange' in window){
	window.onhashchange = function(e){
		if (typeof hashchangeHandler == 'function'){
			var have_new_hash = e.newURL.indexOf('#')+1;
			var have_old_hash = e.oldURL.indexOf('#')+1;
			hashchangeHandler({
				newURL: have_new_hash ? e.newURL.slice(have_new_hash) : '',
				oldURL: have_old_hash ? e.oldURL.slice(have_old_hash) : ''
			})
		}
		
	}
} else{
	(function(){
		var hash = location.hash;
		setInterval(function(){
			var newhash = location.hash;
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
	
navi= {
	popState: function(url_obj){
		var states = this.findState(url_obj, true);
		if (states && states[0] && states[0] == this.states[this.states.length - 1]){
			return this.states.pop();
		} else{
			//throw 'haarming history'
		}
	},
	findState: function(url_obj, inverts_query){
		var r = [];
		for (var i = this.states.length - 1; i >= 0; i--){
			if (inverts_query){
				if (this.states[i].newURL == url_obj.oldURL &&  this.states[i].oldURL == url_obj.newURL){
					r.push(this.states[i]);
				}
			} else{
				if (this.states[i].newURL == url_obj.newURL &&  this.states[i].oldURL == url_obj.oldURL){
					r.push(this.states[i]);
				}
			}
			
		};
		return r.length && r;
	},
	fake_current_location:'',
	states:[],
	app_hash: '',
	set: function(u,data){
		var url = u.replace(/\s/g,'+');
		
		
		if (this.app_hash != url){
			
			
			
			var d = data || {};
			var c = this.fake_current_location;
			this.states.push({oldURL:c, newURL:url, data: d});
			this.fake_current_location = url;
			
			this.app_hash = url; //supressing hash change handler, must be before location.assign
			location.assign('#' + url);
			
			
			
			
			console.log(url);
		}
		
		
		
		
		return
		if (this.app_hash != url){
			
			this.app_hash = url;
		}
		
	}	
};
	
	
	

function getUrlOfPlaylist(pl, end){
	var e = end || "";
	var url ='';
	if (pl.playlist_type == 'artist'){
		url += '/catalog/' + pl.key + (e && '/_' + e);
	} else if (pl.playlist_type == 'album'){
		url += '/catalog/_/' + pl.key + e;
	} else if (pl.playlist_type == 'similar artists'){
		url += '/catalog/' + pl.key + '/+similar' + e;
	} else if (pl.playlist_type == 'artists by tag'){
		url += '/tag/' + pl.key + e;
	} else if (pl.playlist_type == 'tracks'){
		url += '/catalog/_/_' + pl.key;
	} else if (pl.playlist_type == 'artists by recommendations'){
		url += '/recommendations' + e;
	} else if (pl.playlist_type == 'artists by loved'){
		url += '/loved' + e;
	} else if (pl.playlist_type == 'cplaylist'){
		url += '/playlist/' + pl.key + e;
	}
	return url;
};
function getPuppetPlaylistOfViewState(stt){
	if (!stt){
		return false;
	}
	var puppet_playlist ={};
	if (stt.type == 'catalog'){
		if (!stt.subtype){
			if (!stt.album){
				puppet_playlist.key = stt.artist_name;
				puppet_playlist.playlist_type = 'artist';
			} else{
				puppet_playlist.key = stt.album;
				puppet_playlist.playlist_type = 'album';
			}
		} else if (stt.subtype =='similar'){
			puppet_playlist.key = stt.artist_name;
			puppet_playlist.playlist_type = 'similar artists';
		}
	} else if (stt.type == 'tag'){
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
function getPlayViewStateFromString(n){
	/*
	#?q=be/tag/beautiful
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Phone+Call
	#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
	#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
	#/recommendations/Beastie+boys/Phone+Call
	#/loved/Beastie+boys/Phone+Call
	#/radio/artist/The+Killers/similarartist/Bestie+Boys/Intergalactic
	#?q=be/directsearch/vk/345345
	'artists by loved'
	
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
	
	var pvstate = {};
	var path_levels = n.replace(/\+(?!^)/g, ' ').replace(/^\//,'').split('/');
	if (path_levels[0]){
		pvstate.type = path_levels[0];
	}
	if (pvstate.type == 'catalog'){
		if (path_levels[1]){
			pvstate.artist_name = path_levels[1];
		}
		
		
		
		if (path_levels[2]){
			if (path_levels[2].indexOf('+') == 0){
				if (path_levels[2] == '+similar'){
					pvstate.subtype = 'similar';
					if (path_levels[3]){
						//current_artist and current_track
						pvstate.current_artist = path_levels[3];
					}
					if (path_levels[4]){
						pvstate.current_track = path_levels[4];
					}
					
				}
				
				
			} else{
				if (path_levels[2] != '_'){
					pvstate.album = path_levels[2];
				}
				
				if (path_levels[4]){
					//current_artist and current_track
					pvstate.current_artist = path_levels[3];
					if (path_levels[4] != '_'){
						pvstate.current_track = path_levels[4];
					}
					
				} else if (path_levels[3]){
					//current_artist and current_track
					pvstate.current_artist = pvstate.artist_name;
					pvstate.current_track = path_levels[3];
				}
			}
		}
	} else if (pvstate.type == 'tag'){
		if (path_levels[1]){
			pvstate.tag_name = path_levels[1];
		}
		//current_artist and current_track
		if (path_levels[2]){
			pvstate.current_artist = path_levels[2];
		}
		if (path_levels[3]){
			pvstate.current_track = path_levels[3];
		}
	} else if (pvstate.type == 'recommendations'){
		
		//current_artist and current_track
		if (path_levels[1]){
			pvstate.current_artist = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.current_track = path_levels[2];
		}
	} else if (pvstate.type == 'loved'){
		//current_artist and current_track
		if (path_levels[1]){
			pvstate.current_artist = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.current_track = path_levels[2];
		}
	} else if (pvstate.type == 'playlist'){
		//current_artist and current_track
		if (path_levels[1]){
			pvstate.current_playlist = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.current_artist = path_levels[2];
		}
		if (path_levels[3]){
			pvstate.current_track = path_levels[3];
		}
	} else if (pvstate.type == 'directsearch'){
		if (path_levels[1]){
			pvstate.search = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.search_type = path_levels[2];
		}
		if (path_levels[3]){
			pvstate.search_id = path_levels[3];
		}
		if (path_levels[4]){
			pvstate.current_artist = path_levels[4];
		}
		if (path_levels[5]){
			pvstate.current_track = path_levels[5];
		}
	}
	pvstate.plp = getPuppetPlaylistOfViewState(pvstate);
	return pvstate;
}
function hashchangeHandler(e){
	if (!e || e.newURL == navi.app_hash){
		//console.log('manual change to:')
		//console.log(e);
		return false;
	} else{
		navi.app_hash = e.newURL;
		
		var jo = get_url_parameters(e.oldURL.replace(/\+/g,' '));
		var jn = get_url_parameters(e.newURL.replace(/\+/g,' '));
		
		console.log('newURL: ' + e.newURL);
		var oldstate = getPlayViewStateFromString(jo.path);
		var newstate = getPlayViewStateFromString(jn.path);
		
		
		var moving_back = navi.popState(e);
		
		
		if (newstate){
			console.log(newstate);
			var lev = su.ui.views.findViewOfURL(getUrlOfPlaylist(newstate.plp));
			if (lev){
				if (lev.freezed){
					su.ui.views.restoreFreezed(true);
				}
				if (newstate.current_artist || newstate.current_track){
					lev.context.pl.showTrack({
						artist: newstate.current_artist,
						track: newstate.current_track
					}, true);
				} else{
					console.log("can't find")
				}
				
				return true;
			} else{
				console.log('must create playlist ui')
				return true;
			}
		} else if (jn.params.q){
			console.log(jn.params);
			if (moving_back && jo.params.q == jn.params.q){
				console.log('very want to recover')
				var lev = su.ui.views.findSeachResultsOfURL('?q=' + jn.params.q, false, true);
				if (!lev){
					su.ui.search(jn.params.q);
					return true;
				} else{
					su.ui.views.show_search_results_page(false, true);
					console.log('have somethinf');
				}
			} else{
				console.log('search !')
				su.ui.search(jn.params.q);
				return true;
			}
		} else{
			if (e.oldURL != e.newURL){
				su.ui.search('');
				
				return true;
				//su.ui.views.show_start_page(true);
			}
			
		} 
		
		
		
		
		
	}
	
};