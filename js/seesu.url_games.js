if (app_env.needs_url_history) {
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
}

	
navi= {
	history_positions: 0,
	popState: function(url_obj){
		var states = this.findState(url_obj, true);
		if (states && states[0] && states[0] == this.states[this.states.length - 1]){
			return this.states.pop();
		} else{
			//throw 'haarming history'
		}
	},
	pushState: function(oldURL, newURL, d){
		++this.history_positions;
		this.states.push({oldURL:oldURL, newURL:newURL, data: d || {}});
	},
	sliceStates: function(){
		if (this.states.length > this.history_positions){
			this.states = this.states.slice(0, this.history_positions)
		}
	},
	isNewStateAreOld: function(url_obj){

		var sts = this.findNextAndPrevStates(url_obj)
		
		var c = this.history_positions-1;
		if (~sts.prev.indexOf(this.states[c-1])){
			console.log("it's old state")
			--this.history_positions;
			return this.states[c-1];
		} else if (~sts.next.indexOf(this.states[c+1])){
			console.log("it's old new state")
			++this.history_positions;
			return this.states[c+1];
		} else{
			console.log('some new state')
		}
		
		
	},
	findNextAndPrevStates: function(url_obj){
		var next = this.findState(url_obj) || [];
		var prev = this.findState(url_obj, true) || [];
		return {
			next: next,
			prev: prev,
			summ: [].concat(prev, next)
		}
	},
	findState: function(url_obj, inverts_query){
		var r = [];
		for (var i = this.states.length - 1; i >= 0; i--){
			if (inverts_query){
				if (this.states[i].newURL == url_obj.oldURL &&  this.states[i].oldURL == url_obj.newURL){
					if (this.states[i-1]){
						r.push(this.states[i-1]);
					}
					
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
	set: $.debounce(function(u,data){
		if (!app_env.needs_url_history){
			return
		}
		var url = u.replace(/\s/g,'+');
		
		
		if (this.app_hash != url){
			
			this.sliceStates();
			var d = data || {};
			var c = this.fake_current_location;
			
			this.pushState(c, url, d);
			
			
			this.fake_current_location = url;
			
			this.app_hash = url; //supressing hash change handler, must be before location.assign
			try{
				var hash = location.href.indexOf('#');
				var curl;
				if (~hash){
					curl = location.href.slice(0,location.href.indexOf('#'));
				} else{
					curl = location.href;
				}
				location.assign(curl + '#' + url);
			}catch(e){
				
			}
			
			
			
			
			console.log(url);
		}
		
		
		
		
		return
		if (this.app_hash != url){
			
			this.app_hash = url;
		}
		
	},100)
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
		url += '/catalog/_/_';
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
		} else if (stt.subtype =='tracks'){
			puppet_playlist.playlist_type = 'tracks';
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
		if (path_levels[1] && path_levels[1] != '_'){
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
				} else if (path_levels[1] == '_'){
					pvstate.subtype = "tracks";
				}
				
				if (path_levels[4]){
					//current_artist and current_track
					pvstate.current_artist = path_levels[3];
					if (path_levels[4] != '_'){
						pvstate.current_track = path_levels[4];
					}
					
				} else if (path_levels[3]){
					//current_artist and current_track
					if (pvstate.artist_name){
						pvstate.current_artist = pvstate.artist_name;
					}
					
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
function hashchangeHandler(e, force){
	navi.fake_current_location = e.newURL;
	
	if (!force && (!e || e.newURL == navi.app_hash)){
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
		
		
		var state_from_history = navi.isNewStateAreOld(e);
		
		if (state_from_history){
			if (newstate || state_from_history.data.pl){
				console.log(newstate);
				var lev = su.ui.views.findViewOfURL(getUrlOfPlaylist(newstate.plp));
				if (lev){
					if (lev.freezed){
						su.ui.views.restoreFreezed(true);
					}
					if (state_from_history.data.mo || newstate.current_artist || newstate.current_track){
						var pl = lev.context.pl;
						var mo = state_from_history.data.mo;
						if (!mo || !pl.showExactlyTrack(mo, true)){
							var has_track = pl.showTrack({
								artist: newstate.current_artist,
								track: newstate.current_track
							}, true);
						}
						
					} else{
						console.log("will not search track")
					}
					
					return true;
				} else if (state_from_history.data.pl){
					su.ui.views.show_playlist_page(state_from_history.data.pl, false, true);
					if (state_from_history.data.mo || newstate.current_artist || newstate.current_track){
						var pl = state_from_history.data.pl;
						var mo = state_from_history.data.mo;
						if (!mo || !pl.showExactlyTrack(mo, true)){
							var has_track = pl.showTrack({
								artist: newstate.current_artist,
								track: newstate.current_track
							}, true);
						}
						
					} else{
						console.log("will not search track")
					}
					
					
					return true;
				} else{
					console.log('no playlist anywhere')
				}
			} else if (jn.params.q){
				console.log(jn.params);
				if (jo.params.q == jn.params.q){
					console.log('very want to recover')
					var lev = su.ui.views.findSeachResultsOfURL('?q=' + jn.params.q, false, true);
					if (!lev){
						su.ui.search(jn.params.q, true, true);
						return true;
					} else{
						su.ui.views.show_search_results_page(false, true);
						console.log('have somethinf');
					}
				} else{
					console.log('search !')
					su.ui.search(jn.params.q, true, true);
					return true;
				}
			} else{
				if (e.oldURL != e.newURL){
					su.ui.search('', true, true);
					
					return true;
					
				}
				
			} 
		} else{
			console.log('ffff!!11')
			throw "who was that?"
			return
			
			if (newstate){
				var have_anything_history = navi.findNextAndPrevStates(e);
				if (have_anything_history.summ.length){
					
					su.ui.views.show_playlist_page(have_anything_history.summ[0].data.pl, false, true);
					if (newstate.current_artist || newstate.current_track){
						var pl = have_anything_history.summ[0].data.pl;
						var has_track = pl.showTrack({
							artist: newstate.current_artist,
							track: newstate.current_track
						}, true);
						
					} else{
						console.log("will not search track")
					}
					console.log('not too fresh new state');
				} else{
					if (newstate.plp.playlist_type == 'artist'){
						//show_artist(newstate.current_artist, false, true)

					}
					
					console.log('realy fresh  neewwwww state');
				}
			} else if (jn.params.q){
				su.ui.search(jn.params.q, true, true);
			} else if (e.oldURL != e.newURL){
				su.ui.search('', true, true);
				
				return true;
				
			}
			
			
			navi.pushState(e.oldURL, e.newURL);
		}
		
		
		
		
		
		
	}
	
};