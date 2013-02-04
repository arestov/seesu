if (app_env.needs_url_history) {
	if ('onhashchange' in window){
		(function(){
			var hash = location.hash.replace(/^\#/, '');
			window.onhashchange = function(e){
				e = e || window.Event;
				var newhash = location.hash.replace(/^\#/, '');
				if (newhash != hash){
					var hnew = e.newURL || newhash;
					var hold = e.oldURL || hash;
					var have_new_hash = hnew.indexOf('#')+1;
					var have_old_hash = hold.indexOf('#')+1;

					var o = {
						newURL: have_new_hash ? hnew.slice(have_new_hash) : '',
						oldURL: have_old_hash ? hold.slice(have_old_hash) : ''
					};


					var too_fast_hash_change = (o.newURL != newhash);
					if (!too_fast_hash_change){
						if (typeof hashchangeHandler == 'function'){
							hashchangeHandler(o);
						}
						hash = newhash;
					}
					
				}
			}
		})()
		
	} else{
		(function(){
			var hash = location.hash;
			setInterval(function(){
				var newhash = location.hash;
				if (newhash != hash){
					if (typeof hashchangeHandler == 'function'){
						hashchangeHandler({
							newURL: newhash.replace(/^\#/, ''),
							oldURL: hash.replace(/^\#/, '')
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
			var tags		= (tag = url.match(tag_regexp)) && tag[0],
				clear_url	= url.replace(tag_regexp, ''),
				uniq_url	= url + (tag || (' $' + this.getUniqId()));

			return {
				clear_url: clear_url,
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
}

var getTrackAtristAndName = function(path, artist) {
	var path_step = path.shift(),
		next_step = path[0],
		ob = {},
		done;
	
	if (next_step && next_step.indexOf('+') !== 0){
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
};




/*
catalog
users
tags
*/
var separatePathParts = function(pth) {
	for (var i = 0; i < pth.length; i++) {
		pth[i] = {
			original_part: pth[i].replace(/([^\/])\+/g, '$1 ')
		};
	}
	return pth;
};

var routePath = function(pth_string, route_tree) {
	var pth = pth_string.replace(/([^\/])\+/g, '$1 ')/*.replace(/^\//,'')*/.split('/');
	//
	//separatePathParts(pth);
	

	var cur_brch = route_tree; //current_branch
	var created_md;

	var full_path = [];

	for (var i = 0; i < pth.length; i++) {
		var cur = pth[i];
		var path_opts;
		var path_name;
		
		if (cur_brch.parse_opts){
			var path_name_parts = cur.split('?');
			path_name = path_name_parts[0];
			if (path_name_parts[1]){
				path_opts = get_url_parameters(path_name_parts[1], true);
			}
		} else {
			path_name = cur;
		}
		var selected_path;

		if (cur_brch && cur_brch.names && cur_brch.names[path_name]){
			selected_path = cur_brch.names[path_name];
		} else if (cur_brch.other){
			selected_path = cur_brch.other;
		}

		if (!selected_path){
			break;
		} else {
			full_path.push({

				selected_path: selected_path,
				path_name: decodeURIComponent(path_name),
				path_opts: path_opts || {},
				sub_paths: pth.slice(i+1)
			});
			cur_brch = selected_path.branch;
			//if (selected_path.fn){

			//}

		}
		//
		//pth[i]

	}
	return full_path;
};
var routeAppByPath = function(full_path) {
	var result;
	for (var i = 0; i < full_path.length; i++) {
		var cur = full_path[i];
		if (cur.selected_path.fn){
			result = cur.selected_path.fn(cur.path_name, cur.path_opts, cur.sub_paths, result);
		}
	}
};

//var



var route_tree = {
	//before first flash (#?q=be/tags/beautiful) ----- ?q=be
	parse_opts: true,
	other: {
		fn: function(path_name, opts) {
			su.showStartPage(true);
			if (opts.query){
				return su.showResultsPage(opts.query, true);
			} else {
				return su.start_page;
			}
		},
		branch: {//next
			names: {
				'catalog': {
					branch: {
						other: {
							fn: function(path_name, opts, sub_paths, parent_md) {
								//artist name
								return su.showArtcardPage(path_name, {
									page_md: parent_md
								}, true);
							},
							branch: {
								names: {
									'_': {
										fn: function(path_name, opts, sub_paths, parent_md) {
											var track_name = sub_paths && sub_paths[0];
											parent_md.showTopTacks({
												no_navi: true
											}, track_name);
										}
									},
									'+similar': {
										fn: function(path_name, opts, sub_paths, parent_md) {
											parent_md.showSimilarArtists({
												no_navi: true
											});
										},
										branch: {
											names: {
												'~': {
													fn: function() {

													}
												}
											}
										}
									}
								},
								other: {
									//albums
									fn: function(path_name, opts, sub_paths, parent_md) {
										parent_md.showAlbum(path_name, {
											no_navi: true
										});
									},
									branch: {
										other: {
											//artist name and track
											fn: function() {

											}
										}
									}
								}
							}
						}
					}
				},
				'tags': {
					branch: {
						other: {
							fn: function() {

							},
							branch: {
								names: {
									'songs': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {

												}
											}
										}
									},
									'artists': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {

												},
												'week': {

												}
											}
										}

									},
									'albums': {
										fn: function() {

										},
										branch: {
											names: {
												'_': {
													fn: function() {

													}
												}
											}
										}
									},
									'tags': {
										fn: function() {

										}
									}
								}
							}
						}
					}
				},
				'users': {
					branch: {
						name: {
							'me': {
								fn: function() {

								},
								branch: {
									names: {
										'recommendations': {

										},
										'loved': {

										}
									}
								}
							}
						},
						other: {
							fn: function() {

							}
						}
					}
				}
			}
		}
	}
};

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
		//
		for (var i = 0; i < pth.length; i++) {
			pth[i] = decodeURIComponent(pth[i].replace(/([^\/])\+/g, '$1 '));
		}

		var con = new pathData();
		switch (pth.shift()) {
			case 'catalog':
				this.getCatalogData(pth, con);
				break;
			case 'tags':
				this.getTagData(pth, con);
				break;
			case 'recommendations':
				this.getRecommendationsData(pth, con);
				break;
			case 'loved':
				this.getLovedData(pth, con);
				break;
			case 'playlist':
				this.getCustomPlaylistData(pth, con);
				break;
			case 'ds': this.getDirectSearchData(pth, con);
				break;
			case 'chart':
				this.getChartData(pth, con);
				break;
			default:
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
		var country = pth.shift();
		var metro = pth.shift();

		if (country && metro){
			con.add('pl', {
				country: country,
				metro: metro,
				type: 'chart'
			});
			var current_music = getTrackAtristAndName(pth);
			if (current_music){
				con.add('track', current_music);
			}
		}
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
		var source = pth.shift();
		var id = pth.shift();
		if (source && id){
			con.add('pl', {
				type: 'directsearch',
				source: source,
				rawid: id
			});
		}
	}
};

var handleHistoryState =function(e, jo, jn, oldstate, newstate, state_from_history){
	if (newstate.current_artist || newstate.current_track){
		var tk =  {
			artist: newstate.current_artist,
			track: newstate.current_track
		};
	}
	
};
var getFakeURLParameters = function(str){
	var divider = str.indexOf('/');
	if (divider != -1){
		var search_part = str.slice(0, divider);
		var path_part = str.slice(divider + 1);
	} else{
		var search_part = str;
	}
	var params = (search_part && get_url_parameters(search_part, true)) || {};
	
	var sp = [];
	if (params.q){
		sp.push({
			type: 'search',
			data: {
				query: decodeURIComponent(params.q)
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
		
	var live_levs = [];
	
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
	}
	return {
		live: live_levs,
		dead: dead_levs
	};
	// есть живые предки то восстанавливаем их


};

var recoverPlaylistBranch = function(pldata, parent_md, songdata, has_artcard){
	if (songdata && songdata.current_track && songdata.current_artist){
		var start_song = {artist: songdata.current_artist, track: songdata.current_track}
	};
	
	console.log(pldata)
	switch (pldata.type) {
		case 'similar':
			su.showSimilarArtists(pldata.artist, {
				no_navi: true, 
				from_artcard: has_artcard,
				source_info: parent_md && {
					page_md: parent_md,
					source_name: has_artcard && 'similar-artists',
				},
			}, songdata);
			break
		case 'album':
			su.showAlbum({
				album_name: pldata.album_name,
				artist: pldata.artist
			}, {
				no_navi: true, 
				from_artcard: has_artcard, 
				source_info: parent_md && {
					page_md: parent_md,
					source_name: has_artcard && 'artist-albums',
				},
			}, start_song);
			break
		case 'top':
			su.showTopTacks(pldata.artist, {
				no_navi: true, 
				from_artcard: has_artcard,
				source_info: parent_md && {
					page_md: parent_md,
					source_name: has_artcard && 'top-tracks'
				}
			}, start_song);
			break
		case 'tag':
			su.show_tag(pldata.tag_name, {
				no_navi: true, 
				source_info: parent_md && {
					page_md: parent_md
				}
			}, start_song);
			break
		case 'recommendations':
			if (start_song){
				su.showTopTacks(start_song.artist, {
					no_navi: true, 
					from_artcard: has_artcard,
					source_info: parent_md && {
						page_md: parent_md
					}
				}, start_song);
			}
			break
		case 'cplaylist':
			if (start_song){
				su.showTopTacks(start_song.artist, {
					no_navi: true,
					from_artcard: has_artcard,
					source_info: parent_md && {
						page_md: parent_md
					}
				}, start_song);
			}
			break
		case 'chart':
			if (start_song){
				su.showTopTacks(start_song.artist, {
					no_navi: true,
					from_artcard: has_artcard,
					source_info: parent_md && {
						page_md: parent_md
					}
				}, start_song);
			} else{
				su.showMetroChart(pldata.country, pldata.metro, {
					no_navi: true, 
					source_info: parent_md && {
						page_md: parent_md
					}
				}); //fghjfghj
			}
			break
		case 'loved':
			if (start_song){
				su.showTopTacks(start_song.artist, {
					no_navi: true,
					from_artcard: has_artcard,
					source_info: {
						page_md: parent_md
					}
				}, start_song);
			}
			break
		default:
			;
	}
};
var history_btypes = {
	'search': function(branch, build_result, sub_branch, prev_branch) {
		return su.showResultsPage(branch.data.query, true);
	},
	'artcard': function(branch, build_result, sub_branch, prev_branch) {
		return su.showArtcardPage(branch.data.artist, build_result && {
			page_md: build_result
		}, true);
	},
	'pl': function(branch, build_result, sub_branch, prev_branch) {
		var song;
			
		if (sub_branch && sub_branch.type == 'track'){
			song = sub_branch.data;
			sub_branch.done = true;
			//sub_branch_handled = true;
		}
		return recoverPlaylistBranch(branch.data, build_result, song, prev_branch && prev_branch.type == 'artcard')

	},
	'track': function(branch, sub_branch, prev_branch) {

	}
};

var recoverHistoryTreeBranch = function(branch, build_result, sub_branch, prev_branch){
	var handler = history_btypes[branch.type];

	return handler ? handler.call(this, branch, build_result, sub_branch, prev_branch) : false;
};


var hashChangeQueue = new funcsQueue(0);
 

var hashChangeRecover = function(e, soft){
	var url = e.newURL;

	su.map.startChangesCollecting();

	var state_from_history = navi.findHistory(e.newURL);
	if (state_from_history){
		var dl = gunm(state_from_history.data);

		if (dl.live.length){
			var deepest = dl.live[dl.live.length -1];
			if (!deepest.isOpened()){
				su.restoreFreezed(!!dl.dead.length, true);
			}
			deepest.sliceTillMe(!!dl.dead.length, true);
		} else{
			su.showStartPage(true);
		}
		
		if (dl.dead.length){
			for (var i=0; i < dl.dead.length; i++) {
				su.map.resurrectLevel(dl.dead[i], i != dl.dead.length - 1, true );
			};
		}	
	} else{
		var jn = getFakeURLParameters(url.replace(/\ ?\$...$/, ''));
		if (!jn.tree.length){
			if (!soft){
				su.showStartPage(true);
			}
		} else {
			su.showStartPage(true);
			var prev_branch;
			var build_result = su.start_page;
			while (jn.tree.length) {
				var branch = jn.tree.shift();
				if (!branch.done){
					build_result = recoverHistoryTreeBranch(branch, build_result, jn.tree[0], prev_branch);
				} else {
					build_result = branch.build_result;
				}
				prev_branch = branch;
			}
		}
	}
	
	su.map.finishChangesCollecting();
}


var hashChangeReciever = function(e){
	hashChangeQueue.add(function(){
		hashchangeHandler(e);
	});
};

var hashchangeHandler=  function(e, soft){
	if (e.newURL != navi.getFakeURL()){
		navi.setFakeURL(e.newURL)
		if (e.oldURL != e.newURL){
			hashChangeRecover(e, soft);
		}
	}
};
(function(){
	var url = window.location && location.hash.replace(/^\#/,'');
	if (url){
		su.on('handle-location', function() {
			hashchangeHandler({
				newURL: url
			}, true);

		});
	}
})();





