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
		getUniqId: function(){
			var uniq_tag = (uniq_tag = (this.counter++).toString(36)) && zerofy(uniq_tag.substring(uniq_tag.length-3, uniq_tag.length), 3);
			return uniq_tag;
		},
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
				uniq_tag = this.getUniqId(),
				uniq_url= tag ? url : url + ' $' + uniq_tag;

			return {
				clear_url: url.replace(tag_regexp, ''),
				tag: tag,
				uniq_tag: uniq_tag,
				uniq_url: uniq_url
			};
		},
		_saveHistory: function(url, data, old_url){
		
			var fakeud = this.getURLData(this.fake_current_url);
			
			if (old_url){
				
				var oldud = this.getURLData(old_url),
					replace = fakeud.clear_url == oldud.clear_url;
			}
			
			var ud = this.getURLData(url);
			if ((fakeud.clear_url !=  ud.clear_url) || replace){
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

var getTrackAtristAndName = function(path, artist) {
	var path_step = path.shift(),
		next_step = path[0],
		ob = {},
		done;
	
	if (next_step && next_step.indexOf('+') != 0){
		done = true;
		path.shift();
		ob.current_artist = path_step;
		ob.current_track  = next_step;
	} else if (path_step && artist){
		done = true;
		ob.current_track = path_step;
		if (artist){
			ob.current_artist = artist;
		}
	}
	return done && ob;
};
var checkPlstateArtistAndTrack = function(pvstate, splevels, first, second){
	
};

var pathData = function(){
	this.p = [];
};
pathData.prototype = {
	add: function(type, data){
		this.p.push({
			type: type,
			data: data
		});
	}
}

var url_parser = {
	parse: function(pth_string){
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
		*/
		var pth = pth_string.replace(/^\//,'').split('/');
		var con = new pathData();
		switch (pth.shift()) {
			case 'catalog':
				this.getCatalogData(pth, con)
				break
			case 'tags':
				this.getTagData(pth, con)
				break
			case 'recommendations':
				this.getRecommendationsData(pth, con)
				break
			case 'loved':
				this.getLovedData(pth, con)
				break
			case 'playlist':
				this.getCustomPlaylistData(pth, con)
				break
			case 'ds': this.getDirectSearchData(pth, con)
				break
			case 'charts':
				this.getChartData(pth, con)
				break
			default:
				;
		}
		return con.p;
	},
	getCatalogData: function(pth, con){
		var artist;
		var artcard = pth.shift();
		
		if (artcard){
			if (artcard != '_'){
				con.add('artcard', {artist: (artist = artcard)});
			} else{
				
			}
			
			var playlist = pth.shift();
			if (playlist){
				if (playlist.indexOf('+') == 0 && playlist == '+similar'){
					//#/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
					con.add('pl', {
						artist: artist,
						type: 'similar',
						pltype: 'similar artists'
					});
					
					//current_artist and current_track
					var current_music = getTrackAtristAndName(pth, artist);
					if (current_music){
						con.add('track', current_music);
					}
					
				} else{
					if (playlist != '_'){
						//#/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
						con.add('pl', {
							artist: artist,
							type: 'album',
							pltype: 'album',
							album_name: playlist
						});
						
	
					} else {
						//best tracks
						con.add('pl', {
							artist: artist,
							type: 'top',
							pltype: 'artist'
						});
						//#/catalog/KiEw/_/Doc.Div.
					}
				
					var current_music = getTrackAtristAndName(pth, artist);
					if (current_music){
						con.add('track', current_music);
					}
					
					
				}
			}
			
		}

	},
	getTagData: function(pth, con){
		//#/tags/experimental/The+Mars+Volta/Tetragrammaton
		var tag = pth.shift();
		if (tag){
			con.add('pl', {
				tag_name: tag,
				type: 'tag',
				pltype: 'artists by tag'
			});
			
			var current_music = getTrackAtristAndName(pth);
			if (current_music){
				con.add('track', current_music);
			}
		} 
	},
	getChartData: function(pth, con){
		
	},
	getRecommendationsData: function(pth, con){
		con.add('pl', {
			type: 'recommendations',
			pltype: 'artists by recommendations'
		});
		
		var current_music = getTrackAtristAndName(pth);
		if (current_music){
			con.add('track', current_music);
		}
	},
	getCustomPlaylistData: function(pth, con){
		var playlist_name = pth.shift();
		if (playlist_name){
			con.add('pl', {
				type: 'cplaylist',
				playlist_name: playlist_name,
				pltype: 'cplaylist'
			});
		}
		
		var current_music = getTrackAtristAndName(pth);
		if (current_music){
			con.add('track', current_music);
		}
	},
	getLovedData: function(pth, con){
		con.add('pl', {
			type: 'loved',
			pltype: 'artists by loved'
		});
		var current_music = getTrackAtristAndName(pth);
		if (current_music){
			con.add('track', current_music);
		}
	},
	getDirectSearchData: function(pth, con){
		
		
		splevels.push('pl', pth[0]);
		if (pth[1]){
			pvstate.search_type = pth[1];
		}
		if (pth[2]){
			pvstate.search_id = pth[2];
		}
		checkPlstateArtistAndTrack(pvstate, splevels, pth[3], pth[4]);
	}
}


var handleHistoryState =function(e, jo, jn, oldstate, newstate, state_from_history){
	if (newstate.current_artist || newstate.current_track){
		var tk =  {
			artist: newstate.current_artist,
			track: newstate.current_track
		}
	}
	
};
var getFakeURLParameters = function(str){
	var divider = str.indexOf('/');
	if (bN(divider)){
		var search_part = str.slice(0, divider);
		var path_part = str.slice(divider + 1);
	} else{
		var search_part = str;
	}
	var params = (search_part && get_url_parameters(search_part)) || {};
	
	var sp = [];
	if (params.q){
		sp.push({
			type: 'search',
			data: {
				query: params.q
			}
		});
	}
	
	if (path_part){
		sp = sp.concat(url_parser.parse(path_part));
	}
	
	
	return {params:params || {}, path: path_part || '', tree: sp};
	
	
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
var recoverPlaylistBranch = function(pldata, songdata, has_artcard){
	if (songdata && songdata.current_track && songdata.current_artist){
		var start_song = {artist: songdata.current_artist, track: songdata.current_track}
	};
	
	console.log(pldata)
	switch (pldata.type) {
		case 'similar':
			su.ui.showSimilarArtists(pldata.artist, {no_navi: true, from_artcard: has_artcard, save_parents: true}, songdata);
			//this.getCatalogData(pth, con)
			break
		case 'album':
			su.ui.showAlbum({
				album_name: pldata.album_name,
				artist: pldata.artist
			}, {no_navi: true, from_artcard: has_artcard, save_parents: true}, start_song);
			//su.ui.showAlbum(pldata.artist, pldata.album_name, this.aid, false, true);
			//this.getTagData(pth, con)
			break
		case 'top':
			su.ui.showTopTacks(pldata.artist, {no_navi: true, from_artcard: has_artcard, save_parents: true}, start_song);
			//this.getRecommendationsData(pth, con)		
			break
		case 'tag':
			su.ui.show_tag(pldata.tag_name, {no_navi: true, save_parents: true}, start_song);
			//this.getLovedData(pth, con)
			break
		case 'recommendations':
			if (start_song.artist){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			//this.getLovedData(pth, con)
			break
		case 'cplaylist':
			if (start_song.artist){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			//this.getLovedData(pth, con)
			break
		case 'loved':
			if (start_song.artist){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			//this.getLovedData(pth, con)
			break
		default:
			;
	}
};

var recoverHistoryTreeBranch = function(branch, sub_branch, prev_branch){
	var sub_branch_handled;
	switch (branch.type) {
		case 'search':
			//this.getCatalogData(pth, con);
			su.ui.views.showResultsPage(branch.data.query, true);
			break
		case 'artcard':
			//this.getTagData(pth, con);
			su.ui.views.showArtcardPage(branch.data.artist, true, true);
			break
		case 'pl':
			//this.getRecommendationsData(pth, con)
			var song;
			
			if (sub_branch && sub_branch.type == 'track'){
				song = sub_branch.data;
				sub_branch_handled = true;
			}
			recoverPlaylistBranch(branch.data, song, prev_branch.type == 'artcard')

			
			break
		case 'track':
			//this.getLovedData(pth, con)
			break
		default:
			;
	}
	return sub_branch_handled;
};


var hashChangeQueue = new funcs_queue(0);
 

var hashChangeRecover = function(e){
	
	var state_from_history = navi.findHistory(e.newURL);
	if (state_from_history){
		var dl = gunm(state_from_history.data);

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
		var jn = getFakeURLParameters(e.newURL.replace(/([^\/])\+/g, '$1 ').replace(/\ ?\$...$/, ''));
		su.ui.views.showStartPage(true);
		if (jn.tree.length){
			var prev_branch;
			while (jn.tree.length) {
				var branch = jn.tree.shift();
				var subhed = recoverHistoryTreeBranch(branch, jn.tree[0], prev_branch);
				if (subhed){
					jn.tree.shift();
				}
				prev_branch = branch;
			}
			
			
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
			hashChangeRecover(e);
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