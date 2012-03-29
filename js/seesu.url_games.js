if (app_env.needs_url_history) {
	if ('onhashchange' in window){
		(function(){
			var hash = location.hash.replace(/^\#/, '');
			window.onhashchange = function(e){
				e = e || window.Event;
				var newhash = location.hash.replace(/^\#/, '');
				if (newhash != hash){
					var hnew = decodeURI(e.newURL || newhash);
					var hold = decodeURI(e.oldURL || hash);
					var have_new_hash = hnew.indexOf('#')+1;
					var have_old_hash = hold.indexOf('#')+1;

					var o = {
						newURL: have_new_hash ? hnew.slice(have_new_hash) : '',
						oldURL: have_old_hash ? hold.slice(have_old_hash) : ''
					};


					var too_fast_hash_change = (o.newURL != newhash);
					if (!too_fast_hash_change){
						if (typeof hashchangeHandler == 'function'){
							hashchangeHandler(o)
						}
						hash = newhash;
					}
					
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
				uniq_url	= url.replace(/\ /gi, '+') + (tag || (' $' + this.getUniqId()));

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
			case 'chart':
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
}

//su.UILoaded(function(){});
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
	if (divider != -1){
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
			break
		case 'album':
			su.ui.showAlbum({
				album_name: pldata.album_name,
				artist: pldata.artist
			}, {no_navi: true, from_artcard: has_artcard, save_parents: true}, start_song);
			break
		case 'top':
			su.ui.showTopTacks(pldata.artist, {no_navi: true, from_artcard: has_artcard, save_parents: true}, start_song);
			break
		case 'tag':
			su.ui.show_tag(pldata.tag_name, {no_navi: true, save_parents: true}, start_song);
			break
		case 'recommendations':
			if (start_song){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			break
		case 'cplaylist':
			if (start_song){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			break
		case 'chart':
			if (start_song){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			} else{
				su.ui.showMetroChart(pldata.country, pldata.metro, {no_navi: true, save_parents: true});
			}
			break
		case 'loved':
			if (start_song){
				su.ui.showTopTacks(start_song.artist, {no_navi: true, save_parents: true}, start_song);
			}
			break
		case 'directsearch':
			su.ui.showTrackById({type: pldata.source, id: pldata.rawid}, {no_navi: true, save_parents: true});
			break
		default:
			;
	}
};

var recoverHistoryTreeBranch = function(branch, sub_branch, prev_branch){
	var sub_branch_handled;
	switch (branch.type) {
		case 'search':
			su.views.showResultsPage(branch.data.query, true);
			break
		case 'artcard':
			su.views.showArtcardPage(branch.data.artist, true, true);
			break
		case 'pl':
			var song;
			
			if (sub_branch && sub_branch.type == 'track'){
				song = sub_branch.data;
				sub_branch_handled = true;
			}
			recoverPlaylistBranch(branch.data, song, prev_branch && prev_branch.type == 'artcard')

			
			break
		case 'track':
			//this.getLovedData(pth, con)
			break
		default:
			;
	}
	return sub_branch_handled;
};


var hashChangeQueue = new funcsQueue(0);
 

var hashChangeRecover = function(e){
	var url = e.newURL.replace(/([^\/])\+/g, '$1 ');

	
	var state_from_history = navi.findHistory(e.newURL);
	if (state_from_history){
		var dl = gunm(state_from_history.data);

		if (dl.live.length){
			var deepest = dl.live[dl.live.length -1];
			if (!deepest.isOpened()){
				su.views.restoreFreezed(!!dl.dead.length, true);
			}
			deepest.sliceTillMe(!!dl.dead.length, true);
		} else{
			su.views.showStartPage(true);
		}
		
		if (dl.dead.length){
			for (var i=0; i < dl.dead.length; i++) {
				su.views.m.resurrectLevel(dl.dead[i], i != dl.dead.length - 1, true );
			};
		}	
	} else{
		var jn = getFakeURLParameters(url.replace(/\ ?\$...$/, ''));
		su.views.showStartPage(true);
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
(function(){
	var url = window.location && decodeURI(location.hash.replace(/^\#/,''));
	if (url){
		su.onUICreation(function(opts){
			if (!opts.state_recovered && !opts.has_query){
				hashchangeHandler({
					newURL: url
				});
			}
		});
	}
})();





