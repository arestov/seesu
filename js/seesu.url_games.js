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
		if (bN(sts.prev.indexOf(this.states[c-1]))){
			console.log("it's old state")
			--this.history_positions;
			return this.states[c-1];
		} else if (bN(sts.next.indexOf(this.states[c+1]))){
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
			if (bN(url.indexOf('[object+Object]'))){
				throw 'bad url'
			}
			try{
				var hash = location.href.indexOf('#');
				var curl;
				if (bN(hash)){
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
		url += '/catalog/' + (pl.key.original_artist ? pl.key.original_artist + '/' : '_/') + pl.key.album + e;
	} else if (pl.playlist_type == 'similar artists'){
		url += '/catalog/' + pl.key + '/+similar' + e;
	} else if (pl.playlist_type == 'artists by tag'){
		url += '/tag/' + pl.key + e;
	} else if (pl.playlist_type == 'tracks'){
		url += '/ds';
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
	
	var pvstate = {};
	var path_levels = n.replace(/^\//,'').split('/');
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
					pvstate.album_name = path_levels[2];

				} else if (path_levels[1] == '_'){
					pvstate.type = '';
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
			
			//current_artist and current_track
			if (path_levels[2]){
				pvstate.current_artist = path_levels[2];
			}
			if (path_levels[3]){
				pvstate.current_track = path_levels[3];
			}
		} else{
			pvstate.type="";
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
		
		if (path_levels[1]){
			pvstate.current_playlist = path_levels[1];
			
			//current_artist and current_track
			if (path_levels[2]){
				pvstate.current_artist = path_levels[2];
			}
			if (path_levels[3]){
				pvstate.current_track = path_levels[3];
			}
		} else{
			pvstate.type="";
		}
		
	} else if (pvstate.type == 'ds'){
		if (path_levels[1]){
			pvstate.search_type = path_levels[1];
		}
		if (path_levels[2]){
			pvstate.search_id = path_levels[2];
		}
		if (path_levels[3]){
			pvstate.current_artist = path_levels[3];
		}
		if (path_levels[4]){
			pvstate.current_track = path_levels[4];
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
	} else if (e.oldURL != e.newURL){
		navi.app_hash = e.newURL;
		
		var jo = getFakeURLParameters(e.oldURL.replace(/([^\/])\+/g, '$1 '));
		var jn = getFakeURLParameters(e.newURL.replace(/([^\/])\+/g, '$1 '));
		
		console.log('newURL: ' + e.newURL);
		var oldstate = getPlayViewStateFromString(jo.path);
		var newstate = getPlayViewStateFromString(jn.path);
		
		
		var state_from_history = navi.isNewStateAreOld(e);
		
		if (state_from_history){
			if (newstate || state_from_history.data.pl){
				console.log(newstate);
				var lev = su.ui.views.findViewOfURL(getUrlOfPlaylist(newstate.plp));
				if (lev){
					var pl = lev.context.pl;
					if (lev.freezed){
						su.ui.views.restoreFreezed(true);
					} else if (pl){
						su.ui.views.show_playlist_page(pl, false, true);
						
					}
					if (state_from_history.data.mo || newstate.current_artist || newstate.current_track){
						
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
						
					} else {
						console.log("will not search track")
					}
					console.log('not too fresh new state');
				} else{
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
					
					if (newstate.current_artist || newstate.current_track){
						var tk =  {
							artist: newstate.current_artist,
							track: newstate.current_track
						}
					}
					
					
					if (newstate.plp.playlist_type == 'artist'){
						
						su.ui.show_artist(newstate.artist_name, false, true, tk);
						//show_artist(newstate.current_artist, false, true)
					} else if (newstate.plp.playlist_type == 'similar artists'){
						render_tracks_by_similar_artists(newstate.artist_name, true, tk)
						
					} else if (newstate.plp.playlist_type == 'artists by tag'){
						su.ui.show_tag(newstate.tag_name, false, true, tk)
					} else if (newstate.plp.playlist_type == 'cplaylist'){
						if (newstate.current_artist){
							su.ui.show_artist(newstate.current_artist, false, true, tk);
						}
							
						/*
						var uplst = su.gena.playlists.find(newstate.plp);
						if (su.gena){
							
						} else{
							
							
						}*/
						
						
					} else if (newstate.plp.playlist_type == 'artists by recommendations'){
						
						if (newstate.current_artist){
							su.ui.show_artist(newstate.current_artist, false, true, tk);
						}
						
					} else if (newstate.plp.playlist_type == 'artists by loved'){
						if (newstate.current_artist){
							su.ui.show_artist(newstate.current_artist, false, true, tk);
						}
						
					} else if (newstate.plp.playlist_type == 'album'){
						findAlbum(newstate.album_name, newstate.artist_name, true, tk);
					} else if (newstate.type == 'ds' && newstate.search_type && newstate.search_id){
						getMusicById({type:newstate.search_type, id:newstate.search_id}, tk);			
					} else{
						console.log('can\'t do anythifg');
					}
					
					console.log('realy fresh  neewwwww state');
				}
			} else if (jn.params.q){
				su.ui.search(jn.params.q, true, true);
			} else if (e.newURL == ''){
				su.ui.search('', true, true);
				
				return true;
				
			}
			
			
			navi.pushState(e.oldURL, e.newURL);
		}
		
		
		
		
		
		
	}
	
};

function getMusicById(sub_raw, tk){
	var pl_r = prepare_playlist('Track' , 'tracks', + new Date());
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